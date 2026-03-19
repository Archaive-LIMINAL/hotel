import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════
   DATA - Localized Rules & Constants
   ═══════════════════════════════════════════ */
const RULES = {
  ko: [
    "1. 체크인 15:00 / 체크아웃 11:00",
    "2. 새벽 2시부터 5시 사이에는 다른 투숙객을 위해 복도 내 이동을 최소화하여 주십시오.",
    "3. 본 호텔은 병원 건물을 리모델링하여 운영되고 있습니다. 4층은 존재하지 않습니다.",
    "4. 만약 4층에 도착했을 경우, 해당 층은 본 호텔 구역이 아닙니다.",
    "5. Wi-Fi는 HOTEL_LIMINAL (비밀번호: LMN2025)로 이용 가능합니다.",
    "6. 각 층 객실 번호는 01번부터 20번까지 배정되어 있습니다. 이외의 객실 번호가 확인되는 경우, 해당 층에서 즉시 벗어나십시오.",
    "7. 객실 내 흡연은 금지되어 있습니다.",
    "8. 사용하지 않는 객실은 잠긴채로 닫혀있습니다. 문이 열려있는 객실에는 다른 투숙객이 있을 수 있으니 주의하시기 바랍니다.",
    "9. 저희 직원은 객실 문을 노크하지 않습니다.",
    "10. 카드키 분실 시 프론트 데스크에서 재발급이 가능합니다.",
    "11. 귀중품 분실에 대해 호텔은 책임을 지지 않습니다.",
    "12. 23시부터 6시까지는 프론트 데스크를 운영하지 않습니다. CCTV로 확인하고 있으니 자리에서 기다려 주시면 직원이 나오겠습니다.",
    "13. 다른 투숙객에게 말을 걸거나 접촉하지 않도록 부탁드립니다.",
    "14. 타 투숙객에게 피해를 주는 행위는 자제하여 주십시오.",
    "15. 엘리베이터 호출 시, 이동 중 다른 층에 정차하는 경우 해당 엘리베이터에 탑승하지 마십시오.",
    "16. 엘리베이터 탑승 중 다른 투숙객이 탑승하더라도 먼저 말을 걸지 마십시오.",
    "17. 새벽 시간대에는 안전을 위해 호텔 정문을 시정합니다.",
    "18. 비상구는 각 층 복도 끝에 위치해 있습니다.",
    "19. 비상계단 이용 중 조명이 꺼지더라도 걸음을 멈추지 마십시오. 센서가 감지하지 못하는 경우가 있습니다.",
    "20. 본 규정을 숙지하지 않아 발생한 문제에 대해 호텔은 일절 책임을 지지 않습니다.",
  ],
  ja: [
    "1. チェックイン 15:00 / チェックアウト 11:00",
    "2. 午前2時から5時の間は、他の宿泊客のため、廊下での移動を最小限に控えてください。",
    "3. 当ホテルは病院を改装した建物です。4階は存在しません。",
    "4. 万が一4階に到着した場合、その階は当ホテルの区域ではありません。",
    "5. Wi-Fiは HOTEL_LIMINAL (パスワード: LMN2025) が利用可能です。",
    "6. 各階の客室番号は01番から20番までです。それ以外の番号を確認した場合は、直ちにその階から離れてください。",
    "7. 客室内は禁煙です。",
    "8. 使用されていない客室は施錠されたまま閉まっています。 ドアが開いている客室には他の宿泊客がいる可能性があるため、ご注意ください。",
    "9. スタッフが客室をノックすることはありません。",
    "10. カードキー紛失時はフロントデスクにて再発行が可能です。",
    "11. 貴重品の紛失について、ホテルは一切の責任を負いません。",
    "12. 23時から6時まではフロントにスタッフがおりません。CCTVで確認しておりますので、その場でお待ちください。",
    "13. 他の宿泊客に話しかけたり、接触したりしないようお願いいたします。",
    "14. 他の宿泊客に迷惑をかける行為はご遠慮ください。",
    "15. エレベーター利用時、途中の階で停止した場合は、そのエレベーターには乗らないでください。",
    "16. エレベーター内で他の宿泊客が乗ってきても、先に話しかけないでください。",
    "17. 深夜時間帯は安全のため、ホテルの正門を施錠します。",
    "18. 非常口は各階の廊下の突き当たりにあります。",
    "19. 非常階段の利用中、照明が消えても歩みを止めないでください。センサーが反応しない場合があります。",
    "20. 本規定を遵守しなかったことで発生したトラブルについて、ホテルは一切の責任を負いません。"
  ]
};

const BRIGHTNESS={normal:{overlay:0},dimNormal:{overlay:0.15},unstable:{overlay:0.2,flicker:true},dark:{overlay:0.45},blackout:{overlay:0.85}};
const PHASE={TITLE:"title",RULES:"rules",RULES_P2:"rules_p2",GAME:"game",DEATH:"death",ACCUM_DEATH:"accum_death",CLEAR:"clear"};

/* ═══════════════════════════════════════════
   SOUND HOOK
   ═══════════════════════════════════════════ */
function useSound(){
  const refs=useRef({});const bgRef=useRef(null);
  const play=useCallback((key,opts={})=>{try{
    if(refs.current[key]){refs.current[key].pause();refs.current[key].currentTime=0;}
    const a=new Audio(`/${key}.mp3`);a.volume=opts.volume||0.5;if(opts.loop)a.loop=true;a.play().catch(()=>{});refs.current[key]=a;
  }catch(e){}},[]);
  const stop=useCallback((key)=>{try{const a=refs.current[key];if(a){a.pause();a.currentTime=0;delete refs.current[key];}}catch(e){}},[]);
  const stopAll=useCallback(()=>{try{Object.keys(refs.current).forEach(k=>{refs.current[k].pause();refs.current[k].currentTime=0;});refs.current={};}catch(e){}},[]);
  const startBg=useCallback(()=>{try{if(bgRef.current)return;bgRef.current=new Audio("/snd_rain.mp3");bgRef.current.loop=true;bgRef.current.volume=0.3;bgRef.current.play().catch(()=>{});}catch(e){}},[]);
  const stopBg=useCallback(()=>{try{if(bgRef.current){bgRef.current.pause();bgRef.current=null;}}catch(e){}},[]);
  return{play,stop,stopAll,startBg,stopBg};
}

/* ═══════════════════════════════════════════
   LOCATIONS - Multi-language names
   ═══════════════════════════════════════════ */
function mkFloor(f){
  return {
    [`${f}_room_left_a`]: { name: { ko: `${f}01~${f}05호 앞`, ja: `${f}01~${f}05号室前` }, short: { ko: `${f}01~05호`, ja: `${f}01~05号` }, floor: f, connections: [{ to: `${f}_corridor_upper`, dir: "right" }] },
    [`${f}_room_left_b`]: { name: { ko: `${f}06~${f}10호 앞`, ja: `${f}06~${f}10号室前` }, short: { ko: `${f}06~10호`, ja: `${f}06~10号` }, floor: f, connections: [{ to: `${f}_corridor_upper`, dir: "left" }] },
    [`${f}_corridor_upper`]: { name: { ko: "상부 복도", ja: "上部廊下" }, short: { ko: "상부 복도", ja: "上部廊下" }, floor: f, connections: [{ to: `${f}_room_left_a`, dir: "left" }, { to: `${f}_room_left_b`, dir: "right" }, { to: `${f}_elev_area`, dir: "right" }] },
    [`${f}_elev_area`]: { name: { ko: "엘리베이터/계단", ja: "エレベーター/階段" }, short: { ko: "엘리베이터", ja: "エレベーター" }, floor: f, isElev: true, connections: [{ to: `${f}_corridor_upper`, dir: "left" }, { to: `${f}_corridor_lower`, dir: "right" }] },
    [`${f}_corridor_lower`]: { name: { ko: "하부 복도", ja: "下部廊下" }, short: { ko: "하부 복도", ja: "下部廊下" }, floor: f, connections: [{ to: `${f}_room_right_a`, dir: "left" }, { to: `${f}_room_right_b`, dir: "right" }, { to: `${f}_elev_area`, dir: "right" }] },
    [`${f}_room_right_a`]: { name: { ko: `${f}11~${f}15호 앞`, ja: `${f}11~${f}15号室前` }, short: { ko: `${f}11~15호`, ja: `${f}11~15号` }, floor: f, connections: [{ to: `${f}_corridor_lower`, dir: "right" }] },
    [`${f}_room_right_b`]: { name: { ko: `${f}16~${f}20호 앞`, ja: `${f}16~${f}20号室前` }, short: { ko: `${f}16~20호`, ja: `${f}16~20号` }, floor: f, connections: [{ to: `${f}_corridor_lower`, dir: "left" }] },
  };
}

