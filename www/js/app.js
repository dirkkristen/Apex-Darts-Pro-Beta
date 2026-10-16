/* Apex Darts Pro v1.70 — responsive UI and local game controller. */
(function(){
'use strict';
const E=window.ApexEngine,C=window.ApexCheckout,V=window.ApexVoice,O=window.ApexOnline;
const $=id=>document.getElementById(id);
const STORE={players:'apex_v170_players',match:'apex_v170_match',settings:'apex_v170_settings',saved:'apex_v170_settled',lastMode:'apex_v170_lastmode',input:'apex_v170_inputmode'};
const safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const number=n=>Number.isFinite(Number(n))?Number(n):0;
const METADATA={
 x01:{category:'classic',symbol:'◎',detail:'101 · 301 · 501 · 701 · 1001',description:'Count down to zero, with authentic double-in and double-out rules.',help:'Score each dart until exactly zero. Choose Double In, Double Out, legs and match preferences. Bust restores the score at the start of the visit.'},
 circuit:{category:'arcade',symbol:'◉',detail:'Original Apex classic',description:'Clear each target using three marks, then finish on bull.',help:'Singles count one mark, doubles two, triples three. Clear 1 to your selected final number, then hit the bullseye.'},
 xld:{category:'arcade',symbol:'✧',detail:'S · D · T at every target',description:'Hit a single, double AND triple before moving up.',help:'At each number, hit a single, a double and a triple. Optional bull finish.'},
 cricket:{category:'classic',symbol:'♜',detail:'Standard · Cut-throat · No score',description:'Close 15–20 and bull while managing your points.',help:'Three marks close each number (15 to 20 and Bull). Score extras on numbers still open to an opponent. Cut-throat adds points to opponents, and lowest score wins.'},
 killer:{category:'arcade',symbol:'☠',detail:'Elimination for 2+ players',description:'Become the Killer and eliminate opponents.',help:'Hit the assigned double (or triple) to become a Killer; then strike opponents’ assigned numbers to remove their three lives.'},
 shanghai:{category:'classic',symbol:'✷',detail:'Single · Double · Triple',description:'Build points on each round target. Shanghai is instant victory.',help:'Every round changes the target from 1 onward. Hit a single, double and triple of that number in one 3-dart visit for instant victory.'},
 clock:{category:'classic',symbol:'◷',detail:'1 → 20',description:'Race around all twenty segments in order.',help:'Hit your current target to advance. With multiplier jumps, double advances two steps and triple three.'},
 sniper:{category:'arcade',symbol:'⌖',detail:'Rotating neon targets',description:'Hit the highlighted number and rack up points.',help:'A single/double/triple on your target earns 1/2/3 points. The bullseye resets the target. Rotating targets switch after 3 points.'},
 countup:{category:'classic',symbol:'↑',detail:'High-score challenge',description:'Score as many points as possible over a fixed number of rounds.',help:'Every dart counts its ordinary face value. Most points when the final round ends wins.'},
 bob27:{category:'training',symbol:'27',detail:'Doubles accuracy',description:'Start with 27 and survive all doubles from D1 to D20.',help:'Start on 27. For each number 1–20, hit the double three times. Add twice that number for each hit, or subtract the same value if you miss with all three darts. A negative score eliminates you.'},
 halveit:{category:'arcade',symbol:'½',detail:'Seven-round survival',description:'Miss all three at a target and your entire score is halved.',help:'Throw three darts each at 20, 19, 18, 17, 16, 15 and Bull. Hits accumulate face value. No hits in a round means your score is halved.'},
 bingo:{category:'arcade',symbol:'▦',detail:'Original Apex',description:'Complete a row of nine different dartboard challenges.',help:'Mark any three challenges in a horizontal, vertical or diagonal line of the 3×3 card. All players share the same nine challenges.'},
 gauntlet:{category:'training',symbol:'⚡',detail:'Original Apex',description:'Six successive accuracy challenges with increasing difficulty.',help:'Complete Single 20, Double 16, Triple 19, Any Bull, Triple 20 and Double 20 in order, using the fewest darts.'},
 checkout121:{category:'training',symbol:'121',detail:'Nine-dart checkout practice',description:'Master 121, then 122, 123 and onwards.',help:'You have nine darts to complete each double-out checkout. A successful finish advances the target by one; a failed attempt restarts the same target. Reach your selected level count to win.'}
};
const storage={getItem(key){try{return window.localStorage.getItem(key);}catch(e){return null;}},setItem(key,value){try{window.localStorage.setItem(key,value);}catch(e){}}};
const loadJSON=(key,fallback)=>{try{const s=storage.getItem(key);return s?JSON.parse(s):fallback;}catch(e){return fallback;}};
const persist=(key,value)=>{try{storage.setItem(key,JSON.stringify(value));}catch(e){console.warn('Local storage',e);}};
function createProfile(name,p={}){return{id:p.id||'pl_'+Math.random().toString(36).slice(2,10),name:String(name||'Player 1').slice(0,24),spokenName:String(p.spokenName||name||'Player 1').slice(0,40),active:p.active!==false,played:number(p.played??p.gamesPlayed),won:number(p.won??p.gamesWon),darts:number(p.darts??p.totalDarts),targetHits:number(p.targetHits??p.totalHits),boardHits:number(p.boardHits??p.totalHits),scored:number(p.scored??p.totalScoredPoints),bestVisit:number(p.bestVisit??p.highestTurnScore),ton100:number(p.ton100??p.tonPlusCount),ton140:number(p.ton140??p.tonFortyPlusCount),ton180:number(p.ton180??p.tonEightyCount),checkoutSuccess:number(p.checkoutSuccess),doubleAttempts:number(p.doubleAttempts),x01Darts:number(p.x01Darts),x01Scored:number(p.x01Scored)};}
function readPlayers(){let v=loadJSON(STORE.players,null);if(!v){const old=loadJSON('apexDartPlayers',null);v=Array.isArray(old)?old.map(p=>createProfile(p.name,p)):[createProfile('Player 1')];}return v.length?v:[createProfile('Player 1')];}
let profiles=readPlayers(),selectedMode=storage.getItem(STORE.lastMode)||'x01',match=null,history=[],showingModal=false,lastScreen='home-screen',currentInput=storage.getItem(STORE.input)||'board',multiplier=1,turnStartedAt=Date.now(),clockPaused=false,pausedAt=0,clockReminded=new Set(),timerInterval=null,pendingOnline=false,onlineSetup=null,toastTimer=null,afterWinShown='',wakeLock=null,uiSettings={keepAwake:true,shotClock:true,party:false,partyStyle:'dares',shotThreshold:45,...loadJSON(STORE.settings,{})},settledIds=loadJSON(STORE.saved,[]);
function savePlayers(){persist(STORE.players,profiles);}
function toast(text){const t=$('toast');t.textContent=text;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),2700);}
function show(screen){lastScreen=screen;document.querySelectorAll('.screen').forEach(el=>el.classList.toggle('active',el.id===screen));$('app-header').hidden=screen==='game-screen'||screen==='winner-screen';$('tabbar').hidden=screen==='game-screen'||screen==='winner-screen';document.querySelectorAll('.tabbar button').forEach(el=>el.classList.toggle('selected',((screen==='home-screen'&&el.dataset.action==='home')||(screen==='modes-screen'&&el.dataset.action==='show-modes')||(screen==='players-screen'&&el.dataset.action==='show-players')||(screen==='stats-screen'&&el.dataset.action==='show-stats'))));window.scrollTo(0,0);}
function modal(html){$('modal-body').innerHTML=html;$('overlay').hidden=false;showingModal=true;}
function closeModal(){$('overlay').hidden=true;$('modal-body').innerHTML='';showingModal=false;}
function toastError(e){toast(e?.message||String(e));console.error(e);}
function playClick(positive=true){if(!V.options().enabled)return;try{const ctx=window._apexAudioContext||(window._apexAudioContext=new (window.AudioContext||window.webkitAudioContext)());if(ctx.state==='suspended')ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;osc.frequency.setValueAtTime(positive?690:160,t);osc.frequency.exponentialRampToValueAtTime(positive?410:80,t+.095);gain.gain.setValueAtTime(.09,t);gain.gain.exponentialRampToValueAtTime(.001,t+.12);osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.12);}catch(e){} }
function selectedProfiles(){let p=profiles.filter(x=>x.active);if(!p.length){profiles[0].active=true;savePlayers();p=[profiles[0]];}return p;}
function renderHome(){const el=$('home-player-badges');el.innerHTML=selectedProfiles().map(p=>`<span class="chip">${safe(p.name)}</span>`).join('');}
function renderModes(category='all'){$('mode-grid').innerHTML=Object.entries(METADATA).filter(([k,v])=>category==='all'||v.category===category).map(([mode,info])=>`<button class="mode-card" data-action="choose-mode" data-mode="${mode}"><span class="mode-symbol">${info.symbol}</span><strong>${safe(E.MODES[mode])}</strong><p>${safe(info.description)}</p><span class="mode-category">${info.category.toUpperCase()} ↗</span></button>`).join('');}
function modes(){renderModes();document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x.dataset.category==='all'));show('modes-screen');}
function configFields(mode){const opts={x01:`${select('startScore','STARTING SCORE',[[101,'101'],[301,'301'],[501,'501'],[701,'701'],[1001,'1001']],501)}${select('bestOfLegs','MATCH LENGTH',[[1,'Single leg'],[3,'Best of 3 legs'],[5,'Best of 5 legs'],[7,'Best of 7 legs']],1)}${check('doubleIn','Require double to begin',false)}${check('doubleOut','Require double to finish',true)}`,
 circuit:`${select('circuitLength','LAST NUMBER',[[5,'5'],[10,'10'],[15,'15'],[20,'20']],20)}${check('innerBull','Require inner bull to win',false)}`,
 xld:`${select('xldStart','START NUMBER',Array.from({length:20},(_,i)=>[i+1,i+1]),1)}${select('xldEnd','END NUMBER',Array.from({length:20},(_,i)=>[i+1,i+1]),20)}${select('xldFinish','BULL FINISH',[['none','No bull finish'],['any','Any bull'],['inner','Inner bull only']],'none')}`,
 cricket:select('cricketVariant','VARIANT',[['standard','Standard'],['cutthroat','Cut-throat'],['noscore','No-score']],'standard'),
 killer:select('killerVariant','KILLER TARGET',[['double','Double'],['triple','Triple']],'double'),
 shanghai:select('shanghaiRounds','ROUNDS',[[7,'7 rounds'],[20,'20 rounds']],7),
 clock:check('clockJumps','Multipliers jump 2 or 3 numbers',false),
 sniper:`${select('sniperLimit','POINTS TO WIN',[[15,15],[21,21],[30,30]],21)}${select('sniperRotation','TARGET ROTATION',[['rotating','Rotate after 3 points'],['static','Keep target until bull reset']],'rotating')}`,
 countup:select('countupRounds','ROUNDS',[[5,5],[8,8],[10,10],[15,15]],8),
 bob27:'<p class="hint">Start with 27 points; each double has three attempts.</p>',
 halveit:'<p class="hint">Targets: 20 → 19 → 18 → 17 → 16 → 15 → Bull.</p>',
 bingo:'<p class="hint">Complete 3 challenges in a straight line to win.</p>',
 gauntlet:'<p class="hint">Clear 6 increasingly tricky targets in order.</p>',
 checkout121:select('checkoutLevels','CHALLENGES TO COMPLETE',[[3,'3 levels'],[5,'5 levels'],[10,'10 levels']],5)};return opts[mode]||'';}
