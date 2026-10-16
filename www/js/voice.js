/* Queued speech. Native TTS Advanced on Android, Web Speech in a browser. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ApexVoice=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const defaults={enabled:true,verbosity:'normal',locale:'en-GB',voiceId:'',rate:0.95,pitch:1};
let settings={...defaults};let queue=[];let running=false;let generation=0;let selectedVoices=[];
const settingsKey='apex_v170_audio';
function load(){try{settings={...defaults,...JSON.parse(localStorage.getItem(settingsKey)||'{}')};}catch(e){settings={...defaults};}return settings;}
function configure(data){settings={...settings,...data};try{localStorage.setItem(settingsKey,JSON.stringify(settings));}catch(e){}return settings;}
function options(){return {...settings};}
function nativeAvailable(){return typeof window!=='undefined'&&window.TTS&&typeof window.TTS.speak==='function';}
async function listVoices(){
 try{if(nativeAvailable()&&typeof window.TTS.getVoices==='function'){
   const v=await window.TTS.getVoices();selectedVoices=(v||[]).map(x=>({id:x.identifier,name:x.name||x.identifier,lang:x.language||''}));return selectedVoices;
 }}catch(e){console.warn('Native voices',e);}
 if(typeof window!=='undefined'&&window.speechSynthesis){
   selectedVoices=window.speechSynthesis.getVoices().map(x=>({id:x.voiceURI,name:x.name,lang:x.lang}));
 }
 return selectedVoices;
}
function cancel(){queue=[];generation++;if(nativeAvailable()&&window.TTS.stop){try{window.TTS.stop();}catch(e){}}if(typeof window!=='undefined'&&window.speechSynthesis){window.speechSynthesis.cancel();}}
function speak(text,priority=false){
 if(!settings.enabled||!text)return Promise.resolve();
 if(priority)cancel();
 return new Promise(resolve=>{queue.push({text:String(text),resolve});pump();});
}
async function pump(){if(running)return;running=true;
 while(queue.length){const req=queue.shift();const myGen=generation;try{await speakOne(req.text);}catch(e){console.warn('Speech unavailable',e);}req.resolve();if(myGen!==generation)continue;}
 running=false;if(queue.length)pump();
}
function speakOne(text){return new Promise((resolve)=>{
  if(typeof window==='undefined')return resolve();
  if(nativeAvailable()){
    try{
      const opts={text,locale:settings.locale,rate:settings.rate,pitch:settings.pitch,cancel:false};
      if(settings.voiceId)opts.identifier=settings.voiceId;
      const r=window.TTS.speak(opts);
      if(r&&typeof r.then==='function')r.then(resolve,()=>webSpeech(text).then(resolve));
      else resolve();
      return;
    }catch(e){webSpeech(text).then(resolve);return;}
  }
  webSpeech(text).then(resolve);
 });}
function webSpeech(text){return new Promise(resolve=>{
 if(typeof window==='undefined'||!window.speechSynthesis||!window.SpeechSynthesisUtterance)return resolve();
 const u=new window.SpeechSynthesisUtterance(text);
 u.lang=settings.locale;u.rate=Math.max(.6,Math.min(1.35,settings.rate));u.pitch=Math.max(.6,Math.min(1.4,settings.pitch));
 const voices=window.speechSynthesis.getVoices();
 const voice=voices.find(v=>v.voiceURI===settings.voiceId)||voices.find(v=>v.lang===settings.locale)||voices.find(v=>v.lang?.startsWith('en'));
 if(voice)u.voice=voice;
 u.onend=resolve;u.onerror=resolve;
 try{window.speechSynthesis.speak(u);}catch(e){resolve();}
 });}
function turn(name,description,checkout){
 if(!settings.enabled)return;
 let s=`${name}, your turn. ${description}.`;
 if(checkout&&checkout.type==='checkout'&&settings.verbosity!=='minimal')s+=` You require ${checkout.score}. ${checkout.speech}.`;
 else if(checkout&&checkout.type==='setup'&&settings.verbosity==='detailed')s+=` ${checkout.speech}.`;
 speak(s,true);
}
function afterThrow(event,match,checkout){
 if(!settings.enabled)return;
 if(match.finished){speak(event.speech+' '+match.result,true);return;}
 if(event.bust){speak('Bust! '+(match.mode==='x01'?'Score restored.':''),true);return;}
 if(event.turnEnded){
   const next=match.players[match.current];
   if(match.players.length===1){if(match.mode==='x01'&&checkout?.type==='checkout')speak(`${checkout.score} remaining. ${checkout.speech}.`,true);return;}
   let nextCheckout='';
   if(match.mode==='x01'&&checkout&&checkout.type==='checkout'&&settings.verbosity!=='minimal')nextCheckout=` Checkout: ${checkout.speech}.`;
   speak(`${event.visitTotal===180?'One hundred and eighty! ':''}${next.spokenName||next.name}, your turn. ${next.score&&match.mode==='x01'?next.score+' remaining.':''}${nextCheckout}`,true);
   return;
 }
 if(settings.verbosity==='detailed'){
   let t=event.hit?`Hit ${event.code}.`:`${event.code==='MISS'?'Miss.':'Off target.'}`;
   if(match.mode==='x01'&&checkout)t+=` ${checkout.score} remaining. ${checkout.speech}.`;
   speak(t,true);
 }else if(match.mode==='x01'&&checkout&&checkout.type==='checkout'&&event.hit){speak(`${checkout.score} remaining. ${checkout.speech}.`,true);}
}
function preview(){return speak('Apex Darts Pro. One hundred and eighty! Game shot and the match!',true);}
if(typeof window!=='undefined')load();
return {load,configure,options,listVoices,speak,cancel,turn,afterThrow,preview};
});