const LOCATIONS = {
  ...mkFloor(7), ...mkFloor(3),
  "1_lobby": { name: { ko: "로비", ja: "ロビー" }, short: { ko: "로비", ja: "ロビー" }, floor: 1, connections: [{ to: "1_front_desk", dir: "left" }, { to: "1_entrance", dir: "right" }, { to: "1_elev_area", dir: "right" }] },
  "1_front_desk": { name: { ko: "프론트 데스크", ja: "フロントデスク" }, short: { ko: "프론트", ja: "フロント" }, floor: 1, connections: [{ to: "1_lobby", dir: "right" }] },
  "1_entrance": { name: { ko: "정문", ja: "正門" }, short: { ko: "정문", ja: "正門" }, floor: 1, connections: [{ to: "1_lobby", dir: "left" }] },
  "1_elev_area": { name: { ko: "엘리베이터/계단", ja: "エレベーター/階段" }, short: { ko: "엘리베이터", ja: "エレベーター" }, floor: 1, isElev: true, connections: [{ to: "1_lobby", dir: "left" }] },
  "elev_inside": { name: { ko: "엘리베이터 내부", ja: "エレベーター内部" }, short: { ko: "엘리베이터", ja: "エレベーター" }, floor: "—", isElev: true, connections: [] },
  "stairs": { name: { ko: "비상계단", ja: "非常階段" }, short: { ko: "계단", ja: "階段" }, floor: "—", connections: [] },
  "f7_elev": { name: { ko: "엘리베이터/계단", ja: "エレベーター/階段" }, short: { ko: "엘리베이터", ja: "エレベーター" }, floor: 7, isElev: true, connections: [{ to: "f7_cor_upper", dir: "left" }, { to: "f7_cor_lower", dir: "right" }] },
  "f7_cor_upper": { name: { ko: "상부 복도", ja: "上部廊下" }, short: { ko: "상부 복도", ja: "上部廊下" }, floor: 7, connections: [{ to: "f7_room_upper", dir: "left" }, { to: "f7_room_lower", dir: "right" }, { to: "f7_elev", dir: "right" }] },
  "f7_cor_lower": { name: { ko: "하부 복도", ja: "下部廊下" }, short: { ko: "하부 복도", ja: "下部廊下" }, floor: 7, connections: [{ to: "f7_room_upper", dir: "left" }, { to: "f7_room_lower", dir: "right" }, { to: "f7_elev", dir: "left" }] },
  "f7_room_upper": { name: { ko: "객실 앞", ja: "客室前" }, short: { ko: "720~725호", ja: "720~725号" }, floor: 7, connections: [{ to: "f7_cor_upper", dir: "right" }] },
  "f7_room_lower": { name: { ko: "객실 앞", ja: "客室前" }, short: { ko: "726~730호", ja: "726~730号" }, floor: 7, connections: [{ to: "f7_cor_lower", dir: "left" }] },
};

/* ═══════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════ */
function TypewriterLines({lines,onAllDone,advanceRef}){
  const[cur,setCur]=useState(0);const[ci,setCi]=useState(0);const[done,setDone]=useState(false);const[rendered,setRendered]=useState([]);const tm=useRef(null);
  useEffect(()=>{setCur(0);setCi(0);setDone(false);setRendered([]);},[lines]);
  useEffect(()=>{if(cur>=lines.length)return;if(lines[cur].trim()===""){setRendered(p=>[...p,""]);setCur(c=>c+1);setCi(0);setDone(false);}},[cur,lines]);
  useEffect(()=>{if(cur>=lines.length)return;const line=lines[cur];if(line.trim()==="")return;if(ci>=line.length){setDone(true);setRendered(p=>{const u=[...p];u[cur]=line;return u;});return;}setRendered(p=>{const u=[...p];u[cur]=line.slice(0,ci+1);return u;});tm.current=setTimeout(()=>setCi(c=>c+1),28);return()=>clearTimeout(tm.current);},[ci,cur,lines]);
  const allDone=cur>=lines.length;
  useEffect(()=>{if(allDone&&onAllDone)onAllDone();},[allDone,onAllDone]);
  const advance=useCallback(()=>{if(allDone)return;const line=lines[cur];if(!done&&line&&line.trim()!==""){clearTimeout(tm.current);setCi(line.length);setDone(true);setRendered(p=>{const u=[...p];u[cur]=line;return u;});}else if(done){setCur(c=>c+1);setCi(0);setDone(false);}},[allDone,cur,done,lines]);
  useEffect(()=>{if(advanceRef)advanceRef.current=advance;},[advance,advanceRef]);
  return(<div style={{minHeight:60,flex:1}}>{rendered.map((line,i)=>(<p key={i} style={{minHeight:line===""?"0.5em":"auto",margin:"0.3em 0"}}>{line}{i===cur&&!done&&<span className="cursor-blink">│</span>}</p>))}{done&&!allDone&&<span className="text-continue">▼</span>}</div>);
}

function FloorIndicator({floor}){
  const[display,setDisplay]=useState(floor);const[anim,setAnim]=useState("");const prev=useRef(floor);
  useEffect(()=>{if(prev.current!==floor){const dir=typeof floor==="number"&&typeof prev.current==="number"?(floor>prev.current?"up":"down"):"down";setAnim(`floor-anim-${dir}`);setTimeout(()=>{setDisplay(floor);setTimeout(()=>setAnim(""),300);},100);prev.current=floor;}else setDisplay(floor);},[floor]);
  return(<div className="floor-ind"><span className={`floor-num ${anim}`}>{display}</span><span className="floor-f">F</span></div>);
}

function ElevatorDisplay({sequence,onComplete,initialFloor,autoStart,lang}){
  const[idx,setIdx]=useState(-1);const[floor,setFloor]=useState(initialFloor||"—");const[status,setStatus]=useState("");const[arrow,setArrow]=useState("");const[anim,setAnim]=useState("");const completedRef=useRef(false);const seqRef=useRef(sequence);const onCompleteRef=useRef(onComplete);
  useEffect(()=>{onCompleteRef.current=onComplete;},[onComplete]);
  useEffect(()=>{if(sequence===seqRef.current)return;seqRef.current=sequence;completedRef.current=false;setIdx(-1);setFloor(initialFloor||"—");setStatus("");setArrow("");setAnim("");},[sequence,initialFloor]);
  useEffect(()=>{if(autoStart&&sequence&&sequence.length>0&&idx===-1&&!completedRef.current){setIdx(0);}},[autoStart,sequence,idx]);
  useEffect(()=>{
    if(idx<0||!sequence||idx>=sequence.length)return;
    const item=sequence[idx];
    if(item.type==="floor"){setFloor(String(item.value));setStatus("");setArrow(item.dir==="up"?"▲":"▼");setAnim("floor-anim-"+(item.dir||"down"));setTimeout(()=>setAnim(""),300);}
    else if(item.type==="pause"){setArrow("");setStatus("");setAnim("pause-pulse");}
    else if(item.type==="door_open"){setStatus(lang==="ko"?"열림":"開");}
    else if(item.type==="door_close"){setStatus(lang==="ko"?"닫힘":"閉");}
    else if(item.type==="arrive"){setFloor(String(item.value));setArrow("");setStatus("");setAnim("");}
    const t=setTimeout(()=>{if(idx<sequence.length-1){setIdx(idx+1);}else if(!completedRef.current){completedRef.current=true;onCompleteRef.current&&onCompleteRef.current();}},item.duration||1300);
    return()=>clearTimeout(t);
  },[idx,sequence,lang]);
  return(<div className="elev-display-area"><div className="elev-display-frame"><div className="elev-display-inner"><span className={`elev-display-num ${anim}`}>{floor}</span>{arrow&&<span className="elev-display-arrow">{arrow}</span>}</div><div className="elev-display-status-slot">{status||"\u00A0"}</div></div></div>);
}