function select(key,label,values,def){return `<label for="cfg-${key}">${safe(label)}</label><select id="cfg-${key}" data-config="${key}">${values.map(([v,text])=>`<option value="${safe(v)}" ${String(v)===String(def)?'selected':''}>${safe(text)}</option>`).join('')}</select>`;}
function check(key,label,checked){return `<label class="toggle"><span>${safe(label)}</span><input type="checkbox" id="cfg-${key}" data-config="${key}" ${checked?'checked':''}></label>`;}
function setup(mode){selectedMode=mode;storage.setItem(STORE.lastMode,mode);$('setup-title').textContent=E.MODES[mode];$('setup-name').textContent=E.MODES[mode];$('setup-description').textContent=METADATA[mode].description;$('setup-options').innerHTML=configFields(mode);const remembered=loadJSON('apex_v170_cfg_'+mode,{});document.querySelectorAll('[data-config]').forEach(el=>{if(remembered[el.dataset.config]!==undefined){if(el.type==='checkbox')el.checked=!!remembered[el.dataset.config];else el.value=String(remembered[el.dataset.config]);}});renderSetupPlayers();show('setup-screen');}
function getConfig(){const data={};document.querySelectorAll('[data-config]').forEach(el=>{const val=el.type==='checkbox'?el.checked:el.value;data[el.dataset.config]=el.type==='checkbox'?val:/^-?\d+$/.test(val)?Number(val):val;});if(selectedMode==='xld'&&data.xldStart>data.xldEnd){const v=data.xldStart;data.xldStart=data.xldEnd;data.xldEnd=v;}persist('apex_v170_cfg_'+selectedMode,data);return data;}
function renderSetupPlayers(){$('setup-player-list').innerHTML=profiles.map(p=>`<label class="player-toggle"><input type="checkbox" data-player-active="${safe(p.id)}" ${p.active?'checked':''}>${safe(p.name)}</label>`).join('');}
function playerScreen(){renderPlayers();show('players-screen');}
function renderPlayers(){$('player-cards').innerHTML=profiles.map((p,i)=>`<div class="person-card"><div class="person-top"><div><div class="person-name">${safe(p.name)}</div><div class="person-meta">${p.won} wins · ${p.played} games · ${p.darts} darts</div></div><div class="person-actions"><button class="mini-icon" data-action="rename-player" data-index="${i}" aria-label="Rename player">✎</button><button class="mini-icon" data-action="pronunciation-player" data-index="${i}" aria-label="Set spoken pronunciation">♬</button><button class="mini-icon danger" data-action="remove-player" data-index="${i}" aria-label="Delete player">×</button></div></div><label class="toggle" style="display:flex;align-items:center;gap:7px;margin-top:9px;color:#a9c3cc;font-size:12px;"><input type="checkbox" data-player-active="${safe(p.id)}" ${p.active?'checked':''}> Playing today</label></div>`).join('');}
function modeScore(p){switch(match.mode){case 'x01':return p.score;case 'circuit':return p.target>match.config.circuitLength?'BULL':p.target;case 'xld':return p.target>match.config.xldEnd?'BULL':p.target;case 'cricket':return p.score;case 'killer':return p.lives+' ♥';case 'shanghai':case 'sniper':return p.points;case 'clock':case 'bob27':return p.target>20?'DONE':p.target;case 'countup':case 'halveit':case 'checkout121':return p.score;case 'bingo':return p.board.filter(Boolean).length+'/9';case 'gauntlet':return p.stage+'/6';default:return p.score;}}
function scoreCaption(p){switch(match.mode){case'x01':return `${p.legsWon||0} LEG${p.legsWon===1?'':'S'} WON`;case'circuit':return `${p.points}/3 MARKS`;case'xld':return [p.marks.S?'S✓':'S–',p.marks.D?'D✓':'D–',p.marks.T?'T✓':'T–'].join(' ');case'cricket':return 'CRICKET POINTS';case'killer':return p.killer?'KILLER':'NOT KILLER';case'checkout121':return `${p.completed} CHECKOUTS`;case'gauntlet':return 'STAGES CLEARED';default:return 'GAME SCORE';}}
function currentAdvice(){if(!match||match.mode!=='x01'&&match.mode!=='checkout121')return null;const p=E.current(match);if(match.mode==='x01'&&p.score>170)return null;if(match.mode==='x01'&&!p.open)return null;return C.advice(p.score,3-match.dartsInTurn,match.mode==='checkout121'?true:!!match.config.doubleOut);}
function renderGame(){if(!match)return;
 const p=E.current(match),idx=match.current;
 $('game-mode-badge').textContent=(match.mode==='x01'?`${match.config.startScore} · ${match.config.doubleOut?'DOUBLE OUT':'STRAIGHT OUT'} · LEG ${match.legNumber}/${match.config.bestOfLegs||1}`:E.MODES[match.mode].toUpperCase())+(O.options().active?' · ONLINE':'');
 $('score-ribbon').innerHTML=match.players.map((pl,i)=>`<div class="score-player ${i===idx?'playing':''}"><span class="score-name">${safe(pl.name)}${i===idx?' •':''}</span><strong class="score-value">${safe(modeScore(pl))}</strong><small>${safe(scoreCaption(pl))}</small></div>`).join('');
 $('current-player-name').textContent=p.name;$('turn-status').textContent=`THROW ${match.dartsInTurn+1} OF 3`;
 const advice=currentAdvice();$('target-advice').classList.toggle('has-checkout',!!advice&&advice.type==='checkout');
 if(advice){$('target-advice').querySelector('.advice-label').textContent=advice.type==='checkout'?'SMART CHECKOUT':'SETUP SUGGESTION';$('target-text').textContent=advice.text;$('advice-alternatives').textContent=advice.alternatives.length?`ALSO: ${advice.alternatives.slice(0,2).map(r=>r.map(x=>x.code).join(' → ')).join(' · ')}`:advice.type==='checkout'?`Finish available in ${advice.route.length} dart${advice.route.length===1?'':'s'}`:'No checkout this visit';}
 else{$('target-advice').querySelector('.advice-label').textContent='CURRENT CHALLENGE';$('target-text').textContent=E.targetDescription(match,p);$('advice-alternatives').textContent='';}
 if(match.mode==='bingo'){$('advice-alternatives').textContent=E.BINGO.map((x,i)=>`${p.board[i]?'✓':'·'} ${x.label}`).join('  ·  ');}
 if(match.mode==='cricket'){$('advice-alternatives').textContent='MARKS: '+E.CRICKET.map(n=>`${n===25?'B':n}:${p.marks[n]}`).join('  ');}
 $('darts-counter').textContent=Array.from({length:3},(_,i)=>i<3-match.dartsInTurn?'●':'○').join(' ');
 $('game-feedback').textContent=match.lastAction;
 $('board-frame').classList.toggle('pad-only',currentInput==='pad');
 $('number-pad').hidden=currentInput!=='pad';$('circuit-quick').hidden=match.mode!=='circuit';document.querySelectorAll('[data-input]').forEach(x=>x.classList.toggle('selected',x.dataset.input===currentInput));
 document.querySelectorAll('[data-multiplier]').forEach(x=>x.classList.toggle('active',Number(x.dataset.multiplier)===multiplier));
 highlightTarget();
 const locked=!!(O.options().active&&!O.ownTurn(match))||pendingOnline;
 document.querySelectorAll('#game-screen [data-multiplier],#game-screen [data-action="miss-one"],#game-screen [data-action="miss-rest"],#game-screen [data-action="undo"],#game-screen [data-action="bull"],#number-pad button,#circuit-quick button').forEach(x=>x.disabled=locked);
 $('dartboard').style.pointerEvents=locked?'none':'auto';
}
function highlightTarget(){const p=E.current(match);let target=0;
 if(['circuit','xld','clock','sniper','bob27'].includes(match.mode))target=p.target;
 else if(match.mode==='shanghai')target=match.round;
 else if(match.mode==='halveit')target=E.HALVE[match.round-1]||0;
 else if(match.mode==='gauntlet')target=E.GAUNTLET[p.stage]?.n||0;
 document.querySelectorAll('#dartboard [data-dart]').forEach(x=>{x.classList.toggle('glowing',target&&Number(x.dataset.n)===Number(target));});
}
function buildBoard(){const nums=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];const svg=$('dartboard');
 const path=(r1,r2,a1,a2)=>{const x=a=>Math.cos(a),y=a=>Math.sin(a);return`M ${r1*x(a1)} ${r1*y(a1)} L ${r2*x(a1)} ${r2*y(a1)} A ${r2} ${r2} 0 0 1 ${r2*x(a2)} ${r2*y(a2)} L ${r1*x(a2)} ${r1*y(a2)} A ${r1} ${r1} 0 0 0 ${r1*x(a1)} ${r1*y(a1)} Z`;};
 let out=`<defs><radialGradient id="frame" cx="50%" cy="50%" r="60%"><stop stop-color="#18232b"/><stop offset="1" stop-color="#030607"/></radialGradient></defs><circle r="235" fill="url(#frame)" stroke="#53646b" stroke-width="3" class="board-bg" data-dart="0" data-n="0" data-m="1"/><circle r="196" fill="#020406" stroke="#33424d" stroke-width="4"/>`;
 for(let i=0;i<20;i++){const n=nums[i],start=(i*18-99)*Math.PI/180,end=(i*18-81)*Math.PI/180,mid=(start+end)/2,base=i%2===0?'#121714':'#d6cda9',ring=i%2===0?'#b52b35':'#258b45';
 for(const [r1,r2,m,color] of [[19,105,1,base],[105,120,3,ring],[120,165,1,base],[165,182,2,ring]]){
   out+=`<path class="board-segment" data-dart="1" data-n="${n}" data-m="${m}" fill="${color}" d="${path(r1,r2,start,end)}"/>`;
 }
 const nx=(208*Math.cos(mid)).toFixed(2),ny=(208*Math.sin(mid)+6).toFixed(2);out+=`<text class="board-number" x="${nx}" y="${ny}" data-dart="1" data-n="${n}" data-m="1">${n}</text>`;
 }
 out+='<circle r="19" fill="#26894a" stroke="#283b33" stroke-width="2" class="board-segment" data-dart="1" data-n="25" data-m="1"/><circle r="8" fill="#d52e44" stroke="#703b3c" stroke-width="1.5" class="board-segment" data-dart="1" data-n="25" data-m="2"/>';
 svg.innerHTML=out;
}
function setGame(m){match=m;history=[];afterWinShown='';multiplier=1;clockPaused=false;resetTurnClock();buildBoard();renderGame();show('game-screen');persist(STORE.match,match);keepScreenAwake();V.turn(E.current(match).spokenName||E.current(match).name,E.targetDescription(match),currentAdvice());}
function resetTurnClock(){turnStartedAt=Date.now();clockReminded.clear();clockPaused=false;$('timer-btn').textContent='PAUSE';}
function clockSeconds(){return Math.floor(((clockPaused?pausedAt:Date.now())-turnStartedAt)/1000);}
function drawClock(){if(lastScreen!=='game-screen'||!match)return;const v=Math.max(0,clockSeconds());$('shot-timer').textContent=String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0');if(uiSettings.shotClock&&match.players.length>1&&v>=uiSettings.shotThreshold&&!clockReminded.has(uiSettings.shotThreshold)){clockReminded.add(uiSettings.shotThreshold);V.speak(`${v} seconds on the shot clock.`);}}
function remember(){persist(STORE.match,O.options().active?null:match);}
function settleMatch(m,completed){if(!m||settledIds.includes(m.matchId))return;const mine=O.options().active?m.players.filter(p=>p.ownerUid===O.options().uid):m.players;
 for(const mp of mine){const p=profiles.find(x=>x.id===mp.localId);if(!p)continue;
 const x=mp.stats;p.darts+=x.darts;p.boardHits+=x.boardHits;p.targetHits+=x.targetHits;p.scored+=x.scored;p.bestVisit=Math.max(p.bestVisit,x.bestVisit);p.ton100+=x.ton100;p.ton140+=x.ton140;p.ton180+=x.ton180;p.checkoutSuccess+=x.successfulDoubles;p.doubleAttempts+=x.doubleAttempts;if(m.mode==='x01'){p.x01Darts+=x.darts;p.x01Scored+=x.scored;}
 if(completed){p.played++;if(m.winners.includes(mp.id))p.won++;}
 }
 settledIds.push(m.matchId);if(settledIds.length>300)settledIds=settledIds.slice(-300);persist(STORE.saved,settledIds);savePlayers();}
function goWinner(){if(!match||!match.finished)return;
 if(afterWinShown===match.matchId)return;afterWinShown=match.matchId;settleMatch(match,true);persist(STORE.match,null);
 const winning=match.players.filter(p=>match.winners.includes(p.id));$('winner-name').textContent=winning.length===1?winning[0].name:'DRAW';$('winner-details').textContent=match.result;
 $('winner-stat-grid').innerHTML=`<div class="stat-tile"><span>MODE</span><strong>${safe(E.MODES[match.mode])}</strong></div><div class="stat-tile"><span>TOTAL DARTS</span><strong>${match.players.reduce((a,p)=>a+p.stats.darts,0)}</strong></div>`;
 show('winner-screen');playClick(true);
}
async function makeThrow(n,mult,autoSpeech=true){if(!match||match.finished)return;if(pendingOnline)return;
 if(O.options().active&&!O.ownTurn(match)){toast('It is your opponent’s turn');return;}
 const previous=E.clone(match),idx=match.current;let event;
 try{event=E.throwDart(match,{n,mult});}catch(e){toastError(e);return;}
 if(O.options().active){pendingOnline=true;renderGame();try{match=await O.commitMatch(match,previous);}catch(e){match=previous;toastError(e);renderGame();pendingOnline=false;return;}pendingOnline=false;}
 else history.push(previous);
 playClick(event.hit);if(uiSettings.party&&!match.finished&&(event.party||event.bust||event.code.startsWith('T')))showPartyForfeit(event);
 if(match.current!==idx||match.finished)resetTurnClock();multiplier=1;remember();renderGame();V.afterThrow(event,match,currentAdvice());if(match.finished)goWinner();
}
async function circuitQuick(hits){if(!match||match.mode!=='circuit')return;const rem=3-match.dartsInTurn,goal=Math.min(hits,rem),target=E.current(match).target;for(let i=0;i<goal;i++)await makeThrow(target>match.config.circuitLength?25:target,1);for(let i=goal;i<rem;i++)await makeThrow(0,1);}
async function missRest(){if(!match)return;const remaining=3-match.dartsInTurn;for(let i=0;i<remaining;i++){if(match?.finished)break;await makeThrow(0,1);}}
async function quickPlay(){const mode=selectedMode in METADATA?selectedMode:'x01';const cfg=loadJSON('apex_v170_cfg_'+mode,{});try{O.reset();setGame(E.create({mode,config:cfg,players:selectedProfiles().map(p=>({id:p.id,localId:p.id,name:p.name,spokenName:p.spokenName}))}));}catch(e){toastError(e);}}
function startLocal(){const players=selectedProfiles();try{O.reset();setGame(E.create({mode:selectedMode,config:getConfig(),players:players.map(p=>({id:p.id,localId:p.id,name:p.name,spokenName:p.spokenName}))}));}catch(e){toastError(e);}}
async function undo(){if(!match)return;try{
 if(O.options().active){match=await O.undo();resetTurnClock();V.speak('Undo',true);remember();renderGame();return;}
 if(!history.length){toast('Nothing to undo');return;}
 match=history.pop();multiplier=1;resetTurnClock();remember();renderGame();V.speak('Undo',true);
 }catch(e){toastError(e);}}
function leaveMatch(){if(!match)return;const ok=confirm('Leave this match? Your recorded statistics will be saved.');if(!ok)return;
 if(!match.finished)settleMatch(match,false);
 match=null;history=[];persist(STORE.match,null);O.reset();V.cancel();home();}
function home(){if(match&&match.finished){O.reset();match=null;}if(match&&!match.finished){if(lastScreen==='game-screen'){leaveMatch();return;} }renderHome();show('home-screen');}
function getWinnerWinner(){return match?.players.find(p=>match.winners.includes(p.id));}
function rematch(){if(!match)return;if(O.options().active){O.rematch().then(()=>toast('Waiting for opponent to accept rematch')).catch(toastError);return;}
 try{const participants=match.players.map(p=>({id:p.id,localId:p.localId,name:p.name,spokenName:p.spokenName}));const oldIdx=match.current;const newer=E.create({mode:match.mode,config:match.config,players:participants});newer.current=(oldIdx+1)%newer.players.length;setGame(newer);}catch(e){toastError(e);}}
function showStats(){const el=$('statistics-list');el.innerHTML=profiles.map(p=>{
 const cells=[['MATCH WINS',`${p.won} / ${p.played}`],['TARGET ACCURACY',p.darts?`${(p.targetHits/p.darts*100).toFixed(1)}%`:'0%'],['BEST VISIT',p.bestVisit],['X01 3-DART AVG',p.x01Darts?(3*p.x01Scored/p.x01Darts).toFixed(1):'—'],['TOTAL DARTS',p.darts],['100+ / 140+ / 180',`${p.ton100} / ${p.ton140} / ${p.ton180}`],['CHECKOUT DOUBLES',p.checkoutSuccess]];
 return`<div class="stat-panel"><h2>${safe(p.name)}</h2><div class="stat-grid">${cells.map(([name,val])=>`<div class="stat-tile"><span>${name}</span><strong>${safe(val)}</strong></div>`).join('')}</div></div>`;}).join('');show('stats-screen');}
function showPartyForfeit(event){const dares=['Do a victory dance away from the oche.','Announce your next turn in your best referee voice.','Share your most embarrassing darts moment.','Challenge a friend to a friendly high-five.','Name a player you think will win the next round.','Make up a funny nickname for your next dart.'];const reason=event.bust?'BUST':event.party?'THREE MISSES':'TRIPLE HIT';const task=uiSettings.partyStyle==='sips'?'Take a small sip of your preferred drink (non-alcoholic is fine).':dares[Math.floor(Math.random()*dares.length)];modal(`<h2>PARTY ALERT ✦</h2><p><strong>${safe(event.player)}</strong> — ${safe(reason)}</p><p style="color:#ffcf5a;font-size:20px;font-weight:850">${safe(task)}</p><button class="primary-btn modal-cta" data-action="close-modal">DONE ✓</button>`);}
function showLog(){if(!match)return;modal(`<h2>Throw log</h2><div class="modal-plain-list">${match.log.length?[...match.log].reverse().map(x=>`<div class="log-entry"><strong>${safe(x.player)}</strong> · ${safe(x.code)} ${x.hit?'✓':''}<br><small>${safe(x.notes)}</small></div>`).join(''):'No throws recorded yet.'}</div><button data-action="show-standings" class="outline-btn modal-cta">LIVE STANDINGS</button>`);}
function showStandings(){if(!match)return;modal(`<h2>Live standings</h2><div class="modal-plain-list">${match.players.map(p=>`<div class="log-entry"><strong>${safe(p.name)}</strong><span style="float:right;color:#03e1f6">${safe(modeScore(p))}</span><br><small>${safe(scoreCaption(p))}</small></div>`).join('')}</div>`);}
async function settings(){const v=V.options();modal(`<h2>Global settings</h2><div class="settings-body">
 <label class="toggle">Enable referee commentary<input type="checkbox" id="sound-enabled" ${v.enabled?'checked':''}></label>
 <label class="input-label">ANNOUNCER STYLE</label><select id="voice-level"><option value="minimal" ${v.verbosity==='minimal'?'selected':''}>Minimal — only essentials</option><option value="normal" ${v.verbosity==='normal'?'selected':''}>Referee — turns and checkouts</option><option value="detailed" ${v.verbosity==='detailed'?'selected':''}>Coach — all hits and setup advice</option></select>
 <label class="input-label">LANGUAGE / ACCENT</label><select id="voice-locale"><option value="en-GB" ${v.locale==='en-GB'?'selected':''}>British English</option><option value="en-ZA" ${v.locale==='en-ZA'?'selected':''}>South African English</option><option value="en-US" ${v.locale==='en-US'?'selected':''}>American English</option><option value="en-AU" ${v.locale==='en-AU'?'selected':''}>Australian English</option></select>
 <label class="input-label">INSTALLED VOICE</label><select id="voice-select"><option value="">Device default</option></select><p class="hint" id="voice-note">Loading installed voices…</p>
 <label class="input-label">SPEECH RATE <span id="rate-display">${v.rate.toFixed(2)}×</span></label><input id="voice-rate" type="range" min="0.7" max="1.2" step="0.05" value="${v.rate}">
 <div class="field-row"><button class="outline-btn" data-action="save-settings">SAVE SETTINGS</button><button class="outline-btn" data-action="preview-voice">▶ TEST VOICE</button></div>
 <hr><label class="toggle">Keep screen awake<input type="checkbox" id="opt-awake" ${uiSettings.keepAwake?'checked':''}></label>
 <label class="toggle">Shot-clock spoken reminders<input type="checkbox" id="opt-clock" ${uiSettings.shotClock?'checked':''}></label>
 <label class="input-label">SHOT-CLOCK REMINDER</label><select id="opt-threshold"><option value="20" ${uiSettings.shotThreshold===20?'selected':''}>20 seconds</option><option value="30" ${uiSettings.shotThreshold===30?'selected':''}>30 seconds</option><option value="45" ${uiSettings.shotThreshold===45?'selected':''}>45 seconds</option><option value="60" ${uiSettings.shotThreshold===60?'selected':''}>60 seconds</option></select>
 <label class="toggle">Party-forfeit reminders<input type="checkbox" id="opt-party" ${uiSettings.party?'checked':''}></label><label class="input-label">PARTY STYLE</label><select id="opt-party-style"><option value="dares" ${uiSettings.partyStyle==='dares'?'selected':''}>Dares and silly challenges</option><option value="sips" ${uiSettings.partyStyle==='sips'?'selected':''}>Sips (adults only, optional)</option></select>
 <p class="hint">High-quality voices depend on voice packages installed on your phone. Cloud-generated professional recordings are not included in this release.</p>
 </div>`);
 try{const voices=await V.listVoices();const selectEl=$('voice-select');if(!selectEl)return;
 voices.filter(v=>v.lang?.startsWith('en')||!v.lang).forEach(x=>{const option=document.createElement('option');option.value=x.id;option.textContent=`${x.name} (${x.lang||'unknown'})`;selectEl.appendChild(option);});selectEl.value=v.voiceId||'';
 $('voice-note').textContent=voices.length?`${voices.length} installed voices detected. Voice availability varies by device.`:'No selectable voice packages found. Device default will be used.';
 }catch(e){if($('voice-note'))$('voice-note').textContent='Voice selection unavailable on this device.';}
}
function saveSettings(){V.configure({enabled:$('sound-enabled').checked,verbosity:$('voice-level').value,locale:$('voice-locale').value,voiceId:$('voice-select').value,rate:Number($('voice-rate').value)});uiSettings={keepAwake:$('opt-awake').checked,shotClock:$('opt-clock').checked,shotThreshold:Number($('opt-threshold').value),party:$('opt-party').checked,partyStyle:$('opt-party-style').value};persist(STORE.settings,uiSettings);keepScreenAwake();toast('Settings saved');closeModal();}
async function keepScreenAwake(){try{if(uiSettings.keepAwake){if(window.plugins?.insomnia)window.plugins.insomnia.keepAwake();else if(navigator.wakeLock&&!wakeLock)wakeLock=await navigator.wakeLock.request('screen');}else{if(window.plugins?.insomnia)window.plugins.insomnia.allowSleepAgain();if(wakeLock){await wakeLock.release();wakeLock=null;}}}catch(e){} }
function openBackup(){const backup=JSON.stringify({format:1,profiles},null,2);modal(`<h2>Backup player data</h2><p>Copy this backup into a safe place, especially before uninstalling an older APK. It preserves player names and statistics.</p><textarea id="backup-text" rows="7" spellcheck="false">${safe(backup)}</textarea><button class="primary-btn modal-cta" data-action="copy-backup">COPY BACKUP</button><hr><h3>Restore a backup</h3><p>Paste an earlier backup into the box, then tap Restore. This replaces the players on this device.</p><button class="outline-btn full" data-action="restore-backup">RESTORE TEXT ABOVE</button>`);}
async function copyBackup(){const el=$('backup-text');el.focus();el.select();try{await navigator.clipboard.writeText(el.value);toast('Backup copied. Paste it into Notes or a file.');}catch(e){try{document.execCommand('copy');toast('Backup selected/copied');}catch(x){toast('Select the backup text and copy it manually');}}}
function restoreBackup(){try{const data=JSON.parse($('backup-text').value);if(!Array.isArray(data.profiles)||data.profiles.length===0)throw new Error('Invalid backup');if(!confirm('Replace all existing player profiles and statistics?'))return;profiles=data.profiles.slice(0,50).map(p=>createProfile(p.name,p));savePlayers();renderHome();closeModal();toast('Backup restored');}catch(e){toastError(e);}}
function onlineEvents(){return{state(remote){const changed=match?.matchId!==remote.matchId;const oldTurn=match?.current;const wasFinished=match?.finished;
 match=remote;if(changed){if(showingModal)closeModal();afterWinShown='';history=[];multiplier=1;buildBoard();show('game-screen');resetTurnClock();}
 else if(match.current!==oldTurn)resetTurnClock();
 renderGame();remember();
 if(match.finished){if(!wasFinished||changed)V.speak(match.result,true);goWinner();}
 else if(changed||match.current!==oldTurn){V.turn(E.current(match).spokenName||E.current(match).name,E.targetDescription(match),currentAdvice());}
 },status(message){const status=$('online-status-message');if(status)status.textContent=message;else if(message?.includes('disconnected'))toast(message);},error(message){toast(message);}};}
function onlineMenu(){modal(`<h2>Online multiplayer</h2><p>Each player needs an internet connection, an installed Apex APK and a room code. Host chooses the game rules; guest joins with the code.</p><button class="primary-btn modal-cta" data-action="online-host-config">HOST A MATCH →</button><label class="input-label">JOIN WITH ROOM CODE</label><input id="room-code-input" maxlength="10" placeholder="10-character code" autocomplete="off" autocapitalize="characters"><button class="outline-btn modal-cta" data-action="join-game">JOIN MATCH</button><p class="hint">Online rooms are intended for friendly games. Enable Firebase anonymous authentication and apply the supplied database rules first.</p>`);}
function chooseOnlinePlayer(){return selectedProfiles()[0];}
async function hostGame(){const player=chooseOnlinePlayer();const mode=selectedMode,cfg=getConfig();closeModal();modal('<h2>Creating room…</h2><p id="online-status-message">Connecting securely to Firebase…</p>');try{
 const code=await O.host({player:{name:player.name,spokenName:player.spokenName,localId:player.id},mode,config:cfg,events:onlineEvents()});
 modal(`<h2>Invite your opponent</h2><p>Share this code with a second Apex Darts Pro device.</p><div class="room-code">${safe(code)}</div><p id="online-status-message" class="online-status">Waiting for guest…</p><button class="outline-btn full" data-action="cancel-host">CANCEL ROOM</button>`);
 }catch(e){O.reset();closeModal();toastError(e);}}
async function joinGame(){const input=$('room-code-input');const code=input?.value||'';const p=chooseOnlinePlayer();$('online-status-message')?.remove();const btn=document.querySelector('[data-action="join-game"]');if(btn)btn.disabled=true;
 try{await O.join({roomCode:code,player:{name:p.name,spokenName:p.spokenName,localId:p.id},events:onlineEvents()});modal(`<h2>Connecting to match</h2><p id="online-status-message">Waiting for host to start…</p><button class="outline-btn modal-cta" data-action="cancel-host">LEAVE ROOM</button>`);}catch(e){if(btn)btn.disabled=false;toastError(e);}}
function confirmBack(){if(showingModal){closeModal();return;}if(lastScreen==='game-screen'){leaveMatch();return;}if(lastScreen==='winner-screen'){O.reset();match=null;home();return;}home();}
function installListeners(){
 document.addEventListener('click',async evt=>{
  const board=evt.target.closest('#dartboard [data-dart]');if(board){if(match){const n=Number(board.dataset.n),mu=Number(board.dataset.m);await makeThrow(n,n===25?mu:n===0?1:multiplier===1?mu:multiplier);}return;}
  const pad=evt.target.closest('#number-pad button');if(pad){const n=Number(pad.dataset.n);await makeThrow(n,n===25?2:multiplier);return;}
  const target=evt.target.closest('[data-action],[data-multiplier],[data-input],[data-category],[data-circuit-hits]');if(!target)return;
  if(target.dataset.multiplier){multiplier=Number(target.dataset.multiplier);renderGame();return;}
  if(target.dataset.input){currentInput=target.dataset.input;storage.setItem(STORE.input,currentInput);renderGame();return;}
  if(target.dataset.circuitHits!==undefined){await circuitQuick(Number(target.dataset.circuitHits));return;}
  if(target.dataset.category){document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===target));renderModes(target.dataset.category);return;}
  const a=target.dataset.action;
  switch(a){case'home':home();break;case'quick-play':quickPlay();break;case'show-modes':modes();break;case'choose-mode':setup(target.dataset.mode||'x01');break;case'show-players':playerScreen();break;case'show-stats':showStats();break;case'settings':settings();break;case'add-player':{const v=$('new-player').value.trim();if(!v){toast('Enter a player name');break;}if(profiles.length>=16){toast('Maximum 16 players');break;}profiles.push(createProfile(v));$('new-player').value='';savePlayers();renderPlayers();renderHome();break;}case'remove-player':{if(profiles.length<2){toast('Keep at least one player');break;}const i=Number(target.dataset.index);if(confirm(`Delete ${profiles[i].name} and its statistics?`)){profiles.splice(i,1);savePlayers();renderPlayers();renderHome();}break;}case'rename-player':{const i=Number(target.dataset.index);const v=prompt('Name (or nickname):',profiles[i].name);if(v?.trim()){profiles[i].name=v.trim().slice(0,24);savePlayers();renderPlayers();renderHome();}break;}case'pronunciation-player':{const i=Number(target.dataset.index);const v=prompt('How should the referee pronounce this name? (Type the spoken name phonetically.)',profiles[i].spokenName||profiles[i].name);if(v?.trim()){profiles[i].spokenName=v.trim().slice(0,40);savePlayers();toast('Referee name pronunciation updated');}break;}case'start-local':startLocal();break;case'host-game':hostGame();break;case'online-menu':onlineMenu();break;case'online-host-config':closeModal();setup('x01');toast('Choose game rules, then tap HOST ONLINE MATCH');break;case'join-game':joinGame();break;case'cancel-host':O.reset();closeModal();home();break;case'close-modal':closeModal();break;case'bull':await makeThrow(25,Number(target.dataset.mult));break;case'miss-one':await makeThrow(0,1);break;case'miss-rest':await missRest();break;case'undo':undo();break;case'open-log':showLog();break;case'show-standings':showStandings();break;case'exit-match':leaveMatch();break;case'rematch':rematch();break;case'toggle-timer':if(!clockPaused){pausedAt=Date.now();clockPaused=true;target.textContent='RESUME';}else{turnStartedAt+=Date.now()-pausedAt;clockPaused=false;target.textContent='PAUSE';}break;case'preview-voice':{const v=V.options();V.configure({enabled:$('sound-enabled').checked,verbosity:$('voice-level').value,locale:$('voice-locale').value,voiceId:$('voice-select').value,rate:Number($('voice-rate').value)});V.preview();break;}case'save-settings':saveSettings();break;case'backup':openBackup();break;case'copy-backup':copyBackup();break;case'restore-backup':restoreBackup();break;
  }
 });
 document.addEventListener('change',evt=>{const p=evt.target.closest('[data-player-active]');if(p){const matchP=profiles.find(x=>x.id===p.dataset.playerActive);if(matchP){matchP.active=p.checked;savePlayers();renderHome();renderSetupPlayers();if(lastScreen==='players-screen')renderPlayers();}}});
 document.addEventListener('input',evt=>{if(evt.target.id==='voice-rate'&&$('rate-display'))$('rate-display').textContent=Number(evt.target.value).toFixed(2)+'×';});
 document.addEventListener('keydown',evt=>{if(evt.key==='Escape'||evt.key==='Backspace'&&!['TEXTAREA','INPUT'].includes(document.activeElement?.tagName))confirmBack();});
 document.addEventListener('backbutton',evt=>{evt.preventDefault();confirmBack();},false);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')keepScreenAwake();});
 }
function bootstrap(){renderHome();renderModes();buildBoard();
 $('number-pad').innerHTML=Array.from({length:20},(_,i)=>`<button data-n="${i+1}">${i+1}</button>`).join('')+'<button data-n="25">BULL</button>';
 installListeners();timerInterval=setInterval(drawClock,1000);
 const splash=$('splash');let done=false;function dismiss(){if(done)return;done=true;splash.classList.add('dismissed');}
 splash.addEventListener('click',dismiss);splash.addEventListener('keydown',ev=>{if(ev.key==='Enter')dismiss();});setTimeout(dismiss,1700);
 // A player can resume a local game after the application is stopped.
 const saved=loadJSON(STORE.match,null);
 if(saved?.schema===2&&!saved.finished){setTimeout(()=>{if(!confirm('Resume your interrupted darts match?')){persist(STORE.match,null);return;}if(O.options().active){toast('Online matches require rejoining the room');return;}O.reset();setGame(saved);},2050);}
 else if(saved?.schema===2&&saved.finished)persist(STORE.match,null);
 keepScreenAwake();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap);else bootstrap();
})();
