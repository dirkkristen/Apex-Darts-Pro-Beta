/* Optional Firebase multiplayer; local games need no network. Friendly-room, not anti-cheat. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ApexOnline=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Firebase client config is intentionally public. Security is enforced using Firebase Database Rules.
const firebaseConfig={apiKey:'AIzaSyDlpUeUAeLWOC3u-T56BejJNSDZXQ5FX0U',authDomain:'apex-darts-pro.firebaseapp.com',databaseURL:'https://apex-darts-pro-default-rtdb.europe-west1.firebasedatabase.app',projectId:'apex-darts-pro',storageBucket:'apex-darts-pro.firebasestorage.app',messagingSenderId:'176136455147',appId:'1:176136455147:web:609eae0ee9fe8e9a050fae'};
let app=null,db=null,uid=null,room=null,code='',role='',user=null,callbacks={},latest=null,hostCreating=false;
function loadScript(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('The multiplayer SDK could not load. Check your internet or APK installation.'));document.head.appendChild(s);});}
async function ensure(){
 if(!db){if(typeof window==='undefined')throw new Error('Online play only works in the application');
   if(!window.firebase){for(const name of ['app','auth','database'])await loadScript(`vendor/firebase-${name}-compat.js`);}
   if(!window.firebase?.apps?.length)window.firebase.initializeApp(firebaseConfig);
   db=window.firebase.database();
 }
 const a=window.firebase.auth();
 const cred=a.currentUser?{user:a.currentUser}:await a.signInAnonymously();
 uid=cred.user.uid;return uid;
}
function options(){return {active:!!room,code,role,uid,latest,authenticated:!!uid};}
function roomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',values=new Uint32Array(10);crypto.getRandomValues(values);return [...values].map(x=>chars[x%chars.length]).join('');}
function reset(){if(room){room.off();try{room.child('presence/'+uid).set(false);}catch(e){}}room=null;code='';role='';user=null;latest=null;hostCreating=false;callbacks={};}
function notify(name,data){try{callbacks[name]?.(data);}catch(e){console.error('Online callback',e);}}
function listen(){
 room.on('value',async snap=>{
   const data=snap.val();if(!data){notify('status','Room closed');return;}
   if(data.state&&(!latest||data.state.revision>latest.revision||data.state.match?.matchId!==latest.match?.matchId)){
     latest=data.state;notify('state',data.state.match);
   }
   if(role==='host'&&data.guest?.uid&&data.status==='waiting'&&!hostCreating){
     hostCreating=true;
     try{const p1={name:user.name,spokenName:user.spokenName||user.name,id:user.localId||'host',localId:user.localId,ownerUid:uid};
         const p2={name:data.guest.name||'Guest',spokenName:data.guest.spokenName||data.guest.name,id:data.guest.localId||'guest',localId:data.guest.localId,ownerUid:data.guest.uid};
         const m=window.ApexEngine.create({mode:data.mode,config:data.config,players:[p1,p2]});
         await room.update({status:'active',state:{match:m,undoMatch:null,revision:0,lastByUid:uid}});
         notify('status','Opponent joined · match started');
     }catch(e){notify('error',e.message);}finally{hostCreating=false;}
   }
   if(role==='host'&&data.status==='active'&&data.state?.match?.finished&&data.rematchHost===true&&data.rematchGuest===true&&!hostCreating){
     hostCreating=true;
     try{const previous=data.state.match;
       const players=previous.players.map(x=>({name:x.name,spokenName:x.spokenName,id:x.id,localId:x.localId,ownerUid:x.ownerUid}));
       const m=window.ApexEngine.create({mode:previous.mode,config:previous.config,players});
       m.current=(previous.current+1)%m.players.length;
       await room.update({state:{match:m,undoMatch:null,revision:0,lastByUid:uid},rematchHost:false,rematchGuest:false});
       notify('status','Rematch started');
     }catch(e){notify('error',e.message);}finally{hostCreating=false;}
   }
   if(data.presence){const peerUid=role==='host'?data.guest?.uid:data.hostUid;if(peerUid&&data.presence[peerUid]===false)notify('status','Opponent disconnected · reconnecting possible');}
   if(data.status==='waiting')notify('status',role==='host'?'Waiting for your opponent…':'Waiting for host…');
 });
}
async function presence(){const r=room.child('presence/'+uid);await r.onDisconnect().set(false);await r.set(true);}
async function host({player,mode,config,events}){
 await ensure();reset();role='host';user=player;callbacks=events||{};
 for(let retry=0;retry<7;retry++){
   code=roomCode();room=db.ref('betaRooms/'+code);
   const result=await room.transaction(value=>value===null?{status:'waiting',hostUid:uid,hostName:player.name,mode,config,createdAt:window.firebase.database.ServerValue.TIMESTAMP,rematchHost:false,rematchGuest:false}:undefined);
   if(result.committed){await presence();listen();notify('status','Waiting for your opponent…');return code;}
 }
 reset();throw new Error('Could not reserve a room. Please retry.');
}
async function join({roomCode:joinCode,player,events}){
 await ensure();reset();role='guest';user=player;callbacks=events||{};code=String(joinCode).trim().toUpperCase();
 if(!/^[A-HJ-NP-Z2-9]{10}$/.test(code))throw new Error('Room code must contain 10 letters/numbers.');
 room=db.ref('betaRooms/'+code);
 const result=await room.child('guest').transaction(value=>value===null?{uid,name:player.name,spokenName:player.spokenName||player.name,localId:player.localId}:undefined);
 if(!result.committed){reset();throw new Error('Room missing, full, or already in progress.');}
 await presence();listen();return code;
}
function ownTurn(match){return uid&&match?.players?.[match.current]?.ownerUid===uid;}
async function commitMatch(nextMatch,previousMatch){
 if(!room||!latest)throw new Error('Not connected to a match');
 const oldRevision=latest.revision;
 const result=await room.child('state').transaction(cur=>{
   if(!cur||cur.revision!==oldRevision||!ownTurn(cur.match))return;
   return{match:nextMatch,undoMatch:previousMatch,revision:oldRevision+1,lastByUid:uid};
 });
 if(!result.committed)throw new Error('Match changed on the other device. State refreshed.');
 latest=result.snapshot.val();return latest.match;
}
async function undo(){
 if(!room||!latest||latest.lastByUid!==uid||!latest.undoMatch)throw new Error('Only your most recent online action can be undone.');
 const rev=latest.revision;
 const result=await room.child('state').transaction(cur=>{
   if(!cur||cur.revision!==rev||cur.lastByUid!==uid||!cur.undoMatch)return;
   const prior=cur.undoMatch;prior.revision=(cur.match.revision||0)+1;
   return{match:prior,undoMatch:null,revision:rev+1,lastByUid:uid};
 });
 if(!result.committed)throw new Error('Undo no longer available');latest=result.snapshot.val();return latest.match;
}
async function rematch(){if(!room||!latest?.match?.finished)throw new Error('Finish the current match first');await room.child(role==='host'?'rematchHost':'rematchGuest').set(true);notify('status','Rematch requested · waiting for other player');}
return{ensure,options,host,join,commitMatch,undo,rematch,reset,ownTurn};
});