function RulesScreen({page,onNext,highlightRules,lang}){
  const t=(ko,ja)=>lang==="ko"?ko:ja;
  const hl=Array.isArray(highlightRules)?highlightRules:(highlightRules!=null?[highlightRules]:[]);
  const s=page===1?0:10,rules=RULES[lang].slice(s,s+10);
  return(<div className="rules-overlay"><div className="rules-paper">
    {page===1&&<div className="rules-header"><div className="rules-hotel-name">HOTEL LIMINAL</div><div className="rules-title-line"/><div className="rules-title-text">{t("투숙객 안내 규정","宿泊案内規定")}</div></div>}
    <div className="rules-body">{rules.map((r,i)=>{const n=s+i;return(<div key={n} className={`rule-item ${hl.includes(n)?"rule-highlight":""}`}>{r}</div>);})}</div>
    <div className="rules-footer"><button className="rules-btn" onClick={onNext}>{hl.length>0?(page===1&&hl.some(r=>r>=10)?t("다음 페이지","次へ"):t("다시 시작","最初から")):page===1?t("다음 페이지","次へ"):t("규칙서를 내려놓는다","規則を置く")}</button></div>
  </div></div>);
}

function DeathRulesViewer({rules,onRestart,lang}){
  const hasP1=rules.some(r=>r<10),hasP2=rules.some(r=>r>=10);
  const[page,setPage]=useState(hasP1?1:2);
  if(hasP1&&hasP2){return page===1?<RulesScreen page={1} highlightRules={rules} onNext={()=>setPage(2)} lang={lang}/>:<RulesScreen page={2} highlightRules={rules} onNext={onRestart} lang={lang}/>;}
  return<RulesScreen page={hasP1?1:2} highlightRules={rules} onNext={onRestart} lang={lang}/>;
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
const INIT={heardKnock:false,knockSceneSeen:false,hasCardKey:false,metLobbyPerson:false,lobbyPersonGone:false,entranceVisited:false,entranceWomanGone:false,arrivedFake7:false,fake7CorrVisited:false,fake7ElevCalled:false,stairsFrom7Done:false,floor3Arrived:false,floor3Fled:false,floor3Hidden:false,soundLocs:[],eventPhase:0};

export default function HotelLiminal(){
  const[lang,setLang]=useState("ko");
  const t=useCallback((ko,ja)=>lang==="ko"?ko:ja,[lang]);

  const[phase,setPhase]=useState(PHASE.TITLE);
  const[loc,setLoc]=useState("7_room_right_b");
  const[brightness,setBrightness]=useState("normal");
  const[gameTime,setGameTime]=useState("AM 2:47");
  const[textLines,setTextLines]=useState([]);
  const[choices,setChoices]=useState([]);
  const[fade,setFade]=useState(true);
  const[accumReasons,setAccumReasons]=useState([]);
  const[deathText,setDeathText]=useState("");
  const[deathRules,setDeathRules]=useState([]);
  const[flags,setFlags]=useState({...INIT});
  const[textDone,setTextDone]=useState(false);
  const[flickerOn,setFlickerOn]=useState(true);
  const[navOff,setNavOff]=useState(false);
  const[curFloor,setCurFloor]=useState(7);
  const[elevSeq,setElevSeq]=useState(null);
  const[showElev,setShowElev]=useState(false);
  const[elevInitFloor,setElevInitFloor]=useState("1");
  const[elevAuto,setElevAuto]=useState(false);
  const advRef=useRef(null);const timerRef=useRef(null);
  const snd=useSound();
  const flagsRef=useRef(flags);
  useEffect(()=>{flagsRef.current=flags;},[flags]);

  useEffect(()=>{const b=BRIGHTNESS[brightness];if(!b||!b.flicker){setFlickerOn(true);return;}const iv=setInterval(()=>setFlickerOn(p=>!p),80+Math.random()*200);return()=>clearInterval(iv);},[brightness]);
  useEffect(()=>()=>{if(timerRef.current)clearTimeout(timerRef.current);},[]);

  const tr=useCallback(cb=>{setFade(false);setTextDone(false);setTimeout(()=>{cb();setFade(true);},500);},[]);
  const setT=useCallback(s=>{setTextLines(s.split("\n"));setTextDone(false);},[]);
  const die=useCallback((txt,r)=>{if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}snd.stopAll();snd.stopBg();tr(()=>{setDeathText(txt);setDeathRules(Array.isArray(r)?r:[r]);setPhase(PHASE.DEATH);setBrightness("normal");});},[tr,snd]);
  const accumDie=useCallback(()=>{snd.stopAll();snd.stopBg();tr(()=>{setDeathRules(prev=>[...accumReasons,7]);setPhase(PHASE.ACCUM_DEATH);setBrightness("normal");});},[tr,accumReasons,snd]);
  const addAccum=useCallback(ri=>{setAccumReasons(p=>[...new Set([...p,ri])]);},[]);
  const advTime=useCallback(m=>{setGameTime(p=>{const[,ti]=p.split(" ");const[h,mi]=ti.split(":").map(Number);let tot=h*60+mi+m;return`AM ${Math.floor(tot/60)%12||12}:${String(tot%60).padStart(2,"0")}`;});},[]);
  const uF=useCallback(u=>{setFlags(p=>({...p,...u}));},[]);

  // 3F Event Fix: Removed floor3Fled requirement
  const moveTo=useCallback(dest=>{
    const f=flagsRef.current;
    snd.play("snd_step",{volume:0.4});
    if(f.eventPhase===0&&f.heardKnock&&dest==="7_room_right_b"&&!f.knockSceneSeen){
      tr(()=>{setLoc(dest);setBrightness("normal");setNavOff(false);setShowElev(false);
        setT(t("객실 앞에 다가갔다.\n\n문 앞에 누군가 서있다.\n\n직원 유니폼을 입고 있다.", "客室の前に近づいた。\n\n扉の前に誰かが立っている。\n\nスタッフの制服を着ている。"));
        setChoices([{text:t("무슨 일 있나요?","何かありましたか？"),action:()=>{uF({knockSceneSeen:true});setT(t("\"아무것도 아닙니다.\"\n\n직원은 웃으며 대답한 후,\n비상계단 쪽으로 걸어갔다.","「何でもありません。」\n\nスタッフは微笑んで答え、\n非常階段の方へ歩いていった。"));setChoices([]);setNavOff(false);}},{text:t("뒤로 물러선다","後ずさる"),action:()=>{uF({knockSceneSeen:true});setT(t("소리 없이 뒤로 물러났다.\n\n직원은 이쪽을 보지 않았다.\n\n잠시 후 비상계단 쪽으로 사라졌다.","音を立てずに後退した。\n\nスタッフはこちらを見なかった。\n\nしばらくして非常階段の方へ消えた。"));setChoices([]);setNavOff(false);}}]);
      });return;
    }
    if(f.fake7ElevCalled&&(dest==="f7_cor_upper"||dest==="f7_cor_lower")){die(t("뒤에서 무언가가 다가왔다.","後ろから何かが近づいてきた。"),8);return;}
    
    // 3F scenario: triggers blackout when entering rooms
    if(f.eventPhase===6&&f.floor3Arrived){
      if(dest==="3_room_left_a"||dest==="3_room_left_b"||dest==="3_room_right_a"||dest==="3_room_right_b"){
        snd.play("snd_powercut",{volume:0.6});
        tr(()=>{setLoc(dest);setBrightness("blackout");setNavOff(true);setShowElev(false);setCurFloor(3);
          setT(t("객실 앞까지 왔다.\n\n정전.\n\n복도 쪽에서 소리가 들린다.\n\n하나의 객실 문이 열려있다.","客室の前まで来た。\n\n停電。\n\n廊下の方から音が聞こえる。\n\n一つの客室の扉が開いている。"));
          setChoices([
            {text:t("열린 객실로 들어간다","開いている客室に入る"),action:()=>die(t("열려있는 방에서 무언가 나왔다.","開いている部屋から何かが現れた。"),7)},
            {text:t("복도 끝에 몸을 숨긴다","廊下の突き当たりに身を隠す"),action:()=>{snd.stop("snd_chase");tr(()=>{setBrightness("normal");setT(t("복도 끝에 웅크렸다.\n\n완전한 어둠.\n\n발소리가 지나간다.\n\n...\n\n불이 다시 켜졌다.","廊下の端でうずくまった。\n\n完全な暗闇。\n\n足音が通り過ぎていく。\n\n...\n\n明かりが再び点いた。"));uF({floor3Hidden:true,eventPhase:7,soundLocs:[]});setChoices([]);setNavOff(false);});}},
          ]);
        });return;
      }
      if(f.soundLocs.includes(dest)){die(t("뒤에서 무언가가 다가왔다.","後ろから何かが近づいてきた。"),1);return;}
    }
    tr(()=>{setLoc(dest);setChoices([]);setNavOff(false);setShowElev(false);const ld=LOCATIONS[dest];if(ld&&ld.floor&&typeof ld.floor==="number")setCurFloor(ld.floor);handleArr(dest);});
  },[tr,die,uF,snd,t]);

  const handleArr=useCallback(l=>{
    const f=flagsRef.current;
    if(l==="7_room_right_b"&&f.eventPhase===0&&!f.heardKnock){setBrightness("normal");setT(t("712호 객실 앞이다.","712号室の前だ。"));setChoices([]);setNavOff(false);return;}
    if(l==="7_corridor_lower"&&f.eventPhase===0&&!f.heardKnock){
      uF({heardKnock:true,soundLocs:["7_room_right_b"]});setBrightness("normal");snd.play("snd_knock",{volume:0.7});
      setT(t("복도를 걷는다.\n\n반대쪽에서 무언가 문을 두드리는 소리가 들린다.","廊下を歩く。\n\n反対側から何かを叩く音が聞こえる。"));setChoices([]);setNavOff(false);advTime(1);return;
    }
    if(l==="7_elev_area"&&f.eventPhase===0&&f.heardKnock&&!f.stairsFrom7Done){
      setBrightness("normal");setShowElev(false);setT(t("엘리베이터와 비상계단 입구가 보인다.","エレベーターと非常階段の入口が見える。"));
      setChoices([{text:t("엘리베이터를 부른다","エレベーターを呼ぶ"),action:()=>startElevDown()},{text:t("비상계단으로 내려간다","非常階段で降りる"),action:()=>startStDown7()}]);setNavOff(false);return;
    }
    // 1F
    if(l==="1_lobby"){
      if(!f.hasCardKey&&!f.metLobbyPerson){
        uF({metLobbyPerson:true,eventPhase:2});setBrightness("dimNormal");
        setT(t("새벽의 로비.\n\n조명이 절반만 켜져 있다.\n\n소파에 누군가 앉아있다.\n\n\"...안녕하세요.\n지금 프론트에는 아무도 없어요.\"","深夜のロビー。\n\n照明が半分だけ点いている。\n\nソファに誰かが座っている。\n\n「...こんにちは。\n今、フロントには誰もいませんよ。」"));
        setChoices([
          {text:t("무시한다","無視する"),action:()=>{setT(t("시선을 피하고 지나간다.","視線を避けて通り過ぎる。"));setChoices([]);setNavOff(false);}},
          {text:t("아 그렇습니까?","あ、そうなんですか？"),action:()=>{setT(t("\"혹시 몇 층에 묵고 계세요?\"","「失礼ですが、何階に泊まっていらっしゃいますか？」"));setChoices([
            {text:t("7층이에요.","7階です。"),action:()=>{addAccum(12);uF({lobbyPersonGone:true});setT(t("\"아 그러시구나...\"\n\n투숙객은 웃음을 지으며 목례를 하고 사라졌다.","「ああ、そうですか...」\n\n宿泊客は微笑んで会釈をし、消え去った。"));setChoices([]);setNavOff(false);}},
            {text:t("무시한다","無視する"),action:()=>{setT(t("시선을 피하고 지나간다.","視線を避けて通り過ぎる。"));setChoices([]);setNavOff(false);}},
          ]);}},
        ]);setNavOff(false);return;
      }
      if(f.hasCardKey&&!f.lobbyPersonGone){uF({lobbyPersonGone:true,soundLocs:["1_entrance"]});setBrightness("dimNormal");setT(t("로비로 돌아왔다.\n\n아까 소파에 앉아있던 사람은 사라졌다.","ロビーに戻った。\n\nさっきソファに座っていた人は消えていた。"));setChoices([]);setNavOff(false);return;}
      if(!f.hasCardKey&&f.metLobbyPerson&&!f.lobbyPersonGone){setBrightness("dimNormal");setT(t("새벽의 로비.\n\n소파에 앉아있는 사람이 이쪽을 보고 있다.","深夜のロビー。\n\nソファに座っている人がこちらを見ている。"));setChoices([]);setNavOff(false);return;}
      setBrightness("dimNormal");setT(t("새벽의 로비.\n\n조용하다.","深夜のロビー。\n\n静かだ。"));if(f.lobbyPersonGone&&f.entranceVisited&&!f.entranceWomanGone)uF({soundLocs:["1_entrance"]});setChoices([]);setNavOff(false);return;
    }
    if(l==="1_entrance"){
      if(!f.entranceVisited){uF({entranceVisited:true});setBrightness("dimNormal");setT(t("정문 앞에 섰다.\n\n잠겨있다.\n\n밖에서 누군가 유리문을 두드린다.\n\n\"저기요...\n카드키를 잃어버려서 들어갈 수가 없어요.\n문 좀 열어주실 수 있나요...?\"","正門の前に立った。\n\n施錠されている。\n\n外で誰かがガラス扉を叩いている。\n\n「すみません...\nカードキーを失くしてしまって入れないんです。\n扉を開けていただけませんか...？」"));setChoices([{text:t("문을 열어준다","扉を開ける"),action:()=>die(t("밖에는 아무도 없었다.","外には誰もいなかった。"),16)}]);setNavOff(false);return;
    }
      if(f.hasCardKey&&!f.entranceWomanGone){uF({entranceWomanGone:true,soundLocs:[]});setT(t("다시 정문 앞에 왔다.\n\n아무도 없다.\n\n아까 밖에 있던 여자도 보이지 않는다.","再び正門に来た。\n\n誰もいない。\n\nさっき外にいた女性も見当たらない。"));setChoices([]);setNavOff(false);return;}
      setT(t("잠긴 정문.\n\n밖은 어둡다.","施錠された正門。\n\n外は暗い。"));setChoices([]);setNavOff(false);return;
    }
    if(l==="1_front_desk"){
      if(!f.hasCardKey){setBrightness("dimNormal");setT(t("프론트 데스크.\n\n아무도 없다.\n\n카운터 위에 벨이 놓여있다.","フロントデスク。\n\n誰もいない。\n\nカウンターの上にベルが置かれている。"));setChoices([
        {text:t("벨을 누른다","ベルを鳴らす"),action:()=>{snd.play("snd_bell",{volume:0.6});addAccum(11);getKey();}},
        {text:t("직원을 부른다","スタッフを呼ぶ"),action:()=>{addAccum(11);getKey();}},
        {text:t("기다린다","待つ"),action:()=>getKey()},
      ]);setNavOff(false);return;}
      setT(t("프론트 데스크.\n\n직원은 다시 안쪽으로 들어갔다.","フロントデスク。\n\nスタッフは再び奥へと戻っていった。"));setChoices([]);setNavOff(false);return;
    }
    if(l==="1_elev_area"){
      if(f.hasCardKey){setBrightness("normal");setShowElev(false);setT(t("엘리베이터 앞에 섰다.","エレベーターの前に立った。"));setChoices([{text:t("엘리베이터를 부른다","エレベーターを呼ぶ"),action:()=>startElevUp()}]);setNavOff(false);return;}
      setBrightness("normal");setT(t("엘리베이터 앞.\n\n먼저 카드키를 받아야 할 것 같다.","エレベーター前。\n\n先にカードキーを受け取る必要がありそうだ。"));setChoices([]);setNavOff(false);return;
    }
    // Fake7
    if(l==="f7_elev"){
      if(!f.arrivedFake7){uF({arrivedFake7:true,eventPhase:4});setBrightness("normal");setCurFloor(7);setT(t("7층에 도착했다.\n\n엘리베이터 앞이다.","7階に到着した。\n\nエレベーター前だ。"));setChoices([]);setNavOff(false);return;}
      if(f.fake7CorrVisited&&!f.fake7ElevCalled){
        setBrightness("normal");setShowElev(true);setElevInitFloor("1");setElevSeq(null);setElevAuto(false);
        uF({soundLocs:["f7_cor_upper","f7_cor_lower"]});snd.play("snd_chase",{volume:0.4,loop:true});
        setT(t("복도 쪽에서 소리가 점점 다가오고 있다.","廊下の方から音が次第に近づいてきている。"));setChoices([{text:t("엘리베이터를 부른다","エレベーターを呼ぶ"),action:()=>callFake7Elev()}]);setNavOff(false);return;
      }
      setBrightness("normal");setT(t("엘리베이터 앞.","エレベーター前。"));setChoices([]);setNavOff(false);return;
    }
    if(l==="f7_cor_upper"||l==="f7_cor_lower"){
      if(!f.fake7CorrVisited)uF({fake7CorrVisited:true});
      setBrightness("normal");setT(t("복도.\n\n벽에 붙어있는 안내판을 본다.\n\n← 720~725호\n726~730호 →","廊下。\n\n壁に貼られた案内板を見る。\n\n← 720~725号室\n726~730号室 →"));
      uF({soundLocs:["f7_room_upper","f7_room_lower"]});setChoices([]);setNavOff(false);return;
    }
    if(l==="f7_room_upper"||l==="f7_room_lower"){die(t("열려있는 방에서 무언가 나왔다.","開いている部屋から何かが現れた。"),7);return;}
    // 3F
    if(l==="3_elev_area"&&f.eventPhase===6){
      if(!f.floor3Arrived){
        uF({floor3Arrived:true,soundLocs:["3_corridor_lower","__stairs_3f"]});
        setBrightness("dark");setShowElev(true);setElevInitFloor("7");setElevSeq(null);setElevAuto(false);
        snd.play("snd_knock",{volume:0.5});
        setT(t("3층에 도착했다.\n\n근처에서 노크 소리가 들린다.","3階に到着した。\n\n近くでノックの音が聞こえる。"));setChoices([{text:t("엘리베이터를 부른다","エレベーターを呼ぶ"),action:()=>call3FElev()}]);setNavOff(false);return;
      }
      setBrightness("dark");setT(t("3층 엘리베이터 앞.","3階エレベーター前。"));setChoices([]);setNavOff(false);return;
    }
    if(l==="3_corridor_upper"&&f.eventPhase===6&&f.floor3Arrived){
      uF({soundLocs:["3_elev_area"]});setBrightness("dark");setT(t("상부 복도로 왔다.\n\n엘리베이터 쪽에서 소리가 들린다.","上部廊下に来た。\n\nエレベーターの方から音が聞こえる。"));setChoices([]);setNavOff(false);return;
    }
    if(l==="3_corridor_lower"&&f.eventPhase===6&&f.floor3Arrived){
      uF({soundLocs:["3_elev_area"]});setBrightness("dark");setT(t("하부 복도로 왔다.\n\n엘리베이터 쪽에서 소리가 들린다.","下部廊下に来た。\n\nエレベーターの方から音が聞こえる。"));setChoices([]);setNavOff(false);return;
    }
    if(f.eventPhase===7&&f.floor3Hidden){
      if(l==="3_corridor_upper"||l==="3_corridor_lower"){setBrightness("normal");setT(t("복도.\n\n조용하다.","廊下。\n\n静かだ。"));setChoices([]);setNavOff(false);return;}
      if(l==="3_room_left_a"||l==="3_room_left_b"||l==="3_room_right_a"||l==="3_room_right_b"){setBrightness("normal");setT(t("객실 앞.\n\n모든 문이 닫혀있다.\n\n빨리 올라가야 한다.","客室前。\n\nすべての扉が閉まっている。\n\n早く上がらなければ。"));setChoices([]);setNavOff(false);return;}
      if(l==="3_elev_area"){setBrightness("normal");setShowElev(false);setT(t("엘리베이터 앞에 도착했다.","エレベーターの前に到着した。"));setChoices([{text:t("엘리베이터를 부른다","エレベーターを呼ぶ"),action:()=>startFinalElev()},{text:t("비상계단으로 올라간다","非常階段で上がる"),action:()=>startFinalStairs()}]);setNavOff(false);return;}
    }
    const ld=LOCATIONS[l];if(ld){setT(t(ld.name.ko, ld.name.ja)+".");setChoices([]);setNavOff(false);}
  },[uF,advTime,die,tr,snd,addAccum,t]);

  const getKey=useCallback(()=>{tr(()=>{uF({hasCardKey:true});advTime(5);setT(t("안쪽에서 직원이 나왔다.\n\n\"이런 시간에 어쩐 일이세요?\"\n\n\"카드키를 방에 두고 나왔어요.\"\n\n\"712호... 잠시만요.\"\n\n새 카드키를 건네받았다.","奥からスタッフが現れた。\n\n「こんな時間にどうされましたか？」\n\n「カードキーを部屋に置いたまま出てしまいました。」\n\n「712号室ですね... 少々お待ちください。」\n\n新しいカードキーを受け取った。"));setChoices([]);setNavOff(false);});},[tr,uF,advTime,t]);

  // Elevators logic
  const startElevDown=useCallback(()=>{
    uF({eventPhase:1,soundLocs:[]});snd.play("snd_elev",{volume:0.5});snd.startBg();
    const seq=[{type:"floor",value:7,dir:"down",duration:1300},{type:"floor",value:6,dir:"down",duration:1300},{type:"floor",value:5,dir:"down",duration:1300},{type:"floor",value:3,dir:"down",duration:1300},{type:"floor",value:2,dir:"down",duration:1300},{type:"arrive",value:1,duration:1000}];
    tr(()=>{setLoc("elev_inside");setBrightness("normal");setNavOff(true);setShowElev(true);setElevInitFloor("7");setElevAuto(true);setElevSeq(seq);setCurFloor("—");setT(t("엘리베이터에 탑승했다.\n\n1층 버튼을 누른다.","エレベーターに乗り込んだ。\n\n1階のボタンを押す。"));setChoices([]);});
  },[tr,uF,snd,t]);

  const startElevUp=useCallback(()=>{
    snd.play("snd_elev",{volume:0.5});
    const seq=[{type:"floor",value:1,dir:"up",duration:1300},{type:"floor",value:2,dir:"up",duration:1300},{type:"floor",value:3,dir:"up",duration:1300},{type:"floor",value:5,dir:"up",duration:1300},{type:"floor",value:6,dir:"up",duration:1300},{type:"arrive",value:7,duration:1000}];
    tr(()=>{setLoc("elev_inside");setBrightness("normal");setNavOff(true);setShowElev(true);setElevInitFloor("1");setElevAuto(true);setElevSeq(seq);setCurFloor("—");setT(t("엘리베이터에 탑승했다.\n\n7층 버튼을 누른다.","エレベーターに乗り込んだ。\n\n7階のボタンを押す。"));setChoices([]);});
  },[tr,snd,t]);

  const callFake7Elev=useCallback(()=>{
    uF({fake7ElevCalled:true});snd.play("snd_elev",{volume:0.5});
    const seq=[{type:"floor",value:1,dir:"up",duration:1300},{type:"floor",value:2,dir:"up",duration:1300},{type:"floor",value:3,dir:"up",duration:1300},{type:"floor",value:4,dir:"up",duration:1300},{type:"pause",duration:1500},{type:"door_open",duration:1500},{type:"door_close",duration:1200},{type:"floor",value:5,dir:"up",duration:1300},{type:"floor",value:6,dir:"up",duration:1300},{type:"arrive",value:7,duration:1000}];
    setElevAuto(true);setElevSeq(seq);setChoices([]);
  },[uF,snd]);

  const call3FElev=useCallback(()=>{
    snd.play("snd_elev",{volume:0.5});snd.play("snd_chase",{volume:0.4,loop:true});
    const seq=[{type:"floor",value:7,dir:"down",duration:1300},{type:"floor",value:6,dir:"down",duration:1300},{type:"floor",value:5,dir:"down",duration:1300}];
    setElevAuto(true);setElevSeq(seq);setT(t("층수 표시가 움직인다.\n\n발소리가 점점 다가온다.","階数表示が動く。\n\n足音が次第に近づいてくる。"));setChoices([]);setNavOff(true);
  },[snd,t]);

  const startFinalElev=useCallback(()=>{
    snd.stop("snd_chase");snd.play("snd_elev",{volume:0.5});
    const seq=[{type:"floor",value:3,dir:"up",duration:1300},{type:"floor",value:4,dir:"up",duration:1800},{type:"floor",value:5,dir:"up",duration:1300},{type:"floor",value:6,dir:"up",duration:1300},{type:"arrive",value:7,duration:1000}];
    tr(()=>{setLoc("elev_inside");setBrightness("normal");setNavOff(true);setShowElev(true);setElevInitFloor("3");setElevAuto(true);setElevSeq(seq);setCurFloor(3);setT(t("엘리베이터에 탑승했다.\n\n7층을 누른다.","エレベーターに乗り込んだ。\n\n7階を押す。"));setChoices([]);});
  },[tr,snd,t]);

  const onElevDone=useCallback(()=>{
    const f=flagsRef.current;
    if(f.eventPhase===1){
      snd.play("snd_elev",{volume:0.3});setCurFloor(1);advTime(3);setT(t("도착.","到着。"));setChoices([{text:t("내린다","降りる"),action:()=>{tr(()=>{setPhase(PHASE.GAME);setLoc("1_lobby");setCurFloor(1);setShowElev(false);handleArr("1_lobby");});}}]);
    }else if(f.eventPhase===2&&!f.arrivedFake7){
      snd.play("snd_elev",{volume:0.3});setCurFloor(7);advTime(3);setT(t("도착.","到着。"));setChoices([{text:t("내린다","降りる"),action:()=>{tr(()=>{setPhase(PHASE.GAME);setLoc("f7_elev");setCurFloor(7);setShowElev(false);handleArr("f7_elev");});}}]);
    }else if(f.eventPhase===4){
      snd.play("snd_elev",{volume:0.3});setT(t("엘리베이터가 도착했다.","エレベーターが到着した。"));setChoices([{text:t("엘리베이터에 탑승한다","エレベーターに乗り込む"),action:()=>die(t("혼자가 아니었다.","一人ではなかった。"),14)}]);timerRef.current=setTimeout(()=>{die(t("벗어나지 못했다.","逃げ出せなかった。"),5);},8000);setNavOff(false);
    }else if(f.eventPhase===6){
      snd.stop("snd_chase");uF({floor3Fled:true,soundLocs:["3_corridor_lower","3_elev_area"]});setShowElev(false);setT(t("발소리가 바로 뒤까지 왔다.","足音がすぐ後ろまで来た。"));setChoices([]);setNavOff(false);
    }else if(f.eventPhase===7){
      snd.play("snd_elev",{volume:0.3});setCurFloor(7);setT(t("도착.","到着。"));
      setChoices([{text:t("내린다","降りる"),action:()=>{tr(()=>{setPhase(PHASE.GAME);setShowElev(false);
        if(accumReasons.length>0){setLoc("7_corridor_lower");setBrightness("normal");setCurFloor(7);setT(t("7층 복도.\n\n712호 앞에 도착했다.\n\n문이 열려있다.","7階の廊下。\n\n712号室の前に到着した。\n\n扉が開いている。"));setChoices([{text:t("들어간다","入る"),action:()=>accumDie()}]);setNavOff(true);}
        else{setLoc("7_room_right_b");setBrightness("normal");setCurFloor(7);setT(t("7층 복도.\n\n712호 앞에 도착했다.\n\n카드키를 댄다.\n\n찰칵.","7階の廊下。\n\n712号室の前に到着した。\n\nカードキーをかざす。\n\nガチャリ。"));setChoices([{text:t("들어간다","入る"),action:()=>{tr(()=>setPhase(PHASE.CLEAR));}}]);setNavOff(true);}
      });}}]);
    }
  },[tr,die,uF,handleArr,snd,accumReasons,accumDie,advTime,t]);

  // Stairways logic
  const startStDown7=useCallback(()=>{
    uF({soundLocs:[]});
    tr(()=>{setLoc("stairs");setBrightness("normal");setNavOff(true);setShowElev(false);setCurFloor(7);
      setT(t("비상계단에 들어섰다.\n\n내려가기 시작한다.","非常階段に入った。\n\n降り始める。"));setChoices([{text:t("내려간다","降りる"),action:()=>{snd.play("snd_powercut",{volume:0.5});tr(()=>{setBrightness("blackout");setCurFloor("—");setT(t("불이 꺼졌다.","明かりが消えた。"));setChoices([{text:t("멈춘다","止まる"),action:()=>die(t("발소리가 멈췄다.","足音が止まった。"),18)},{text:t("계속 내려간다","降り続ける"),action:()=>stD(1)}]);});}}]);});
  },[tr,die,uF,snd,t]);

  const stD=useCallback(step=>{
    const labels=lang==="ko"?["","6층...","5층...","..."]:["","6階...","5階...","..."];
    if(step<=3){tr(()=>{setBrightness("blackout");setCurFloor("—");setT(t(`어둠 속에서 계속 내려간다.\n\n${labels[step]}`, `暗闇の中で降り続ける。\n\n${labels[step]}`));setChoices([{text:t("멈춘다","止まる"),action:()=>die(t("발소리가 멈췄다.","足音が止まった。"),18)},{text:t("계속 내려간다","降り続ける"),action:()=>stD(step+1)}]);});}
    else{tr(()=>{setBrightness("normal");setCurFloor(4);setT(t("불이 켜졌다.\n\n4층.\n\n옆에 문이 보인다.\n\n위에서 발소리가 들린다.","明かりが点いた。\n\n4階。\n\n横に扉が見える。\n\n上から足音が聞こえる。"));setChoices([{text:t("4층 문으로 들어간다","4階の扉に入る"),action:()=>die(t("이곳은 호텔이 아니다.","ここはホテルではない。"),3)},{text:t("계속 내려간다","降り続ける"),action:()=>{tr(()=>{setBrightness("normal");setCurFloor(1);uF({stairsFrom7Done:true,eventPhase:2});snd.startBg();advTime(5);setT(t("계속 내려간다.\n\n3...\n2...\n1.\n\n1층에 도착했다.","さらに降りる。\n\n3...\n2...\n1.\n\n1階に到着した。"));setChoices([{text:t("1층으로 나간다","1階に出る"),action:()=>{tr(()=>{setPhase(PHASE.GAME);setLoc("1_lobby");setCurFloor(1);handleArr("1_lobby");});}}]);});}}]);});}
  },[tr,die,uF,handleArr,snd,advTime,t,lang]);

  const startSt7AD=useCallback(()=>{
    if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}
    uF({soundLocs:[]});snd.stop("snd_chase");
    tr(()=>{setLoc("stairs");setBrightness("unstable");setNavOff(true);setShowElev(false);setCurFloor(7);
      setT(t("비상계단으로 들어섰다.\n\n내려간다.","非常階段に入った。\n\n降りる。"));setChoices([{text:t("내려간다","降りる"),action:()=>st7AD(1)}]);});
  },[tr,uF,snd,t]);

  const st7AD=useCallback(step=>{
    const labels=["","7A","7B","7C","7D"];
    const texts=lang==="ko"?["","7A층 ..?","여전히 7층이다.","또 7층이다.","벗어날 수 없다.."]:["","7A階...？","まだ7階だ。","また7階だ。","逃げ出せない..."];
    if(step<labels.length){tr(()=>{setBrightness("unstable");setCurFloor(labels[step]);setT(texts[step]);setChoices([{text:t("계속 내려간다","降り続ける"),action:()=>st7AD(step+1)}]);});}
    else{snd.play("snd_powercut",{volume:0.5});tr(()=>{setBrightness("blackout");setCurFloor("—");setT(t("불이 꺼졌다.","明かりが消えた。"));setChoices([{text:t("내려간다","降りる"),action:()=>st7ADdark(1)}]);});}
  },[tr,snd,t,lang]);

  const st7ADdark=useCallback(step=>{
    if(step<2){tr(()=>{setBrightness("blackout");setCurFloor("—");setT(t("어둠 속에서 내려간다.\n\n...","暗闇の中を降りる。\n\n..."));setChoices([{text:t("내려간다","降りる"),action:()=>st7ADdark(step+1)}]);});}
    else{tr(()=>{setBrightness("normal");setCurFloor(3);uF({eventPhase:6});setT(t("불이 켜졌다.\n\n벽에는 3층이라고 써있다.","明かりが点いた。\n\n壁には3階と書かれている。"));setChoices([{text:t("3층으로 나간다","3階へ出る"),action:()=>{
      tr(()=>{setPhase(PHASE.GAME);setLoc("3_elev_area");setCurFloor(3);
        uF({floor3Arrived:true,soundLocs:["3_corridor_lower","__stairs_3f"]});
        setBrightness("dark");setShowElev(true);setElevInitFloor("7");setElevSeq(null);setElevAuto(false);
        snd.play("snd_knock",{volume:0.5});setT(t("3층에 도착했다.\n\n근처에서 노크 소리가 들린다.","3階に到着した。\n\n近くでノックの音が聞こえる。"));
        setChoices([{text:t("엘리베이터를 부른다","エレベーターを呼ぶ"),action:()=>call3FElev()}]);setNavOff(false);});
    }}]);});}
  },[tr,uF,snd,t]);

  const startFinalStairs=useCallback(()=>{
    snd.stop("snd_chase");
    tr(()=>{setLoc("stairs");setBrightness("normal");setNavOff(true);setShowElev(false);setCurFloor(3);
      setT(t("비상계단으로 올라간다.\n\n4...\n5...\n6...\n7.","非常階段を上がる。\n\n4...\n5...\n6...\n7."));setChoices([{text:t("7층으로 나간다","7階へ出る"),action:()=>{
        tr(()=>{setPhase(PHASE.GAME);setCurFloor(7);
          if(accumReasons.length>0){setLoc("7_corridor_lower");setBrightness("normal");setT(t("7층 복도.\n\n712호 앞에 도착했다.\n\n문이 열려있다.","7階の廊下。\n\n712号室の前に到着した。\n\n扉が開いている。"));setChoices([{text:t("들어간다","入る"),action:()=>accumDie()}]);setNavOff(true);}
          else{setLoc("7_room_right_b");setBrightness("normal");setT(t("7층 복도.\n\n712호 앞에 도착했다.\n\n카드키를 댄다.\n\n찰칵.","7階の廊下。\n\n712号室の前に到着した。\n\nカードキーをかざす。\n\nガチャリ。"));setChoices([{text:t("들어간다","入る"),action:()=>{tr(()=>setPhase(PHASE.CLEAR));}}]);setNavOff(true);}
        });
      }}]);});
  },[tr,accumReasons,accumDie,snd,t]);

  const resetGame=useCallback(()=>{
    if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}
    snd.stopAll();snd.stopBg();
    tr(()=>{setPhase(PHASE.TITLE);setLoc("7_room_right_b");setBrightness("normal");setGameTime("AM 2:47");setTextLines([]);setChoices([]);setAccumReasons([]);setDeathText("");setDeathRules([]);setFlags({...INIT});setNavOff(false);setCurFloor(7);setShowElev(false);setElevSeq(null);setElevAuto(false);});
  },[tr,snd]);

  const getBStyle=()=>{const b=BRIGHTNESS[brightness];if(!b)return{};let op=b.overlay;if(b.flicker)op=flickerOn?b.overlay:b.overlay+0.25;return{position:"fixed",inset:0,background:`rgba(0,0,0,${op})`,transition:b.flicker?"none":"background 0.8s ease",pointerEvents:"none",zIndex:50};};

  const getNav=()=>{
    if(navOff)return{left:[],right:[]};
    const f=flagsRef.current;const ld=LOCATIONS[loc];if(!ld)return{left:[],right:[]};
    let conns=[...ld.connections];
    if(loc==="f7_elev"&&f.fake7CorrVisited)conns.push({to:"__stairs_f7",dir:"right"});
    if(loc==="3_elev_area"&&(f.eventPhase===6||f.eventPhase===7))conns.push({to:"__stairs_3f",dir:"right"});
    const mk=c=>({id:c.to,label:(c.to==="__stairs_f7"||c.to==="__stairs_3f")?t("비상계단","非常階段"):(LOCATIONS[c.to]?.short[lang]||c.to),hasSound:f.soundLocs.includes(c.to)});
    return{left:conns.filter(c=>c.dir==="left").map(mk),right:conns.filter(c=>c.dir==="right").map(mk)};
  };

  const nav=getNav();
  const handleNavClick=id=>{
    if(id==="__stairs_f7")startSt7AD();
    else if(id==="__stairs_3f"){const f=flagsRef.current;if(f.eventPhase===7)startFinalStairs();else die(t("뒤에서 무언가가 다가왔다.","後ろから何かが近づいてきた。"),1);}
    else moveTo(id);
  };

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Noto+Sans+KR:wght@200;300;400;500&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      html,body{height:100%;overflow:hidden}
      .game-root{font-family:'Noto Sans KR',sans-serif;background:#08080a;color:#d4d0cb;height:100vh;display:flex;justify-content:center;position:relative;overflow:hidden}
      .game-frame{width:100%;max-width:520px;height:100vh;position:relative;z-index:1;display:flex;flex-direction:column;transition:opacity .5s ease;overflow:hidden}
      .game-frame.fading{opacity:0}
      .game-content{flex:1;padding:1.2rem 1.5rem .5rem;display:flex;flex-direction:column;overflow:hidden;min-height:0}
      .scene-header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:.6rem;gap:.6rem;position:relative;z-index:60;background:#08080a;padding-top:.2rem;flex-shrink:0}
      .header-left{display:flex;align-items:baseline;gap:.7rem}
      .floor-ind{display:flex;align-items:baseline;gap:.1em;background:#0c0c10;border:1px solid #1a1a22;border-radius:4px;padding:.2rem .5rem;min-width:2.5rem;justify-content:center}
      .floor-num{font-family:'Courier New',monospace;font-size:1.3rem;font-weight:400;color:#8a4030;line-height:1;min-width:.8em;text-align:center}
      .floor-f{font-family:'Cormorant Garamond',serif;font-size:.6rem;color:#5a4035;font-weight:300}
      .floor-anim-down{animation:floorDown .3s ease}
      .floor-anim-up{animation:floorUp .3s ease}
      @keyframes floorDown{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}
      @keyframes floorUp{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
      .scene-location{font-size:.72rem;color:#706a62;letter-spacing:.12em}
      .scene-time{font-family:'Cormorant Garamond',serif;font-size:.82rem;color:#8a4030;letter-spacing:.1em;font-weight:300}
      .scene-divider{height:1px;background:linear-gradient(90deg,#2a2520,transparent);margin-bottom:.8rem;flex-shrink:0}
      .text-advance-overlay{position:fixed;inset:0;z-index:55;cursor:pointer}
      .elev-display-area{width:100%;min-height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0c0c10;border:1px solid rgba(255,255,255,.04);border-radius:4px;margin-bottom:.8rem;padding:.6rem}
      .elev-display-frame{background:#08080c;border:1px solid #16161e;border-radius:4px;padding:.5rem .7rem;min-width:70px;text-align:center}
      .elev-display-inner{display:flex;align-items:center;justify-content:center;gap:.3em}
      .elev-display-num{font-family:'Courier New',monospace;font-size:1.8rem;color:#8a4030;min-width:1em;text-align:center}
      .elev-display-arrow{font-size:.55rem;color:#8a4030;animation:arrowPulse .6s ease infinite}
      @keyframes arrowPulse{0%,100%{opacity:1}50%{opacity:.3}}
      .pause-pulse{animation:pausePulse 1s ease infinite}
      @keyframes pausePulse{0%,100%{opacity:1}50%{opacity:.4}}
      .elev-display-status-slot{font-size:.6rem;color:#5a5550;letter-spacing:.15em;margin-top:.3rem;min-height:1em}
      .scene-text{flex:1;font-size:.88rem;line-height:1.85;color:#b5b0a8;font-weight:300;letter-spacing:.01em;margin-bottom:.6rem;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch}
      .cursor-blink{color:#8a4030;animation:blink 1s steps(1) infinite}
      @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
      .text-continue{display:block;text-align:center;color:#4a4540;font-size:.65rem;margin-top:.3rem;animation:pulse 1.5s ease infinite}
      @keyframes pulse{0%,100%{opacity:.3}50%{opacity:.8}}
      .choices-area{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.6rem;animation:fadeUp .5s ease;position:relative;z-index:60;flex-shrink:0}
      @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      .choice-btn{background:#12121a;border:1px solid rgba(255,255,255,.12);color:#c0b8ae;font-family:'Noto Sans KR',sans-serif;font-size:.8rem;font-weight:300;padding:.7em 1em;text-align:center;cursor:pointer;transition:all .3s ease;position:relative;z-index:60}
      .choice-btn:hover{background:#1a1a24;border-color:rgba(150,120,80,.4);color:#e0d8ce}
      .nav-area{padding:.4rem 1.5rem .8rem;display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.04);position:relative;z-index:60;min-height:2.5rem;background:#08080a;flex-shrink:0}
      .nav-col{display:flex;flex-direction:column;gap:.2rem;min-width:40%}
      .nav-col-left{align-items:flex-start}
      .nav-col-right{align-items:flex-end}
      .nav-btn{display:flex;align-items:center;gap:.3em;background:none;border:none;color:#7a7570;font-family:'Noto Sans KR',sans-serif;font-size:.82rem;font-weight:300;cursor:pointer;padding:.35em .2em;transition:color .2s;letter-spacing:.05em;white-space:nowrap}
      .nav-btn:hover{color:#b0a898}
      .nav-arrow{font-size:.9rem;color:#5a5550}
      .nav-sound{font-size:.7rem;opacity:.45;animation:soundPulse 1.5s ease infinite}
      @keyframes soundPulse{0%,100%{opacity:.45}50%{opacity:.15}}
      .title-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:2rem}
      .title-number{font-family:'Cormorant Garamond',serif;font-size:5rem;font-weight:300;color:rgba(180,150,100,.12);letter-spacing:.3em;line-height:1}
      .title-name{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:300;letter-spacing:.5em;color:#a09080;margin-bottom:1.5rem}
      .title-divider{width:50px;height:1px;background:linear-gradient(90deg,transparent,#555,transparent);margin:0 auto 1.5rem}
      .title-tagline{font-size:.8rem;color:#5a5550;letter-spacing:.3em;font-weight:200;margin-bottom:3rem}
      .lang-group{display:flex;gap:1rem}
      .title-start{background:transparent;border:1px solid #3a3530;color:#8a8070;font-family:'Noto Sans KR',sans-serif;font-size:.8rem;font-weight:300;padding:.9em 2.5em;cursor:pointer;letter-spacing:.1em;transition:all .4s ease}
      .title-start:hover{border-color:#6a5a48;color:#c0b0a0}
      .rules-overlay{position:fixed;inset:0;background:rgba(5,5,5,.92);display:flex;align-items:center;justify-content:center;z-index:100;padding:1rem}
      .rules-paper{background:#f5f0e8;color:#2a2520;max-width:440px;width:100%;max-height:85vh;overflow-y:auto;padding:2rem 1.5rem;position:relative}
      .rules-paper::before{content:'';position:absolute;inset:6px;border:1px solid rgba(0,0,0,.06);pointer-events:none}
      .rules-header{text-align:center;margin-bottom:1.5rem}
      .rules-hotel-name{font-family:'Cormorant Garamond',serif;font-size:.8rem;letter-spacing:.5em;color:#8a7a6a;margin-bottom:.6rem}
      .rules-title-line{width:30px;height:1px;background:#c0b8a8;margin:0 auto .6rem}
      .rules-title-text{font-size:.9rem;font-weight:500;letter-spacing:.2em;color:#3a3530}
      .rules-body{margin-bottom:1.5rem}
      .rule-item{font-size:.74rem;line-height:1.8;color:#3a3530;padding:.45em 0;border-bottom:1px solid rgba(0,0,0,.04);font-weight:300}
      .rule-highlight{background:rgba(196,48,43,.12);color:#8a2020;font-weight:400;padding:.45em .3em;margin:0 -.3em}
      .rules-footer{text-align:center}
      .rules-btn{background:transparent;border:1px solid #c0b8a8;color:#6a6055;font-family:'Noto Sans KR',sans-serif;font-size:.73rem;padding:.6em 2em;cursor:pointer;letter-spacing:.1em;transition:all .3s ease;font-weight:300}
      .rules-btn:hover{border-color:#8a7a6a;color:#3a3530}
      .death-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:2rem;overflow-y:auto}
      .death-text{font-size:1rem;color:#8a3030;letter-spacing:.15em;margin-bottom:2rem;animation:deathFade 1.5s ease}
      @keyframes deathFade{from{opacity:0;filter:blur(6px)}to{opacity:1;filter:blur(0)}}
      .clear-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:2rem}
      .clear-text{font-size:.95rem;color:#a09888;line-height:2;font-weight:300;margin-bottom:1.5rem;animation:clearIn 2.5s ease}
      .clear-sub{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#8a9a70;letter-spacing:.4em;margin-bottom:2rem;animation:clearIn 3s ease}
      @keyframes clearIn{from{opacity:0}to{opacity:1}}
      .clear-btn{background:transparent;border:1px solid #3a3a30;color:#6a6a58;font-family:'Noto Sans KR',sans-serif;font-size:.75rem;padding:.7em 2.5em;cursor:pointer;letter-spacing:.15em;transition:all .3s ease;font-weight:300}
      .clear-btn:hover{border-color:#6a6a50;color:#a0a080}
    `}</style>
    <div className="game-root">
      <div style={getBStyle()}/>
      <div className={`game-frame ${!fade?"fading":""}`}>
        {phase===PHASE.TITLE&&(<div className="title-screen">
          <div className="title-number">712</div>
          <div className="title-name">HOTEL LIMINAL</div>
          <div className="title-divider"/>
          <div className="title-tagline">{t("규칙을 기억하세요","規則を覚えてください")}</div>
          <div className="lang-group">
            <button className="title-start" onClick={()=>{setLang("ko");snd.startBg();tr(()=>setPhase(PHASE.RULES));}}>한국어</button>
            <button className="title-start" onClick={()=>{setLang("ja");snd.startBg();tr(()=>setPhase(PHASE.RULES));}}>日本語</button>
          </div>
        </div>)}
        
        {phase===PHASE.RULES&&<RulesScreen page={1} highlightRules={[]} onNext={()=>tr(()=>setPhase(PHASE.RULES_P2))} lang={lang}/>}
        
        {phase===PHASE.RULES_P2&&<RulesScreen page={2} highlightRules={[]} onNext={()=>{tr(()=>{setPhase(PHASE.GAME);setLoc("7_room_right_b");setCurFloor(7);setT(t("객실 712호.\n\n테이블 위에 놓여있던 규칙서를 대충 훑어봤다.\n\n침대에 누웠다.\n\n...\n\n배가 고프다.\n\n시계를 보니 새벽 2시 47분.\n\n편의점이라도 다녀와야겠다.","客室712号室。\n\nテーブルの上に置かれた規則書を軽く読み流した。\n\nベッドに横になった。\n\n...\n\n腹が減った。\n\n時計を見ると午前2時47分。\n\nコンビニにでも行こう。"));setChoices([{text:t("객실을 나선다","部屋を出る"),action:()=>{tr(()=>{setLoc("7_room_right_b");setT(t("복도로 나왔다.\n\n뒤를 돌아보니 문이 닫혀 있다.\n\n주머니를 뒤졌다.\n\n지갑이 없다. 방 안에 두고 나온 것 같다.\n\n카드키도 없다.\n\n프론트에 가서 카드키를 다시 받아야겠다.","廊下に出た。\n\n後ろを向くと扉が閉まっている。\n\nポケットを探った。\n\n財布がない。部屋の中に置いてきたようだ。\n\nカードキーもない。\n\nフロントに行って再発行してもらおう。"));setChoices([]);setNavOff(false);advTime(1);});}}]);setNavOff(true);});}} lang={lang}/>}
        
        {phase===PHASE.DEATH&&(<div className="death-screen"><div className="death-text">{deathText}</div>{deathRules.length>0&&<DeathRulesViewer rules={deathRules} onRestart={resetGame} lang={lang}/>}</div>)}
        
        {phase===PHASE.ACCUM_DEATH&&(<div className="death-screen"><div className="death-text">{t("문이 열려있다.","扉が開いている。")}</div>{deathRules.length>0&&<DeathRulesViewer rules={deathRules} onRestart={resetGame} lang={lang}/>}</div>)}
        
        {/* PHASE.CLEAR JSX FIX: Wrapped in a single div */}
        {phase===PHASE.CLEAR&&(<div className="clear-screen">
          <div className="clear-text">{t("문을 닫았다.<br/><br/>무슨 일이 있었던 걸까..<br/><br/>","ドアを閉めた。<br/><br/>一体何が起きていたんだろうか...<br/><br/>").split('<br/>').map((txt,i)=><span key={i}>{txt}<br/></span>)}</div>
          <div className="clear-sub">{t("생존","生存")}</div>
          <button className="clear-btn" onClick={resetGame}>{t("처음으로","最初へ")}</button>
        </div>)}

        {phase===PHASE.GAME&&(<>
          {!textDone&&<div className="text-advance-overlay" onClick={()=>advRef.current&&advRef.current()}/>}
          <div className="game-content">
            <div className="scene-header"><div className="header-left"><FloorIndicator floor={curFloor}/><span className="scene-location">{LOCATIONS[loc]?.name[lang]||loc}</span></div><span className="scene-time">{gameTime}</span></div>
            <div className="scene-divider"/>
            {showElev&&<ElevatorDisplay sequence={elevSeq} onComplete={onElevDone} initialFloor={elevInitFloor} autoStart={elevAuto} lang={lang}/>}
            <div className="scene-text"><TypewriterLines key={textLines.join("|")} lines={textLines} onAllDone={()=>setTextDone(true)} advanceRef={advRef}/></div>
            {textDone&&choices.length>0&&(<div className="choices-area">{choices.map((c,i)=>(<button key={i} className="choice-btn" onClick={c.action}>{c.text}</button>))}</div>)}
          </div>
          {textDone&&(<div className="nav-area">
            <div className="nav-col nav-col-left">{nav.left.map(n=>(<button key={n.id} className="nav-btn" onClick={()=>handleNavClick(n.id)}><span className="nav-arrow">←</span>{n.label}{n.hasSound&&<span className="nav-sound">🔊</span>}</button>))}</div>
            <div className="nav-col nav-col-right">{nav.right.map(n=>(<button key={n.id} className="nav-btn" onClick={()=>handleNavClick(n.id)}>{n.hasSound&&<span className="nav-sound">🔊</span>}{n.label}<span className="nav-arrow">→</span></button>))}</div>
          </div>)}
        </>)}
      </div>
    </div>
  </>);
}