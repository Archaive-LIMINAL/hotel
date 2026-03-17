import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════
   RULES
   ═══════════════════════════════════════════ */
const RULES = [
  "1. 체크인 15:00 / 체크아웃 11:00",
  "2. 새벽 2시부터 5시 사이에는 다른 투숙객을 위해 복도 내 이동을 최소화하여 주십시오.",
  "3. 본 호텔은 병원 건물을 리모델링하여 운영되고 있습니다. 4층은 존재하지 않습니다.",
  "4. 만약 4층에 도착했을 경우, 해당 층은 본 호텔 구역이 아닙니다.",
  "5. Wi-Fi는 HOTEL_LIMINAL (비밀번호: LMN2025)로 이용 가능합니다.",
  "6. 각 층 객실 번호는 01번부터 20번까지 배정되어 있습니다. 이외의 객실 번호가 확인되는 경우, 해당 층에서 즉시 벗어나십시오.",
  "7. 객실 내 흡연은 금지되어 있습니다.",
  "8. 사용하지 않는 객실은 잠겨있습니다. 문이 열려있는 객실에는 다른 투숙객이 있을 수 있으니 주의하시기 바랍니다.",
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
];

const BRIGHTNESS={normal:{overlay:0},dimNormal:{overlay:0.15},unstable:{overlay:0.2,flicker:true},dark:{overlay:0.45},blackout:{overlay:0.85}};
const PHASE={TITLE:"title",RULES:"rules",RULES_P2:"rules_p2",GAME:"game",DEATH:"death",ACCUM_DEATH:"accum_death",CLEAR:"clear"};

/* ═══════════════════════════════════════════
   SOUND - simplified, no loop issues
   ═══════════════════════════════════════════ */
