// 종신30 60~65세 끌투 크롤 → sim_data 병합
// node convert_jongsin30.js (DRY) / --write (저장)
const fs=require('fs');
global.window={}; require('./sim_data.js');
const P=window.PREM_FULL, LIMITS=window.LIMITS;
const DIR='/Users/jay/Desktop/02.끌투/새담블_계산기/data';
const DRY=!process.argv.includes('--write');

const MAP={ '뉴노멀I|일반':'P00455','뉴노멀I|클래식':'P00457','뉴노멀II|일반':'P00456','뉴노멀II|클래식':'P00458' };
const GRADES=['1','2','3','4','5','인지지원'];
function find(items,m){ const it=items.find(m); return it?[it.entAmt,it.prm]:null; }
function loadMerged(pcode,G){  // 30세이상+40세이상 파일 병합
  const merged={};
  ['30세이상','40세이상'].forEach(s=>{
    const f=`${DIR}/${pcode}001_${G}_${s}종신30년.json`;
    if(fs.existsSync(f)) Object.assign(merged, JSON.parse(fs.readFileSync(f,'utf8')).by_age);
  });
  return merged;
}

let added=0; const errs=[];
for(const [base,pcode] of Object.entries(MAP)){
 for(const [g,G] of [['남','M'],['여','F']]){
  const K=base+'|'+g+'|종신|30';
  const ba=loadMerged(pcode,G);
  for(let age=60;age<=65;age++){
    const items=ba[String(age)];
    if(!items){ errs.push(`${pcode}_${G} ${age}세 없음`); continue; }
    const ju=find(items,it=>it.mtrtDcd==='주');
    if(ju) P[K]['주계약'][age]=ju; else errs.push(`${K} ${age} 주계약X`);
    GRADES.forEach(N=>{
      const ltc=find(items,it=>it.insnm.includes('장기요양'+N+'등급생활자금')&&!it.insnm.includes('뇌혈관'));
      if(ltc) P[K]['장기요양|'+N][age]=ltc;
      const br=find(items,it=>it.insnm.includes('뇌혈관질환장기요양'+N+'등급생활자금'));
      if(br) P[K]['뇌혈관|'+N][age]=br;
    });
    added++;
  }
 }
}

const sk='뉴노멀I|일반|남|종신|30', sk2='뉴노멀I|클래식|남|종신|30';
console.log('=== 추가(키×나이):',added,'/ 에러:',errs.length, errs.slice(0,4));
console.log('--- 뉴노멀I|일반|남 주계약 58~62:',[58,59,60,61,62].map(a=>JSON.stringify(P[sk]['주계약'][a])).join(' '));
console.log('--- 뉴노멀I|클래식|남(아까누락) 주계약 58~62:',[58,59,60,61,62].map(a=>JSON.stringify(P[sk2]['주계약'][a]||'❌')).join(' '));
console.log('    장기요양|4 60~65:',[60,61,62,63,64,65].map(a=>JSON.stringify(P[sk2]['장기요양|4'][a]||'❌')).join(' '));

let miss=0;
Object.keys(MAP).forEach(base=>['남','여'].forEach(g=>{
  const K=base+'|'+g+'|종신|30';
  [60,61,62,63,64,65].forEach(a=>{ if(!P[K]['주계약'][a]) miss++; });
}));
console.log('\n8키 × 60~65 = 48칸 중 주계약 누락:',miss);

if(DRY) console.log('\n*** DRY — 저장 안 함. --write 로 저장 ***');
else{ fs.writeFileSync('./sim_data.js','window.PREM_FULL='+JSON.stringify(P)+';\nwindow.LIMITS='+JSON.stringify(LIMITS)+';\n'); console.log('\n✅ 저장 완료'); }
