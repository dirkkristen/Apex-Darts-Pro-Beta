/* Apex checkout advisor. Pure JavaScript, shared by browser and Node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ApexCheckout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const throws = [];
  for (let n=1;n<=20;n++) {
    throws.push({n, m:1, value:n, code:`S${n}`});
    throws.push({n, m:2, value:n*2, code:`D${n}`});
    throws.push({n, m:3, value:n*3, code:`T${n}`});
  }
  throws.push({n:25,m:1,value:25,code:'SB'});
  throws.push({n:25,m:2,value:50,code:'DB'});
  const preferredDoubles=[20,16,18,12,10,8,14,6,4,2,1,25,19,15,17,13,11,9,7,5,3];
  const words={S:'Single',D:'Double',T:'Triple'};
  function spoken(d) { return d.code==='SB' ? 'outer bull' : d.code==='DB' ? 'bullseye' : `${words[d.code[0]]} ${d.n}`; }
  function rank(route) {
    const end=route[route.length-1];
    const dblScore = end.m===2 ? preferredDoubles.indexOf(end.n) : 15;
    const middle = route.slice(0,-1).reduce((acc,d,i)=>acc + (d.n===25 ? 120 : d.m===3 ? Math.max(0,20-d.n)*1.2 + (route.length===2 && d.value<=60 ? 0 : 0) : d.m===2 ? 8 : 6) + (i===0 && d.m===3 ? Math.max(0,20-d.n)*.3 : 0),0);
    return route.length*1000 + dblScore*4 + middle + (route[0].m===3 && route[0].value<40 && route.reduce((s,d)=>s+d.value,0)<=60 ? 45 : 0) + (end.n===25 && route.length>1 ? 9 : 0);
  }
  const cache=new Map();
  function finishes(score, dartsLeft=3, doubleOut=true, max=5) {
    score=Number(score); dartsLeft=Math.max(0,Math.min(3,Number(dartsLeft)));
    if (!Number.isInteger(score) || score<=0 || dartsLeft<1) return [];
    const key=`${score}|${dartsLeft}|${doubleOut}`;
    if (!cache.has(key)) {
      const results=[];
      function walk(rest, depth, route) {
        if (!depth) return;
        for (const d of throws) {
          const left=rest-d.value;
          if (left<0 || (doubleOut && left===1)) continue;
          if (left===0) {
            if (!doubleOut || d.m===2) results.push([...route,d]);
          } else if (depth>1) walk(left,depth-1,[...route,d]);
        }
      }
      walk(score,dartsLeft,[]);
      results.sort((a,b)=>rank(a)-rank(b) || a.map(x=>x.code).join('').localeCompare(b.map(x=>x.code).join('')));
      const unique=[]; const seen=new Set();
      for(const route of results) { const k=route.map(x=>x.code).join('-'); if(!seen.has(k)){seen.add(k);unique.push(route);} if(unique.length>=8)break; }
      cache.set(key,unique);
    }
    return cache.get(key).slice(0,max);
  }
  function setup(score,dartsLeft,doubleOut) {
    if (!Number.isInteger(score) || score<=1 || dartsLeft<1) return null;
    const targetRemainders=doubleOut ? [40,32,36,24,20,16,50,12,8,4,2,28,26,30,34,38] : [20,19,18,17,16,15,10,1];
    let best=null, bestRank=Infinity;
    // Advises a SINGLE practical setup dart (rather than promising an impossible checkout).
    for(const d of throws) {
      const left=score-d.value;
      if(left<=0 || (doubleOut&&left===1)) continue;
      const pref=targetRemainders.indexOf(left);
      const rankScore=pref>=0 ? pref*5+(d.m===3?0:2) : 150 + left*.25 - d.value*.1;
      if(rankScore<bestRank){bestRank=rankScore;best={throw:d,leave:left};}
    }
    return best;
  }
  function advice(score,dartsLeft=3,doubleOut=true) {
    const routes=finishes(score,dartsLeft,doubleOut,4);
    if(routes.length) return {type:'checkout',score,dartsLeft,route:routes[0],alternatives:routes.slice(1),text:routes[0].map(d=>d.code).join(' → '),speech:routes[0].map(spoken).join(', ')};
    const suggestion=setup(score,dartsLeft,doubleOut);
    return {type:'setup',score,dartsLeft,route:suggestion?[suggestion.throw]:[],alternatives:[],text:suggestion?`${suggestion.throw.code} → leave ${suggestion.leave}`:'No legal finish',speech:suggestion?`${spoken(suggestion.throw)} to leave ${suggestion.leave}`:'No legal finish available'};
  }
  return {throws,spoken,finishes,advice};
});