function useSound(){
  const refs=useRef({});const bgRef=useRef(null);
  const play=useCallback((key,opts={})=>{try{
    // Stop previous instance of same key to prevent overlap
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
   LOCATIONS
   ═══════════════════════════════════════════ */
function mkFloor(f){return{
  [`${f}_room_left_a`]:{name:`${f}01~${f}05호 앞`,short:`${f}01~05호`,floor:f,connections:[{to:`${f}_corridor_upper`,dir:"right"}]},
  [`${f}_room_left_b`]:{name:`${f}06~${f}10호 앞`,short:`${f}06~10호`,floor:f,connections:[{to:`${f}_corridor_upper`,dir:"left"}]},
  [`${f}_corridor_upper`]:{name:"상부 복도",short:"상부 복도",floor:f,connections:[{to:`${f}_room_left_a`,dir:"left"},{to:`${f}_room_left_b`,dir:"right"},{to:`${f}_elev_area`,dir:"right"}]},
  [`${f}_elev_area`]:{name:"엘리베이터/계단",short:"엘리베이터",floor:f,isElev:true,connections:[{to:`${f}_corridor_upper`,dir:"left"},{to:`${f}_corridor_lower`,dir:"right"}]},
  [`${f}_corridor_lower`]:{name:"하부 복도",short:"하부 복도",floor:f,connections:[{to:`${f}_room_right_a`,dir:"left"},{to:`${f}_room_right_b`,dir:"right"},{to:`${f}_elev_area`,dir:"right"}]},
  [`${f}_room_right_a`]:{name:`${f}11~${f}15호 앞`,short:`${f}11~15호`,floor:f,connections:[{to:`${f}_corridor_lower`,dir:"right"}]},
  [`${f}_room_right_b`]:{name:`${f}16~${f}20호 앞`,short:`${f}16~20호`,floor:f,connections:[{to:`${f}_corridor_lower`,dir:"left"}]},
};}
const LOCATIONS={
  ...mkFloor(7),...mkFloor(3),
  "1_lobby":{name:"로비",short:"로비",floor:1,connections:[{to:"1_front_desk",dir:"left"},{to:"1_entrance",dir:"right"},{to:"1_elev_area",dir:"right"}]},
  "1_front_desk":{name:"프론트 데스크",short:"프론트",floor:1,connections:[{to:"1_lobby",dir:"right"}]},
  "1_entrance":{name:"정문",short:"정문",floor:1,connections:[{to:"1_lobby",dir:"left"}]},
  "1_elev_area":{name:"엘리베이터/계단",short:"엘리베이터",floor:1,isElev:true,connections:[{to:"1_lobby",dir:"left"}]},
  "elev_inside":{name:"엘리베이터 내부",short:"엘리베이터",floor:"—",isElev:true,connections:[]},
  "stairs":{name:"비상계단",short:"계단",floor:"—",connections:[]},
  "f7_elev":{name:"엘리베이터/계단",short:"엘리베이터",floor:7,isElev:true,connections:[{to:"f7_cor_upper",dir:"left"},{to:"f7_cor_lower",dir:"right"}]},
  "f7_cor_upper":{name:"상부 복도",short:"상부 복도",floor:7,connections:[{to:"f7_room_upper",dir:"left"},{to:"f7_room_lower",dir:"right"},{to:"f7_elev",dir:"right"}]},
  "f7_cor_lower":{name:"하부 복도",short:"하부 복도",floor:7,connections:[{to:"f7_room_upper",dir:"left"},{to:"f7_room_lower",dir:"right"},{to:"f7_elev",dir:"left"}]},
  "f7_room_upper":{name:"객실 앞",short:"720~725호",floor:7,connections:[{to:"f7_cor_upper",dir:"right"}]},
  "f7_room_lower":{name:"객실 앞",short:"726~730호",floor:7,connections:[{to:"f7_cor_lower",dir:"left"}]},
};

/* ═══════════════════════════════════════════
   TYPEWRITER
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

/* ═══════════════════════════════════════════
   ELEVATOR DISPLAY - fixed: use refs to prevent re-render loops
   ═══════════════════════════════════════════ */
function ElevatorDisplay({sequence,onComplete,initialFloor,autoStart}){
  const[idx,setIdx]=useState(-1);
  const[floor,setFloor]=useState(initialFloor||"—");
  const[status,setStatus]=useState("");
  const[arrow,setArrow]=useState("");
  const[anim,setAnim]=useState("");
  const completedRef=useRef(false);
  const seqRef=useRef(sequence);
  const onCompleteRef=useRef(onComplete);

  // Keep refs updated
  useEffect(()=>{onCompleteRef.current=onComplete;},[onComplete]);

  // Only reset when sequence reference identity actually changes
  useEffect(()=>{
    if(sequence===seqRef.current)return;
    seqRef.current=sequence;
    completedRef.current=false;
    setIdx(-1);setFloor(initialFloor||"—");setStatus("");setArrow("");setAnim("");
  },[sequence,initialFloor]);

  // Auto-start
  useEffect(()=>{
    if(autoStart&&sequence&&sequence.length>0&&idx===-1&&!completedRef.current){setIdx(0);}
  },[autoStart,sequence,idx]);

  // Step through sequence
  useEffect(()=>{
    if(idx<0||!sequence||idx>=sequence.length)return;
    const item=sequence[idx];
    if(item.type==="floor"){setFloor(String(item.value));setStatus("");setArrow(item.dir==="up"?"▲":"▼");setAnim("floor-anim-"+(item.dir||"down"));setTimeout(()=>setAnim(""),300);}
    else if(item.type==="pause"){setArrow("");setStatus("");setAnim("pause-pulse");}
    else if(item.type==="door_open"){setStatus("열림");}
    else if(item.type==="door_close"){setStatus("닫힘");}
    else if(item.type==="arrive"){setFloor(String(item.value));setArrow("");setStatus("");setAnim("");}
    const t=setTimeout(()=>{
      if(idx<sequence.length-1){setIdx(idx+1);}
      else if(!completedRef.current){completedRef.current=true;onCompleteRef.current&&onCompleteRef.current();}
    },item.duration||1300);
    return()=>clearTimeout(t);
  },[idx,sequence]);

  return(<div className="elev-display-area"><div className="elev-display-frame"><div className="elev-display-inner"><span className={`elev-display-num ${anim}`}>{floor}</span>{arrow&&<span className="elev-display-arrow">{arrow}</span>}</div><div className="elev-display-status-slot">{status||"\u00A0"}</div></div></div>);
}

/* ═══════════════════════════════════════════
   RULES SCREEN
   ═══════════════════════════════════════════ */
function RulesScreen({page,onNext,highlightRules}){
  const hl=Array.isArray(highlightRules)?highlightRules:(highlightRules!=null?[highlightRules]:[]);
  const s=page===1?0:10,rules=RULES.slice(s,s+10);
  return(<div className="rules-overlay"><div className="rules-paper">
    {page===1&&<div className="rules-header"><div className="rules-hotel-name">HOTEL LIMINAL</div><div className="rules-title-line"/><div className="rules-title-text">투숙객 안내 규정</div></div>}
    <div className="rules-body">{rules.map((r,i)=>{const n=s+i;return(<div key={n} className={`rule-item ${hl.includes(n)?"rule-highlight":""}`}>{r}</div>);})}</div>
    <div className="rules-footer"><button className="rules-btn" onClick={onNext}>{hl.length>0?(page===1&&hl.some(r=>r>=10)?"다음 페이지":"다시 시작"):page===1?"다음 페이지":"규칙서를 내려놓는다"}</button></div>
  </div></div>);
}

function DeathRulesViewer({rules,onRestart}){
  const hasP1=rules.some(r=>r<10),hasP2=rules.some(r=>r>=10);
  const[page,setPage]=useState(hasP1?1:2);
  if(hasP1&&hasP2){return page===1?<RulesScreen page={1} highlightRules={rules} onNext={()=>setPage(2)}/>:<RulesScreen page={2} highlightRules={rules} onNext={onRestart}/>;}
  return<RulesScreen page={hasP1?1:2} highlightRules={rules} onNext={onRestart}/>;
}

/* ═══════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════ */
const INIT={heardKnock:false,knockSceneSeen:false,hasCardKey:false,metLobbyPerson:false,lobbyPersonGone:false,entranceVisited:false,entranceWomanGone:false,arrivedFake7:false,fake7CorrVisited:false,fake7ElevCalled:false,stairsFrom7Done:false,floor3Arrived:false,floor3Fled:false,floor3Hidden:false,soundLocs:[],eventPhase:0};

export default function HotelLiminal(){
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
  // Use ref for flags in moveTo to avoid stale closure
  const flagsRef=useRef(flags);
  useEffect(()=>{flagsRef.current=flags;},[flags]);

  useEffect(()=>{const b=BRIGHTNESS[brightness];if(!b||!b.flicker){setFlickerOn(true);return;}const iv=setInterval(()=>setFlickerOn(p=>!p),80+Math.random()*200);return()=>clearInterval(iv);},[brightness]);
  useEffect(()=>()=>{if(timerRef.current)clearTimeout(timerRef.current);},[]);

  const tr=useCallback(cb=>{setFade(false);setTextDone(false);setTimeout(()=>{cb();setFade(true);},500);},[]);
  const setT=useCallback(s=>{setTextLines(s.split("\n"));setTextDone(false);},[]);
  const die=useCallback((t,r)=>{if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}snd.stopAll();snd.stopBg();tr(()=>{setDeathText(t);setDeathRules(Array.isArray(r)?r:[r]);setPhase(PHASE.DEATH);setBrightness("normal");});},[tr,snd]);
  const accumDie=useCallback(()=>{snd.stopAll();snd.stopBg();tr(()=>{setDeathRules(prev=>[...accumReasons,7]);setPhase(PHASE.ACCUM_DEATH);setBrightness("normal");});},[tr,accumReasons,snd]);
  const addAccum=useCallback(ri=>{setAccumReasons(p=>[...new Set([...p,ri])]);},[]);
  const advTime=useCallback(m=>{setGameTime(p=>{const[,t]=p.split(" ");const[h,mi]=t.split(":").map(Number);let tot=h*60+mi+m;return`AM ${Math.floor(tot/60)%12||12}:${String(tot%60).padStart(2,"0")}`;});},[]);
  const uF=useCallback(u=>{setFlags(p=>({...p,...u}));},[]);

  const moveTo=useCallback(dest=>{
    const f=flagsRef.current;
    snd.play("snd_step",{volume:0.4});
    // Knock scene
    if(f.eventPhase===0&&f.heardKnock&&dest==="7_room_right_b"&&!f.knockSceneSeen){
      tr(()=>{setLoc(dest);setBrightness("normal");setNavOff(false);setShowElev(false);
        setT("객실 앞에 다가갔다.\n\n문 앞에 누군가 서있다.\n\n직원 유니폼을 입고 있다.");
        setChoices([{text:"무슨 일 있나요?",action:()=>{uF({knockSceneSeen:true});setT("\"아무것도 아닙니다.\"\n\n직원은 웃으며 대답한 후,\n비상계단 쪽으로 걸어갔다.");setChoices([]);setNavOff(false);}}]);
      });return;
    }
    // Fake7 corridor after elev called
    if(f.fake7ElevCalled&&(dest==="f7_cor_upper"||dest==="f7_cor_lower")){die("뒤에서 무언가가 다가왔다.",8);return;}
    // 3F sound death - check using ref for fresh flags
    if(f.eventPhase===6&&f.floor3Arrived&&!f.floor3Fled){
      if(f.soundLocs.includes(dest)){die("뒤에서 무언가가 다가왔다.",1);return;}
    }
    // 3F chase: upper corridor → rooms = blackout event
    if(f.eventPhase===6&&f.floor3Fled&&(dest==="3_room_left_a"||dest==="3_room_left_b")){
      snd.play("snd_powercut",{volume:0.6});
      tr(()=>{setLoc(dest);setBrightness("blackout");setNavOff(true);setShowElev(false);setCurFloor(3);
        setT("객실 앞까지 왔다.\n\n정전.\n\n복도 쪽에서 소리가 들린다.\n\n하나의 객실 문이 열려있다.");
        setChoices([
          {text:"열린 객실로 들어간다",action:()=>die("열려있는 방에서 무언가 나왔다.",7)},
          {text:"복도 끝에 몸을 숨긴다",action:()=>{snd.stop("snd_chase");tr(()=>{setBrightness("normal");setT("복도 끝에 웅크렸다.\n\n완전한 어둠.\n\n발소리가 지나간다.\n\n...\n\n불이 다시 켜졌다.");uF({floor3Hidden:true,eventPhase:7,soundLocs:[]});setChoices([]);setNavOff(false);});}},
        ]);
      });return;
    }
    tr(()=>{setLoc(dest);setChoices([]);setNavOff(false);setShowElev(false);const ld=LOCATIONS[dest];if(ld&&ld.floor&&typeof ld.floor==="number")setCurFloor(ld.floor);handleArr(dest);});
  },[tr,die,uF,snd]);

  const handleArr=useCallback(l=>{
    const f=flagsRef.current;
    if(l==="7_room_right_b"&&f.eventPhase===0&&!f.heardKnock){setBrightness("normal");setT("712호 객실 앞이다.");setChoices([]);setNavOff(false);return;}
    if(l==="7_corridor_lower"&&f.eventPhase===0&&!f.heardKnock){
      uF({heardKnock:true,soundLocs:["7_room_right_b"]});setBrightness("normal");snd.play("snd_knock",{volume:0.7});
      setT("복도를 걷는다.\n\n반대쪽에서 무언가 문을 두드리는 소리가 들린다.");setChoices([]);setNavOff(false);advTime(1);return;
    }
    if(l==="7_elev_area"&&f.eventPhase===0&&f.heardKnock&&!f.stairsFrom7Done){
      setBrightness("normal");setShowElev(false);setT("엘리베이터와 비상계단 입구가 보인다.");
      setChoices([{text:"엘리베이터를 부른다",action:()=>startElevDown()},{text:"비상계단으로 내려간다",action:()=>startStDown7()}]);setNavOff(false);return;
    }
    // 1F
    if(l==="1_lobby"){
      if(!f.hasCardKey&&!f.metLobbyPerson){
        uF({metLobbyPerson:true,eventPhase:2});setBrightness("dimNormal");
        setT("새벽의 로비.\n\n조명이 절반만 켜져 있다.\n\n소파에 누군가 앉아있다.\n\n\"...안녕하세요.\n지금 프론트에는 아무도 없어요.\"");
        setChoices([
          {text:"무시한다",action:()=>{setT("시선을 피하고 지나간다.");setChoices([]);setNavOff(false);}},
          {text:"아 그렇습니까?",action:()=>{setT("\"혹시 몇 층에 묵고 계세요?\"");setChoices([
            {text:"7층이에요.",action:()=>{addAccum(12);uF({lobbyPersonGone:true});setT("\"아 그러시구나...\"\n\n투숙객은 웃음을 지으며 목례를 하고 사라졌다.");setChoices([]);setNavOff(false);}},
            {text:"무시한다",action:()=>{setT("시선을 피하고 지나간다.");setChoices([]);setNavOff(false);}},
          ]);}},
        ]);setNavOff(false);return;
      }
      if(f.hasCardKey&&!f.lobbyPersonGone){uF({lobbyPersonGone:true,soundLocs:["1_entrance"]});setBrightness("dimNormal");setT("로비로 돌아왔다.\n\n아까 소파에 앉아있던 사람은 사라졌다.");setChoices([]);setNavOff(false);return;}
      setBrightness("dimNormal");setT("새벽의 로비.\n\n조용하다.");if(f.lobbyPersonGone&&f.entranceVisited&&!f.entranceWomanGone)uF({soundLocs:["1_entrance"]});setChoices([]);setNavOff(false);return;
    }
    if(l==="1_entrance"){
      if(!f.entranceVisited){uF({entranceVisited:true});setBrightness("dimNormal");setT("정문 앞에 섰다.\n\n잠겨있다.\n\n밖에서 누군가 유리문을 두드린다.\n\n\"저기요...\n카드키를 잃어버려서 들어갈 수가 없어요.\n문 좀 열어주실 수 있나요...?\"");setChoices([{text:"문을 열어준다",action:()=>die("밖에는 아무도 없었다.",16)}]);setNavOff(false);return;}
      if(f.hasCardKey&&!f.entranceWomanGone){uF({entranceWomanGone:true,soundLocs:[]});setT("다시 정문 앞에 왔다.\n\n아무도 없다.\n\n아까 밖에 있던 여자도 보이지 않는다.");setChoices([]);setNavOff(false);return;}
      setT("잠긴 정문.\n\n밖은 어둡다.");setChoices([]);setNavOff(false);return;
    }
    if(l==="1_front_desk"){
      if(!f.hasCardKey){setBrightness("dimNormal");setT("프론트 데스크.\n\n아무도 없다.\n\n카운터 위에 벨이 놓여있다.");setChoices([
        {text:"벨을 누른다",action:()=>{snd.play("snd_bell",{volume:0.6});addAccum(11);getKey();}},
        {text:"직원을 부른다",action:()=>{addAccum(11);getKey();}},
        {text:"기다린다",action:()=>getKey()},
      ]);setNavOff(false);return;}
      setT("프론트 데스크.\n\n직원은 다시 안쪽으로 들어갔다.");setChoices([]);setNavOff(false);return;
    }
    if(l==="1_elev_area"){
      if(f.hasCardKey){setBrightness("normal");setShowElev(false);setT("엘리베이터 앞에 섰다.");setChoices([{text:"엘리베이터를 부른다",action:()=>startElevUp()}]);setNavOff(false);return;}
      setBrightness("normal");setT("엘리베이터 앞.\n\n먼저 카드키를 받아야 할 것 같다.");setChoices([]);setNavOff(false);return;
    }
    // Fake7
    if(l==="f7_elev"){
      if(!f.arrivedFake7){uF({arrivedFake7:true,eventPhase:4});setBrightness("normal");setCurFloor(7);setT("7층에 도착했다.\n\n엘리베이터 앞이다.");setChoices([]);setNavOff(false);return;}
      if(f.fake7CorrVisited&&!f.fake7ElevCalled){
        setBrightness("normal");setShowElev(true);setElevInitFloor("1");setElevSeq(null);setElevAuto(false);
        uF({soundLocs:["f7_cor_upper","f7_cor_lower"]});snd.play("snd_chase",{volume:0.4,loop:true});
        setT("복도 쪽에서 소리가 점점 다가오고 있다.");setChoices([{text:"엘리베이터를 부른다",action:()=>callFake7Elev()}]);setNavOff(false);return;
      }
      setBrightness("normal");setT("엘리베이터 앞.");setChoices([]);setNavOff(false);return;
    }
    if(l==="f7_cor_upper"||l==="f7_cor_lower"){
      if(!f.fake7CorrVisited)uF({fake7CorrVisited:true});
      setBrightness("normal");setT("복도.\n\n벽에 붙어있는 안내판을 본다.\n\n← 720~725호\n726~730호 →");
      uF({soundLocs:["f7_room_upper","f7_room_lower"]});setChoices([]);setNavOff(false);return;
    }
    if(l==="f7_room_upper"||l==="f7_room_lower"){die("열려있는 방에서 무언가 나왔다.",7);return;}
    // 3F
    if(l==="3_elev_area"&&f.eventPhase===6){
      if(!f.floor3Arrived){
        uF({floor3Arrived:true,soundLocs:["3_corridor_lower","__stairs_3f"]});
        setBrightness("dark");setShowElev(true);setElevInitFloor("7");setElevSeq(null);setElevAuto(false);
        snd.play("snd_knock",{volume:0.5});
        setT("3층에 도착했다.\n\n근처에서 노크 소리가 들린다.");setChoices([{text:"엘리베이터를 부른다",action:()=>call3FElev()}]);setNavOff(false);return;
      }
      setBrightness("dark");setT("3층 엘리베이터 앞.");setChoices([]);setNavOff(false);return;
    }
    // 3F chase: upper corridor safe
    if(l==="3_corridor_upper"&&f.eventPhase===6&&f.floor3Fled){
      uF({soundLocs:["3_elev_area"]});setBrightness("dark");setT("상부 복도로 왔다.\n\n엘리베이터 쪽에서 소리가 들린다.");setChoices([]);setNavOff(false);return;
    }
    // 3F: lower corridor → show elev sound
    if(l==="3_corridor_lower"&&f.eventPhase===6&&f.floor3Fled){
      uF({soundLocs:["3_elev_area"]});setBrightness("dark");setT("하부 복도로 왔다.\n\n엘리베이터 쪽에서 소리가 들린다.");setChoices([]);setNavOff(false);return;
    }
    // Post-hide
    if(f.eventPhase===7&&f.floor3Hidden){
      if(l==="3_corridor_upper"||l==="3_corridor_lower"){setBrightness("normal");setT("복도.\n\n조용하다.");setChoices([]);setNavOff(false);return;}
      if(l==="3_elev_area"){setBrightness("normal");setShowElev(false);setT("엘리베이터 앞에 도착했다.");setChoices([{text:"엘리베이터를 부른다",action:()=>startFinalElev()},{text:"비상계단으로 올라간다",action:()=>startFinalStairs()}]);setNavOff(false);return;}
    }
    const ld=LOCATIONS[l];if(ld){setT(ld.name+".");setChoices([]);setNavOff(false);}
  },[uF,advTime,die,tr,snd,addAccum]);

  const getKey=useCallback(()=>{tr(()=>{uF({hasCardKey:true});setT("안쪽에서 직원이 나왔다.\n\n\"이런 시간에 어쩐 일이세요?\"\n\n\"카드키를 방에 두고 나왔어요.\"\n\n\"712호... 잠시만요.\"\n\n새 카드키를 건네받았다.");setChoices([]);setNavOff(false);});},[tr,uF]);

  // === ELEVATORS (sound only once, no loop) ===
  const startElevDown=useCallback(()=>{
    uF({eventPhase:1,soundLocs:[]});snd.play("snd_elev",{volume:0.5});snd.startBg();
    const seq=[{type:"floor",value:7,dir:"down",duration:1300},{type:"floor",value:6,dir:"down",duration:1300},{type:"floor",value:5,dir:"down",duration:1300},{type:"floor",value:3,dir:"down",duration:1300},{type:"floor",value:2,dir:"down",duration:1300},{type:"arrive",value:1,duration:1000}];
    tr(()=>{setLoc("elev_inside");setBrightness("normal");setNavOff(true);setShowElev(true);setElevInitFloor("7");setElevAuto(true);setElevSeq(seq);setCurFloor("—");setT("엘리베이터에 탑승했다.\n\n1층 버튼을 누른다.");setChoices([]);});
  },[tr,uF,snd]);

  const startElevUp=useCallback(()=>{
    snd.play("snd_elev",{volume:0.5});
    const seq=[{type:"floor",value:1,dir:"up",duration:1300},{type:"floor",value:2,dir:"up",duration:1300},{type:"floor",value:3,dir:"up",duration:1300},{type:"floor",value:5,dir:"up",duration:1300},{type:"floor",value:6,dir:"up",duration:1300},{type:"arrive",value:7,duration:1000}];
    tr(()=>{setLoc("elev_inside");setBrightness("normal");setNavOff(true);setShowElev(true);setElevInitFloor("1");setElevAuto(true);setElevSeq(seq);setCurFloor("—");setT("엘리베이터에 탑승했다.\n\n7층 버튼을 누른다.");setChoices([]);});
  },[tr,snd]);

  const callFake7Elev=useCallback(()=>{
    uF({fake7ElevCalled:true});snd.play("snd_elev",{volume:0.5});
    const seq=[{type:"floor",value:1,dir:"up",duration:1300},{type:"floor",value:2,dir:"up",duration:1300},{type:"floor",value:3,dir:"up",duration:1300},{type:"floor",value:4,dir:"up",duration:1300},{type:"pause",duration:1500},{type:"door_open",duration:1500},{type:"door_close",duration:1200},{type:"floor",value:5,dir:"up",duration:1300},{type:"floor",value:6,dir:"up",duration:1300},{type:"arrive",value:7,duration:1000}];
    setElevAuto(true);setElevSeq(seq);setChoices([]);
  },[uF,snd]);

  const call3FElev=useCallback(()=>{
    snd.play("snd_elev",{volume:0.5});snd.play("snd_chase",{volume:0.4,loop:true});
    const seq=[{type:"floor",value:7,dir:"down",duration:1300},{type:"floor",value:6,dir:"down",duration:1300},{type:"floor",value:5,dir:"down",duration:1300}];
    setElevAuto(true);setElevSeq(seq);setT("층수 표시가 움직인다.\n\n발소리가 점점 다가온다.");setChoices([]);setNavOff(true);
  },[snd]);

  const startFinalElev=useCallback(()=>{
    snd.stop("snd_chase");snd.play("snd_elev",{volume:0.5});
    const seq=[{type:"floor",value:3,dir:"up",duration:1300},{type:"floor",value:4,dir:"up",duration:1800},{type:"floor",value:5,dir:"up",duration:1300},{type:"floor",value:6,dir:"up",duration:1300},{type:"arrive",value:7,duration:1000}];
    tr(()=>{setLoc("elev_inside");setBrightness("normal");setNavOff(true);setShowElev(true);setElevInitFloor("3");setElevAuto(true);setElevSeq(seq);setCurFloor(3);setT("엘리베이터에 탑승했다.\n\n7층을 누른다.");setChoices([]);});
  },[tr,snd]);

  // Elevator completions
  const onElevDone=useCallback(()=>{
    const f=flagsRef.current;
    if(f.eventPhase===1){
      snd.play("snd_elev",{volume:0.3});setCurFloor(1);setT("도착.");setChoices([{text:"내린다",action:()=>{tr(()=>{setPhase(PHASE.GAME);setLoc("1_lobby");setCurFloor(1);setShowElev(false);handleArr("1_lobby");});}}]);
    }else if(f.eventPhase===2&&!f.arrivedFake7){
      snd.play("snd_elev",{volume:0.3});setCurFloor(7);setT("도착.");setChoices([{text:"내린다",action:()=>{tr(()=>{setPhase(PHASE.GAME);setLoc("f7_elev");setCurFloor(7);setShowElev(false);handleArr("f7_elev");});}}]);
    }else if(f.eventPhase===4){
      snd.play("snd_elev",{volume:0.3});setT("엘리베이터가 도착했다.");setChoices([{text:"엘리베이터에 탑승한다",action:()=>die("혼자가 아니었다.",14)}]);timerRef.current=setTimeout(()=>{die("벗어나지 못했다.",5);},5000);setNavOff(false);
    }else if(f.eventPhase===6){
      uF({floor3Fled:true,soundLocs:["3_corridor_lower","3_elev_area"]});setShowElev(false);setT("발소리가 바로 뒤까지 왔다.");setChoices([]);setNavOff(false);
    }else if(f.eventPhase===7){
      snd.play("snd_elev",{volume:0.3});setCurFloor(7);setT("도착.");
      setChoices([{text:"내린다",action:()=>{tr(()=>{setPhase(PHASE.GAME);setShowElev(false);
        if(accumReasons.length>0){setLoc("7_corridor_lower");setBrightness("normal");setCurFloor(7);setT("7층 복도.\n\n712호 앞에 도착했다.\n\n문이 열려있다.");setChoices([{text:"들어간다",action:()=>accumDie()}]);setNavOff(true);}
        else{setLoc("7_room_right_b");setBrightness("normal");setCurFloor(7);setT("7층 복도.\n\n712호 앞에 도착했다.\n\n카드키를 댄다.\n\n찰칵.");setChoices([{text:"들어간다",action:()=>{tr(()=>setPhase(PHASE.CLEAR));}}]);setNavOff(true);}
      });}}]);
    }
  },[tr,die,uF,handleArr,snd,accumReasons,accumDie]);

  // Stairs
  const startStDown7=useCallback(()=>{
    uF({soundLocs:[]});
    tr(()=>{setLoc("stairs");setBrightness("normal");setNavOff(true);setShowElev(false);setCurFloor(7);
      setT("비상계단에 들어섰다.\n\n내려가기 시작한다.");setChoices([{text:"내려간다",action:()=>{snd.play("snd_powercut",{volume:0.5});tr(()=>{setBrightness("blackout");setCurFloor("—");setT("불이 꺼졌다.");setChoices([{text:"멈춘다",action:()=>die("발소리가 멈췄다.",18)},{text:"계속 내려간다",action:()=>stD(1)}]);});}}]);});
  },[tr,die,uF,snd]);

  const stD=useCallback(step=>{
    const labels=["","6층...","5층...","..."];
    if(step<=3){tr(()=>{setBrightness("blackout");setCurFloor("—");setT(`어둠 속에서 계속 내려간다.\n\n${labels[step]}`);setChoices([{text:"멈춘다",action:()=>die("발소리가 멈췄다.",18)},{text:"계속 내려간다",action:()=>stD(step+1)}]);});}
    else{tr(()=>{setBrightness("normal");setCurFloor(4);setT("불이 켜졌다.\n\n4층.\n\n옆에 문이 보인다.\n\n위에서 발소리가 들린다.");setChoices([{text:"4층 문으로 들어간다",action:()=>die("이곳은 호텔이 아니다.",3)},{text:"계속 내려간다",action:()=>{tr(()=>{setBrightness("normal");setCurFloor(1);uF({stairsFrom7Done:true,eventPhase:2});snd.startBg();setT("계속 내려간다.\n\n3...\n2...\n1.\n\n1층에 도착했다.");setChoices([{text:"1층으로 나간다",action:()=>{tr(()=>{setPhase(PHASE.GAME);setLoc("1_lobby");setCurFloor(1);handleArr("1_lobby");});}}]);});}}]);});}
  },[tr,die,uF,handleArr,snd]);

  const startSt7AD=useCallback(()=>{
    if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}
    uF({soundLocs:[]});snd.stop("snd_chase");
    tr(()=>{setLoc("stairs");setBrightness("unstable");setNavOff(true);setShowElev(false);setCurFloor(7);
      setT("비상계단으로 들어섰다.\n\n내려간다.");setChoices([{text:"내려간다",action:()=>st7AD(1)}]);});
  },[tr,uF,snd]);

  const st7AD=useCallback(step=>{
    const labels=["","7A","7B","7C","7D"];
    const texts=["","7A층 ..?","여전히 7층이다.","또 7층이다.","벗어날 수 없다.."];
    if(step<labels.length){tr(()=>{setBrightness("unstable");setCurFloor(labels[step]);setT(texts[step]);setChoices([{text:"계속 내려간다",action:()=>st7AD(step+1)}]);});}
    else{snd.play("snd_powercut",{volume:0.5});tr(()=>{setBrightness("blackout");setCurFloor("—");setT("불이 꺼졌다.");setChoices([{text:"내려간다",action:()=>st7ADdark(1)}]);});}
  },[tr,snd]);

  const st7ADdark=useCallback(step=>{
    if(step<2){tr(()=>{setBrightness("blackout");setCurFloor("—");setT("어둠 속에서 내려간다.\n\n...");setChoices([{text:"내려간다",action:()=>st7ADdark(step+1)}]);});}
    else{tr(()=>{setBrightness("normal");setCurFloor(3);uF({eventPhase:6});setT("불이 켜졌다.\n\n벽에는 3층이라고 써있다.");setChoices([{text:"3층으로 나간다",action:()=>{
      tr(()=>{setPhase(PHASE.GAME);setLoc("3_elev_area");setCurFloor(3);
        uF({floor3Arrived:true,soundLocs:["3_corridor_lower","__stairs_3f"]});
        setBrightness("dark");setShowElev(true);setElevInitFloor("7");setElevSeq(null);setElevAuto(false);
        snd.play("snd_knock",{volume:0.5});setT("3층에 도착했다.\n\n근처에서 노크 소리가 들린다.");
        setChoices([{text:"엘리베이터를 부른다",action:()=>call3FElev()}]);setNavOff(false);});
    }}]);});}
  },[tr,uF,snd]);

  const startFinalStairs=useCallback(()=>{
    snd.stop("snd_chase");
    tr(()=>{setLoc("stairs");setBrightness("normal");setNavOff(true);setShowElev(false);setCurFloor(3);
      setT("비상계단으로 올라간다.\n\n4...\n5...\n6...\n7.");setChoices([{text:"7층으로 나간다",action:()=>{
        tr(()=>{setPhase(PHASE.GAME);setCurFloor(7);
          if(accumReasons.length>0){setLoc("7_corridor_lower");setBrightness("normal");setT("7층 복도.\n\n712호 앞에 도착했다.\n\n문이 열려있다.");setChoices([{text:"들어간다",action:()=>accumDie()}]);setNavOff(true);}
          else{setLoc("7_room_right_b");setBrightness("normal");setT("7층 복도.\n\n712호 앞에 도착했다.\n\n카드키를 댄다.\n\n찰칵.");setChoices([{text:"들어간다",action:()=>{tr(()=>setPhase(PHASE.CLEAR));}}]);setNavOff(true);}
        });
      }}]);});
  },[tr,accumReasons,accumDie,snd]);

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
    const mk=c=>({id:c.to,label:(c.to==="__stairs_f7"||c.to==="__stairs_3f")?"비상계단":(LOCATIONS[c.to]?.short||c.to),hasSound:f.soundLocs.includes(c.to)});
    return{left:conns.filter(c=>c.dir==="left").map(mk),right:conns.filter(c=>c.dir==="right").map(mk)};
  };

  const nav=getNav();
  const handleNavClick=id=>{
    if(id==="__stairs_f7")startSt7AD();
    else if(id==="__stairs_3f"){const f=flagsRef.current;if(f.eventPhase===7)startFinalStairs();else die("뒤에서 무언가가 다가왔다.",1);}
    else moveTo(id);
  };

  return(<>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Noto+Sans+KR:wght@200;300;400;500&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      .game-root{font-family:'Noto Sans KR',sans-serif;background:#08080a;color:#d4d0cb;min-height:100vh;display:flex;justify-content:center;position:relative;overflow-x:hidden}
      .game-frame{width:100%;max-width:520px;min-height:100vh;position:relative;z-index:1;display:flex;flex-direction:column;transition:opacity .5s ease}
      .game-frame.fading{opacity:0}
      .game-content{flex:1;padding:1.2rem 1.5rem .5rem;display:flex;flex-direction:column}
      .scene-header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:.6rem;gap:.6rem;position:relative;z-index:60;background:#08080a;padding-top:.2rem}
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
      .scene-divider{height:1px;background:linear-gradient(90deg,#2a2520,transparent);margin-bottom:.8rem}
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
      .scene-text{flex:1;font-size:.88rem;line-height:1.85;color:#b5b0a8;font-weight:300;letter-spacing:.01em;margin-bottom:.6rem;min-height:60px}
      .cursor-blink{color:#8a4030;animation:blink 1s steps(1) infinite}
      @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
      .text-continue{display:block;text-align:center;color:#4a4540;font-size:.65rem;margin-top:.3rem;animation:pulse 1.5s ease infinite}
      @keyframes pulse{0%,100%{opacity:.3}50%{opacity:.8}}
      .choices-area{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.6rem;animation:fadeUp .5s ease;position:relative;z-index:60}
      @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      .choice-btn{background:#12121a;border:1px solid rgba(255,255,255,.12);color:#c0b8ae;font-family:'Noto Sans KR',sans-serif;font-size:.8rem;font-weight:300;padding:.7em 1em;text-align:center;cursor:pointer;transition:all .3s ease;position:relative;z-index:60}
      .choice-btn:hover{background:#1a1a24;border-color:rgba(150,120,80,.4);color:#e0d8ce}
      .nav-area{padding:.4rem 1.5rem .8rem;display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.04);position:relative;z-index:60;min-height:2.5rem;background:#08080a}
      .nav-col{display:flex;flex-direction:column;gap:.2rem;min-width:40%}
      .nav-col-left{align-items:flex-start}
      .nav-col-right{align-items:flex-end}
      .nav-btn{display:flex;align-items:center;gap:.3em;background:none;border:none;color:#7a7570;font-family:'Noto Sans KR',sans-serif;font-size:.82rem;font-weight:300;cursor:pointer;padding:.35em .2em;transition:color .2s;letter-spacing:.05em;white-space:nowrap}
      .nav-btn:hover{color:#b0a898}
      .nav-arrow{font-size:.9rem;color:#5a5550}
      .nav-sound{color:#8a4030;font-size:.6rem;animation:soundPulse 1s ease infinite}
      @keyframes soundPulse{0%,100%{opacity:1}50%{opacity:.3}}
      .title-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}
      .title-number{font-family:'Cormorant Garamond',serif;font-size:5rem;font-weight:300;color:rgba(180,150,100,.12);letter-spacing:.3em;line-height:1}
      .title-name{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:300;letter-spacing:.5em;color:#a09080;margin-bottom:1.5rem}
      .title-divider{width:50px;height:1px;background:linear-gradient(90deg,transparent,#555,transparent);margin:0 auto 1.5rem}
      .title-tagline{font-size:.8rem;color:#5a5550;letter-spacing:.3em;font-weight:200;margin-bottom:3rem}
      .title-start{background:transparent;border:1px solid #3a3530;color:#8a8070;font-family:'Noto Sans KR',sans-serif;font-size:.8rem;font-weight:300;padding:.9em 3.5em;cursor:pointer;letter-spacing:.25em;transition:all .4s ease}
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
      .death-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}
      .death-text{font-size:1rem;color:#8a3030;letter-spacing:.15em;margin-bottom:2rem;animation:deathFade 1.5s ease}
      @keyframes deathFade{from{opacity:0;filter:blur(6px)}to{opacity:1;filter:blur(0)}}
      .clear-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}
      .clear-time{font-family:'Cormorant Garamond',serif;font-size:2.5rem;font-weight:300;color:rgba(200,180,140,.3);letter-spacing:.2em;margin-bottom:1rem;animation:clearIn 2s ease}
      .clear-text{font-size:.95rem;color:#a09888;line-height:2;font-weight:300;margin-bottom:1.5rem;animation:clearIn 2.5s ease}
      .clear-sub{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#8a9a70;letter-spacing:.4em;margin-bottom:2rem;animation:clearIn 3s ease}
      @keyframes clearIn{from{opacity:0}to{opacity:1}}
      .clear-btn{background:transparent;border:1px solid #3a3a30;color:#6a6a58;font-family:'Noto Sans KR',sans-serif;font-size:.75rem;padding:.7em 2.5em;cursor:pointer;letter-spacing:.15em;transition:all .3s ease;font-weight:300}
      .clear-btn:hover{border-color:#6a6a50;color:#a0a080}
    `}</style>
    <div className="game-root">
      <div style={getBStyle()}/>
      <div className={`game-frame ${!fade?"fading":""}`}>
        {phase===PHASE.TITLE&&(<div className="title-screen"><div className="title-number">712</div><div className="title-name">HOTEL LIMINAL</div><div className="title-divider"/><div className="title-tagline">규칙을 기억하세요</div><button className="title-start" onClick={()=>{snd.startBg();tr(()=>setPhase(PHASE.RULES));}}>체크인</button></div>)}
        {phase===PHASE.RULES&&<RulesScreen page={1} highlightRules={[]} onNext={()=>tr(()=>setPhase(PHASE.RULES_P2))}/>}
        {phase===PHASE.RULES_P2&&<RulesScreen page={2} highlightRules={[]} onNext={()=>{tr(()=>{setPhase(PHASE.GAME);setLoc("7_room_right_b");setCurFloor(7);setT("객실 712호.\n\n테이블 위에 놓여있던 규칙서를 대충 훑어봤다.\n\n침대에 누웠다.\n\n...\n\n배가 고프다.\n\n시계를 보니 새벽 2시 47분.\n\n편의점이라도 다녀와야겠다.");setChoices([{text:"객실을 나선다",action:()=>{tr(()=>{setLoc("7_room_right_b");setT("복도로 나왔다.\n\n뒤를 돌아보니 문이 닫혀 있다.\n\n주머니를 뒤졌다.\n\n카드키가 없다.\n\n방 안에 두고 나온 것 같다.");setChoices([]);setNavOff(false);advTime(1);});}}]);setNavOff(true);});}}/>}
        {phase===PHASE.DEATH&&(<div className="death-screen"><div className="death-text">{deathText}</div>{deathRules.length>0&&<DeathRulesViewer rules={deathRules} onRestart={resetGame}/>}</div>)}
        {phase===PHASE.ACCUM_DEATH&&(<div className="death-screen"><div className="death-text">문이 열려있다.</div>{deathRules.length>0&&<DeathRulesViewer rules={deathRules} onRestart={resetGame}/>}</div>)}
        {phase===PHASE.CLEAR&&(<div className="clear-screen"><div className="clear-time">AM 6:00</div><div className="clear-text">문을 닫았다.<br/><br/>창문 사이로 햇빛이 들어온다.<br/><br/>밤이 끝났다.</div><div className="clear-sub">생존</div><button className="clear-btn" onClick={resetGame}>처음으로</button></div>)}
        {phase===PHASE.GAME&&(<>
          {!textDone&&<div className="text-advance-overlay" onClick={()=>advRef.current&&advRef.current()}/>}
          <div className="game-content">
            <div className="scene-header"><div className="header-left"><FloorIndicator floor={curFloor}/><span className="scene-location">{LOCATIONS[loc]?.name||loc}</span></div><span className="scene-time">{gameTime}</span></div>
            <div className="scene-divider"/>
            {showElev&&<ElevatorDisplay sequence={elevSeq} onComplete={onElevDone} initialFloor={elevInitFloor} autoStart={elevAuto}/>}
            <div className="scene-text"><TypewriterLines key={textLines.join("|")} lines={textLines} onAllDone={()=>setTextDone(true)} advanceRef={advRef}/></div>
            {textDone&&choices.length>0&&(<div className="choices-area">{choices.map((c,i)=>(<button key={i} className="choice-btn" onClick={c.action}>{c.text}</button>))}</div>)}
          </div>
          {textDone&&(<div className="nav-area">
            <div className="nav-col nav-col-left">{nav.left.map(n=>(<button key={n.id} className="nav-btn" onClick={()=>handleNavClick(n.id)}><span className="nav-arrow">←</span>{n.label}{n.hasSound&&<span className="nav-sound">♪</span>}</button>))}</div>
            <div className="nav-col nav-col-right">{nav.right.map(n=>(<button key={n.id} className="nav-btn" onClick={()=>handleNavClick(n.id)}>{n.hasSound&&<span className="nav-sound">♪</span>}{n.label}<span className="nav-arrow">→</span></button>))}</div>
          </div>)}
        </>)}
      </div>
    </div>
  </>);
}
