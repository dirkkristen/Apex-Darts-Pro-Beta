/* Apex Darts Pro - deterministic, DOM-free scoring engine. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ApexEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MODES={x01:'X01',circuit:'21 Darts Circuit',xld:'Extra Long Darts',cricket:'American Cricket',killer:'Killer',shanghai:'Shanghai',clock:'Round the Clock',sniper:'Neon Sniper',countup:'Count Up',bob27:"Bob's 27",halveit:'Halve-It',bingo:'Apex Bingo',gauntlet:'Apex Gauntlet',checkout121:'121 Checkout'};
const CRICKET=[20,19,18,17,16,15,25];
const GAUNTLET=[{n:20,m:1,label:'Single 20'},{n:16,m:2,label:'Double 16'},{n:19,m:3,label:'Triple 19'},{n:25,m:1,label:'Any Bull'},{n:20,m:3,label:'Triple 20'},{n:20,m:2,label:'Double 20'}];
const BINGO=[{label:'T20',n:20,m:3},{label:'D16',n:16,m:2},{label:'BULL',n:25,m:0},{label:'T19',n:19,m:3},{label:'D20',n:20,m:2},{label:'ANY TRIPLE',n:0,m:3},{label:'S15',n:15,m:1},{label:'D10',n:10,m:2},{label:'S20',n:20,m:1}];
const HALVE=[20,19,18,17,16,15,25];
function id(){return Math.random().toString(36).slice(2,10);}
function randomTarget(){return 1+Math.floor(Math.random()*20);}
function compactCode(n,m){return n===0?'MISS':n===25?(m===2?'DB':'SB'):`${m===1?'S':m===2?'D':'T'}${n}`;}
function makePlayer(p,mode,config,i){
 const v={id:p.id||id(),localId:p.localId||p.id||null,ownerUid:p.ownerUid||null,name:String(p.name||`Player ${i+1}`).slice(0,32),spokenName:String(p.spokenName||p.name||`Player ${i+1}`).slice(0,40),stats:{darts:0,boardHits:0,targetHits:0,raw:0,scored:0,visits:0,bestVisit:0,ton100:0,ton140:0,ton180:0,successfulDoubles:0,doubleAttempts:0},target:1,points:0,score:0,marks:{},stage:0,finished:false,eliminated:false};
 if(mode==='x01'){v.score=Number(config.startScore||501);v.open=!config.doubleIn;v.turnStartScore=v.score;}
 if(mode==='xld'){v.target=Number(config.xldStart||1);v.marks={S:false,D:false,T:false};}
 if(mode==='cricket'){for(const n of CRICKET)v.marks[n]=0;}
 if(mode==='killer'){v.assigned=Number(config.killerNumbers?.[i]||i+1);v.killer=false;v.lives=3;}
 if(mode==='sniper'){v.target=randomTarget();v.targetMarks=0;}
 if(mode==='bob27'){v.score=27;v.target=1;}
 if(mode==='checkout121'){v.target=121;v.score=121;v.turnStartScore=121;v.completed=0;v.attemptDarts=0;v.highestCheckout=0;}
 if(mode==='bingo'){v.board=Array(9).fill(false);}
 return v;
}
function create({mode='x01',config={},players=[{name:'Player 1'}]}={}){
 if(!MODES[mode])throw new Error('Unknown game mode');
 if(!Array.isArray(players)||players.length===0)throw new Error('Select at least one player');
 if(mode==='killer'&&players.length<2)throw new Error('Killer needs at least 2 players');
 if(players.length>16)throw new Error('Maximum 16 players');
 const cfg={startScore:501,doubleOut:true,doubleIn:false,bestOfLegs:1,circuitLength:20,innerBull:false,xldStart:1,xldEnd:20,xldFinish:'none',cricketVariant:'standard',killerVariant:'double',shanghaiRounds:7,clockJumps:false,sniperLimit:21,sniperRotation:'rotating',countupRounds:8,checkoutLevels:5,...config};
 if(mode==='killer'){
   const pool=Array.from({length:20},(_,i)=>i+1);
   for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
   cfg.killerNumbers=players.map((_,i)=>pool[i%pool.length]);
 }
 const match={schema:2,matchId:id(),mode,config:cfg,players:players.map((p,i)=>makePlayer(p,mode,cfg,i)),current:0,dartsInTurn:0,visitPoints:0,visitHits:0,visitMisses:0,visitMarks:[],round:1,turnsInRound:0,legNumber:1,legStarter:0,finished:false,winners:[],result:'',lastAction:'Select your target and throw.',log:[],revision:0};
 return match;
}
function current(m){return m.players[m.current];}
function targetDescription(m,p=current(m)){
 switch(m.mode){
 case'x01':return p.open?`${p.score} remaining`:`Double in · ${p.score} remaining`;
 case'circuit':return p.target>m.config.circuitLength?(m.config.innerBull?'INNER BULL':'ANY BULL'):`Target ${p.target} · ${3-p.points} marks to clear`;
 case'xld':return p.target>m.config.xldEnd?'BULL TO FINISH':`Target ${p.target} · S ${p.marks.S?'✓':'–'} D ${p.marks.D?'✓':'–'} T ${p.marks.T?'✓':'–'}`;
 case'cricket':return 'Close 20 → 15 and bull';
 case'killer':return p.killer?`KILLER · ${p.lives} lives`:`Hit ${m.config.killerVariant==='triple'?'T':'D'}${p.assigned} to become Killer`;
 case'shanghai':return `Round ${m.round} · target ${m.round}`;
 case'clock':return `Target ${p.target}`;
 case'sniper':return `Neon target ${p.target} · ${p.points} pts`;
 case'countup':return `Round ${m.round}/${m.config.countupRounds} · ${p.score} points`;
 case'bob27':return `Double ${p.target} · ${p.score} points`;
 case'halveit':return `Round ${m.round} · target ${HALVE[m.round-1]===25?'BULL':HALVE[m.round-1]}`;
 case'bingo':return 'Complete any row, column or diagonal';
 case'gauntlet':return GAUNTLET[p.stage]?.label||'Challenge complete';
 case'checkout121':return `${p.score} remaining · 9 dart challenge ${p.target}`;
 default:return '';
 }
}
function finish(m,winners,message){m.finished=true;m.winners=winners;m.result=message||'Match complete';m.lastAction=m.result;}
function win(m,p,description){p.finished=true;finish(m,[p.id],`${p.name} wins!${description?' '+description:''}`);}
function boardHit(m,p,n,mu){return n>0;}
function endTurn(m,event){
 const p=current(m), c=m.config;
 event.visitTotal=m.visitPoints;
 p.stats.visits++;
 p.stats.bestVisit=Math.max(p.stats.bestVisit,m.visitPoints);
 if(m.visitPoints>=180)p.stats.ton180++;
 else if(m.visitPoints>=140)p.stats.ton140++;
 else if(m.visitPoints>=100)p.stats.ton100++;
 if(m.mode==='x01'){p.turnStartScore=p.score;}
 if(m.mode==='bob27'){
   if(m.visitHits===0){p.score-=p.target*2;event.notes.push(`Halved target penalty: -${p.target*2}`);}
   p.target++;
   if(p.score<0)p.eliminated=true;
   if(p.target>20)p.finished=true;
 }
 if(m.mode==='halveit'){
   if(m.visitHits===0){p.score=Math.floor(p.score/2);event.notes.push('No hits — score halved');}
 }
 if(m.mode==='checkout121'){
   if(!p.finished){if(!event.advancedLevel)p.attemptDarts+=m.dartsInTurn;
     if(p.attemptDarts>=9){p.attemptDarts=0;p.score=p.target;p.turnStartScore=p.score;event.notes.push('Nine darts used — retry the checkout');}
   }
 }
 m.dartsInTurn=0;m.visitPoints=0;m.visitHits=0;m.visitMisses=0;m.visitMarks=[];
 if(m.mode==='shanghai'||m.mode==='countup'||m.mode==='halveit'){
   m.turnsInRound++;
   if(m.turnsInRound>=m.players.length){m.turnsInRound=0;m.round++;
     const rounds=m.mode==='shanghai'?Number(c.shanghaiRounds):m.mode==='countup'?Number(c.countupRounds):HALVE.length;
     if(m.round>rounds){const max=Math.max(...m.players.map(x=>x.score||x.points));
       const winners=m.players.filter(x=>(x.score||x.points)===max).map(x=>x.id);
       finish(m,winners,winners.length>1?'Match tied!':`${m.players.find(x=>x.id===winners[0]).name} wins with ${max} points!`);return;}
   }
 }
 if(m.mode==='bob27'){
   if(m.players.every(x=>x.finished||x.eliminated)){
     const survivors=m.players.filter(x=>!x.eliminated);if(!survivors.length){finish(m,[],'Bob’s 27: all players eliminated');return;}const max=Math.max(...survivors.map(x=>x.score));const winners=survivors.filter(x=>x.score===max).map(x=>x.id);
     finish(m,winners,winners.length>1?'Bob’s 27 tied':`${m.players.find(x=>x.id===winners[0]).name} finishes Bob’s 27 with ${max}`);return;
   }
 }
 // Advance past eliminated/finished players. Preserve round counters independently of turn order.
 for(let i=0;i<m.players.length;i++){
   m.current=(m.current+1)%m.players.length;
   if(!m.players[m.current].eliminated&&!m.players[m.current].finished)break;
 }
 if(m.mode==='x01'||m.mode==='checkout121')current(m).turnStartScore=current(m).score;
}
function hasBingo(board){return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].some(line=>line.every(i=>board[i]));}
function throwDart(m,{n=0,mult=1}={}){
 if(m.finished)throw new Error('Match already finished');
 if(!Number.isInteger(n)||n<0||n>25||n>20&&n!==25||![1,2,3].includes(mult)||n===25&&mult===3)throw new Error('Invalid dart');
 if(n===0)mult=1;
 const p=current(m),c=m.config,code=compactCode(n,mult),value=n*mult;
 const event={player:p.name,code,points:value,hit:false,bust:false,finished:false,turnEnded:false,notes:[],party:false,speech:''};
 p.stats.darts++;m.dartsInTurn++;
 if(boardHit(m,p,n,mult)){p.stats.boardHits++;p.stats.raw+=value;}
 if(mult===2&&n>0)p.stats.doubleAttempts++;
 function valid(){event.hit=true;p.stats.targetHits++;m.visitHits++;}
 function add(pts){p.stats.scored+=pts;m.visitPoints+=pts;}
 let winNow=false,forceEndTurn=false,legEnded=false;
 switch(m.mode){
 case 'x01':{
   if(n===0)break;
   if(!p.open&&mult!==2){event.notes.push('Double in required');break;}
   if(!p.open&&mult===2)p.open=true;
   const left=p.score-value;
   if(left<0||(left===1&&c.doubleOut)||(left===0&&c.doubleOut&&mult!==2)){
     event.bust=true;event.notes.push('BUST — score restored to start of visit');
     p.score=p.turnStartScore;p.stats.scored-=m.visitPoints;m.visitPoints=0;break;
   }
   valid();add(value);p.score=left;
   if(left===0){if(mult===2)p.stats.successfulDoubles++;p.legsWon=(p.legsWon||0)+1;if(p.legsWon>=Math.ceil(Number(c.bestOfLegs||1)/2)){winNow=true;}else{legEnded=true;event.notes.push(`${p.name} wins leg ${m.legNumber}`);}}
   break;
 }
 case 'circuit':{
   if(p.target<=c.circuitLength){if(n===p.target){valid();p.points+=mult;if(p.points>=3){p.points=0;p.target++;event.notes.push('Target cleared');}}}
   else if(n===25&&(!c.innerBull||mult===2)){valid();winNow=true;}
   break;
 }
 case 'xld':{
   if(p.target<=c.xldEnd){if(n===p.target){const key=mult===1?'S':mult===2?'D':'T';if(!p.marks[key]){valid();p.marks[key]=true;}if(p.marks.S&&p.marks.D&&p.marks.T){p.marks={S:false,D:false,T:false};p.target++;event.notes.push('S, D and T completed');if(p.target>c.xldEnd&&c.xldFinish==='none')winNow=true;}}}
   else if(n===25&&(c.xldFinish==='any'||(c.xldFinish==='inner'&&mult===2))){valid();winNow=true;}
   break;
 }
 case 'cricket':{
   if(CRICKET.includes(n)){
     const before=p.marks[n],added=mult,pointsMarks=Math.max(0,added-Math.max(0,3-before));p.marks[n]=Math.min(3,before+added);valid();
     if(c.cricketVariant==='standard'&&pointsMarks&&m.players.some(other=>other.id!==p.id&&other.marks[n]<3)) {p.score+=n*pointsMarks;add(n*pointsMarks);}
     if(c.cricketVariant==='cutthroat'&&pointsMarks){m.players.forEach(other=>{if(other.id!==p.id&&other.marks[n]<3){other.score+=n*pointsMarks;}});}
     const closed=CRICKET.every(x=>p.marks[x]===3);
     const leading=m.players.every(other=>other.id===p.id||(c.cricketVariant==='standard'?p.score>=other.score:c.cricketVariant==='cutthroat'?p.score<=other.score:true));
     if(closed&&leading)winNow=true;
   }
   break;
 }
 case 'killer':{
   const need=c.killerVariant==='triple'?3:2;
   if(n&&mult===need){
     if(!p.killer&&n===p.assigned){p.killer=true;valid();event.notes.push('KILLER ACTIVATED');}
     else if(p.killer){const victim=m.players.find(other=>other.id!==p.id&&other.assigned===n&&other.lives>0);
       if(victim){victim.lives--;valid();event.notes.push(`${victim.name} loses a life`);if(victim.lives===0){victim.eliminated=true;event.notes.push(`${victim.name} eliminated`);}if(m.players.filter(x=>!x.eliminated).length===1)winNow=true;}
     }
   }
   break;
 }
 case 'shanghai':{
   if(n===m.round){valid();p.points+=value;add(value);m.visitMarks.push(mult);
     if([1,2,3].every(x=>m.visitMarks.includes(x))){winNow=true;event.notes.push('SHANGHAI!');}
   }
   break;
 }
 case 'clock':{
   if(n===p.target){valid();p.target+=c.clockJumps?mult:1;if(p.target>20)winNow=true;}
   break;
 }
 case 'sniper':{
   if(n===25){p.target=randomTarget();p.targetMarks=0;event.notes.push('Bullseye — new target');}
   else if(n===p.target){valid();p.points+=mult;p.targetMarks+=mult;add(mult);
     if(p.points>=c.sniperLimit)winNow=true;
     else if(c.sniperRotation==='rotating'&&p.targetMarks>=3){const old=p.target;do{p.target=randomTarget();}while(p.target===old);p.targetMarks=0;event.notes.push('Target cleared');}
   }
   break;
 }
 case 'countup':{if(n>0){valid();p.score+=value;add(value);}break;}
 case 'bob27':{if(n===p.target&&mult===2){valid();p.score+=2*n;add(2*n);}break;}
 case 'halveit':{if(n===HALVE[m.round-1]){valid();p.score+=value;add(value);}break;}
 case 'bingo':{let changed=false;for(let i=0;i<BINGO.length;i++){const square=BINGO[i];
   if(!p.board[i]&&(square.n===0||square.n===n)&&(square.m===0||square.m===mult)){p.board[i]=true;changed=true;}}
   if(changed){valid();if(hasBingo(p.board))winNow=true;}
   break;
 }
 case 'gauntlet':{const challenge=GAUNTLET[p.stage];if(challenge&&n===challenge.n&&(mult===challenge.m||challenge.n===25)){valid();p.stage++;event.notes.push(`Stage ${p.stage}/${GAUNTLET.length} complete`);if(p.stage===GAUNTLET.length)winNow=true;}break;}
 case 'checkout121':{
   if(n===0)break;
   const left=p.score-value;
   if(left<0||left===1||(left===0&&mult!==2)){event.bust=true;p.score=p.turnStartScore;p.stats.scored-=m.visitPoints;m.visitPoints=0;event.notes.push('BUST — score restored');break;}
   valid();add(value);p.score=left;
   if(left===0){p.highestCheckout=Math.max(p.highestCheckout,p.target);p.completed++;event.notes.push(`Checkout ${p.target} achieved`);
     if(p.completed>=Number(c.checkoutLevels))winNow=true;
     else{p.target++;p.score=p.target;p.turnStartScore=p.score;p.attemptDarts=0;forceEndTurn=true;event.advancedLevel=true;event.notes.push(`Next checkout ${p.target}`);}
   }
   break;
 }
 }
 m.visitMisses+=!event.hit?1:0;
 if(m.dartsInTurn===3&&m.visitMisses===3)event.party=true;
 m.log.push({player:p.name,playerId:p.id,code,hit:event.hit,notes:event.notes.join('; '),turn:m.round});
 if(m.log.length>300)m.log.shift();
 event.finished=winNow;
 if(winNow){p.stats.visits++;p.stats.bestVisit=Math.max(p.stats.bestVisit,m.visitPoints);win(m,p,event.notes.join('; '));}
 else if(legEnded){p.stats.visits++;p.stats.bestVisit=Math.max(p.stats.bestVisit,m.visitPoints);m.legNumber++;m.legStarter=(m.legStarter+1)%m.players.length;m.current=m.legStarter;m.players.forEach(pl=>{pl.score=Number(c.startScore||501);pl.turnStartScore=pl.score;pl.open=!c.doubleIn;});m.dartsInTurn=0;m.visitPoints=0;m.visitHits=0;m.visitMisses=0;m.visitMarks=[];event.turnEnded=true;}
 else if(m.dartsInTurn>=3||event.bust||forceEndTurn){event.turnEnded=true;endTurn(m,event);}
 m.revision++;
 const action=event.bust?`${p.name}: BUST`:`${p.name}: ${code}${event.hit?' ✓':''}`;
 if(!m.finished)m.lastAction=action+(event.notes.length?` · ${event.notes.join(' · ')}`:'');
 event.speech=event.bust?'Bust!':winNow?'Game shot!':event.notes.length?event.notes.join('. '):event.hit?`Hit ${code}`:'Miss';
 return event;
}
function clone(m){return JSON.parse(JSON.stringify(m));}
return {MODES,CRICKET,GAUNTLET,BINGO,HALVE,create,throwDart,current,targetDescription,compactCode,clone};
});
