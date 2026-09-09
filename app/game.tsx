import {useCallback,useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Check,Crown,Lightbulb,Trophy,X,Zap} from 'lucide-react';
import {type Atlas} from './anatomy';
import {type Difficulty,type Question,DIFFICULTY_LABELS,DIFFICULTY_MULTIPLIER,DIFFICULTY_TIME,DIFFICULTY_HINTS,DIFFICULTY_WRONG_HINTS,WRONG_PENALTY_SECONDS,type HintTier,hintTiers,generateQuiz,scoreQuestion} from './game-questions';
import {type ScoreEntry,saveScore,getTopToday,getTopAllTime,initLeaderboard,isRemoteAvailable} from './game-store';
import {burst,celebrate} from './confetti';
import * as sfx from './sounds';

type Phase = 'start'|'playing'|'results'|'leaderboard';
interface Props {atlas: Atlas; onSelect: string|null; onExit: ()=>void; onHighlight:(ids:string[])=>void; onReset:()=>void; onFlashSystem:(id:string|null)=>void; onIsolateSystem:(id:string)=>void;}

export default function Game({atlas,onSelect,onExit,onHighlight,onReset,onFlashSystem,onIsolateSystem}:Props){
  const [phase,setPhase]=useState<Phase>('start');
  const [difficulty,setDifficulty]=useState<Difficulty>('elementary');
  const [questions,setQuestions]=useState<Question[]>([]);
  const [qi,setQi]=useState(0);
  const [scores,setScores]=useState<number[]>([]);
  const [timer,setTimer]=useState(30);
  const [attempts,setAttempts]=useState(0);
  const [feedback,setFeedback]=useState<'correct'|'wrong'|'timeout'|null>(null);
  const [answered,setAnswered]=useState(false);
  const [showHint,setShowHint]=useState(false);
  const [hintsUsed,setHintsUsed]=useState(0);
  const [earnedTier,setEarnedTier]=useState(-1);
  const [penaltyPing,setPenaltyPing]=useState(0);
  const [playerName,setPlayerName]=useState('');
  const [tab,setTab]=useState<'today'|'alltime'>('today');
  const [saved,setSaved]=useState(false);
  const [board,setBoard]=useState<ScoreEntry[]>([]);
  const [boardLoading,setBoardLoading]=useState(false);
  const [madeBoard,setMadeBoard]=useState(false);
  const [lbNonce,setLbNonce]=useState(0);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const startTimeRef=useRef(0);

  const q=questions[qi];
  const maxTime=DIFFICULTY_TIME[difficulty];
  const maxHints=DIFFICULTY_HINTS[difficulty];
  const totalScore=scores.reduce((a,b)=>a+b,0);
  const correctCount=scores.filter(s=>s>0).length;
  const tiers:HintTier[]=q?hintTiers(q):[];
  const maxTier=Math.min(DIFFICULTY_WRONG_HINTS[difficulty],tiers.length)-1;
  const activeTiers=earnedTier>=0?tiers.slice(0,earnedTier+1):[];

  const stopTimer=useCallback(()=>{if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;}},[]);

  const startTimer=useCallback(()=>{
    stopTimer();
    startTimeRef.current=Date.now();
    setTimer(maxTime);
    timerRef.current=setInterval(()=>{
      const elapsed=(Date.now()-startTimeRef.current)/1000;
      const remaining=Math.max(0,maxTime-elapsed);
      setTimer(remaining);
      if(remaining<=0){setAnswered(true);setFeedback('timeout');clearInterval(timerRef.current!);timerRef.current=null;}
    },100);
  },[stopTimer,maxTime]);

  useEffect(()=>()=>stopTimer(),[stopTimer]);

  // Celebrate a correct answer: pop confetti near the question panel and chime.
  useEffect(()=>{
    if(feedback!=='correct')return;
    sfx.correct();
    burst(window.innerWidth*0.72,window.innerHeight*0.4);
  },[feedback]);

  // Audible countdown over the final 10 seconds, fired once per whole second.
  const lastTickRef=useRef(-1);
  useEffect(()=>{
    if(phase!=='playing'||answered){lastTickRef.current=-1;return;}
    const whole=Math.ceil(timer);
    if(whole<=10&&whole>0&&whole!==lastTickRef.current){
      lastTickRef.current=whole;
      sfx.tick(whole);
    }
  },[timer,phase,answered]);

  useEffect(()=>{initLeaderboard();},[]);

  // Leaderboard reads hit the shared Snowflake table, so they're async.
  useEffect(()=>{
    if(phase!=='start'&&phase!=='leaderboard')return;
    let alive=true;
    setBoardLoading(true);
    const load=tab==='today'?getTopToday(10):getTopAllTime(10);
    load.then(rows=>{if(alive){setBoard(rows);setBoardLoading(false);}})
        .catch(()=>{if(alive){setBoard([]);setBoardLoading(false);}});
    return()=>{alive=false;};
  },[phase,tab,lbNonce]);

  const startGame=()=>{
    const quiz=generateQuiz(atlas,difficulty);
    setQuestions(quiz);setQi(0);setScores([]);setAttempts(0);setAnswered(false);setFeedback(null);setSaved(false);setShowHint(false);setHintsUsed(0);setEarnedTier(-1);
    setPhase('playing');
    sfx.gameStart();
    onHighlight([]);onReset();onFlashSystem(null);
  };

  useEffect(()=>{if(phase==='playing'&&questions.length>0){setShowHint(false);setHintsUsed(0);startTimer();}},[phase,qi,questions.length,startTimer]);

  useEffect(()=>{
    if(answered&&feedback!=='correct'&&q&&q.targetPartIds.length){
      onHighlight(q.targetPartIds);
    }
  },[answered]);

  /**
   * Shared wrong-answer path: docks WRONG_PENALTY_SECONDS from the round clock
   * and advances the hint ladder one rung (capped by difficulty).
   */
  const registerWrong=useCallback(()=>{
    setAttempts(a=>a+1);
    setFeedback('wrong');
    setPenaltyPing(p=>p+1);
    sfx.wrong();
    // Push the start time backwards so the derived countdown loses 5s at once.
    startTimeRef.current-=WRONG_PENALTY_SECONDS*1000;
    const elapsed=(Date.now()-startTimeRef.current)/1000;
    if(maxTime-elapsed<=0){
      setTimer(0);setAnswered(true);setFeedback('timeout');stopTimer();
      if(q&&q.targetPartIds.length)onHighlight(q.targetPartIds);
      return;
    }
    setEarnedTier(t=>Math.min(t+1,maxTier));
    setTimeout(()=>setFeedback(f=>f==='wrong'?null:f),600);
  },[maxTime,maxTier,stopTimer,q,onHighlight]);

  // Fire the side effects a newly-earned hint tier calls for.
  useEffect(()=>{
    if(earnedTier<0||!tiers[earnedTier])return;
    const tier=tiers[earnedTier];
    if(tier.kind==='system-flash'&&tier.system)onFlashSystem(tier.system);
    if(tier.kind==='isolate'&&tier.system)onIsolateSystem(tier.system);
    if(tier.kind==='location')setShowHint(true);
  },[earnedTier]);

  useEffect(()=>{
    if(phase!=='playing'||!q||answered)return;
    if(!onSelect)return;
    if(q.type==='find'||q.type==='system-id'){
      if(q.targetPartIds.includes(onSelect)){
        const pts=scoreQuestion(timer,maxTime,attempts,difficulty);
        setScores(s=>[...s,pts]);setFeedback('correct');setAnswered(true);stopTimer();
        onHighlight(q.targetPartIds);
      } else {
        registerWrong();
      }
    }
  },[onSelect]);

  const answerMC=(index:number)=>{
    if(answered||!q)return;
    if(index===q.correctChoice){
      const pts=scoreQuestion(timer,maxTime,attempts,difficulty);
      setScores(s=>[...s,pts]);setFeedback('correct');setAnswered(true);stopTimer();
      if(q.targetPartIds.length)onHighlight(q.targetPartIds);
    } else {
      registerWrong();
    }
  };

  const useHint=()=>{
    setHintsUsed(h=>h+1);setShowHint(true);
  };

  const nextQuestion=()=>{
    if(qi+1>=questions.length){
      if(!answered)setScores(s=>[...s,0]);
      setPhase('results');sfx.roundEnd();onHighlight([]);onReset();onFlashSystem(null);
    } else {
      if(!answered)setScores(s=>[...s,0]);
      sfx.uiSelect();
      setQi(i=>i+1);setAttempts(0);setAnswered(false);setFeedback(null);setShowHint(false);
      setEarnedTier(-1);
      onHighlight([]);onReset();onFlashSystem(null);
    }
  };

  const handleSave=async()=>{
    if(!playerName.trim()||saved)return;
    const entry:ScoreEntry={
      name:playerName.trim(),score:totalScore,difficulty,
      date:new Date().toISOString(),correct:correctCount,total:questions.length,
    };
    setSaved(true);
    await saveScore(entry);
    // Did this score actually land in the top 10? Only celebrate if so.
    const top=await getTopAllTime(10);
    const placed=top.some(e=>e.name===entry.name&&e.score===entry.score);
    setMadeBoard(placed);
    if(placed){sfx.leaderboard();celebrate();}
    setLbNonce(n=>n+1);
    setPhase('leaderboard');
  };

  if(phase==='start'){
    const list=board;
    return <div className="game-start-layout">
      <div className="game-overlay glass">
        <div className="game-title"><Trophy size={28}/><h2>Game Mode</h2></div>
        <p className="game-subtitle">Test your anatomy knowledge — 5 questions, find structures, answer trivia.</p>
        <div className="game-difficulty">
          <span className="game-diff-label">Difficulty</span>
          <div className="game-diff-buttons">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(d=>(
              <Button key={d} variant="ghost" className={`game-diff-btn ${difficulty===d?'active':''}`} onClick={()=>{sfx.uiSelect();setDifficulty(d);}}>
                <span>{DIFFICULTY_LABELS[d]}</span>
                <span className="game-diff-meta">{DIFFICULTY_TIME[d]}s · {DIFFICULTY_MULTIPLIER[d]}x{DIFFICULTY_HINTS[d]>0?` · ${DIFFICULTY_HINTS[d]} hints`:''}</span>
              </Button>
            ))}
          </div>
        </div>
        <div className="game-start-actions">
          <Button className="game-start-btn" onClick={startGame}><Zap size={16}/>Start Quiz</Button>
          <Button variant="ghost" className="game-exit-btn" onClick={onExit}>Back to Explorer</Button>
        </div>
      </div>
      <div className="game-lb-panel glass">
        <div className="game-title"><Crown size={22}/><h2>Leaderboard</h2></div>
        <div className="game-lb-tabs">
          <Button variant="ghost" className={tab==='today'?'active':''} onClick={()=>{sfx.uiSelect();setTab('today');}}>Today</Button>
          <Button variant="ghost" className={tab==='alltime'?'active':''} onClick={()=>{sfx.uiSelect();setTab('alltime');}}>All Time</Button>
        </div>
        {boardLoading&&list.length===0?<p className="game-lb-empty">Loading scores…</p>:
        list.length===0?<p className="game-lb-empty">No scores yet — be the first!</p>:
        <div className="game-lb-table">
          <div className="game-lb-header"><span>#</span><span>Name</span><span>Score</span><span>Level</span></div>
          {list.map((e,i)=>(
            <div key={i} className={`game-lb-row ${i<3?'top-three':''}`}>
              <span className="game-lb-rank">{i+1}</span>
              <span className="game-lb-name">{e.name}</span>
              <span className="game-lb-score">{e.score}</span>
              <Badge variant="outline" className="game-lb-diff">{DIFFICULTY_LABELS[e.difficulty as Difficulty]}</Badge>
            </div>
          ))}
        </div>}
      </div>
    </div>;
  }

  if(phase==='playing'&&q){
    const timerPct=Math.max(0,(timer/maxTime)*100);
    // Percentage-based so the 10s Medical School clock escalates on the same
    // curve as the 60s Elementary one.
    const timerState=timerPct<=17?'crit':timerPct<=33?'warn':'';
    const answerLabel=q.type==='multiple-choice'&&q.choices&&q.correctChoice!=null?q.choices[q.correctChoice]:q.targetConceptName;
    return <>
      <div className="game-hud glass">
        <span className="game-hud-q">Q{qi+1}<span>/{questions.length}</span></span>
        <span className="game-hud-score"><Zap size={14}/>{totalScore}</span>
        <span className={`game-hud-timer ${timerState}`}>{Math.ceil(timer)}s
          {penaltyPing>0&&<span key={penaltyPing} className="game-penalty">-{WRONG_PENALTY_SECONDS}s</span>}
        </span>
        <Badge variant="outline" className="game-hud-diff">{DIFFICULTY_LABELS[difficulty]}</Badge>
        <div className="game-hud-bar"><div className={`game-hud-bar-fill ${timerState}`} style={{width:`${timerPct}%`}}/></div>
      </div>
      <div className={`game-prompt game-prompt-right glass ${feedback??''}`}>
        <p className="game-prompt-text">{q.prompt}</p>
        {q.type==='multiple-choice'&&q.choices&&(
          <div className="game-choices">
            {q.choices.map((c,i)=>(
              <Button key={i} variant="ghost" className={`game-choice ${answered&&i===q.correctChoice?'correct':''} ${answered&&i!==q.correctChoice?'dim':''}`}
                disabled={answered} onClick={()=>answerMC(i)}>
                {c}
              </Button>
            ))}
          </div>
        )}
        {q.type!=='multiple-choice'&&!answered&&<p className="game-hint">Tap on the 3D model to answer</p>}
        {!answered&&maxHints>0&&q.hint&&hintsUsed<maxHints&&!showHint&&(
          <Button variant="ghost" className="game-hint-btn" onClick={useHint}><Lightbulb size={14}/>Use hint ({maxHints-hintsUsed} left)</Button>
        )}
        {!answered&&showHint&&q.hint&&<p className="game-hint-text"><Lightbulb size={14}/>{q.hint}</p>}
        {!answered&&activeTiers.length>0&&<div className="game-earned-hints">
          {activeTiers.map((t,i)=>(
            <p key={i} className={`game-hint-text game-tier-${t.kind}`}><Lightbulb size={14}/>{t.text}</p>
          ))}
        </div>}
        {answered&&<div className="game-answer-reveal">
          <div className="game-answer-row">
            {feedback==='correct'?<span className="game-correct"><Check size={16}/>Correct! +{scores[scores.length-1]} pts</span>
             :<span className="game-timeout"><X size={16}/>Time's up! It was: <strong>{answerLabel}</strong></span>}
            <Button className="game-next-btn" onClick={nextQuestion}>{qi+1>=questions.length?'See Results':'Next'}</Button>
          </div>
          {q.fact&&<p className="game-fact">{q.fact}</p>}
        </div>}
      </div>
      {feedback==='wrong'&&!answered&&<div className="game-wrong-flash">Not quite — -{WRONG_PENALTY_SECONDS}s{earnedTier<maxTier?' · hint unlocked':''}</div>}
    </>;
  }

  if(phase==='results'){
    return <div className="game-overlay glass">
      <div className="game-title"><Crown size={28}/><h2>Quiz Complete!</h2></div>
      <div className="game-results-summary">
        <div className="game-big-score">{totalScore}</div>
        <div className="game-results-meta">
          <span>{correctCount}/{questions.length} correct</span>
          <Badge variant="outline">{DIFFICULTY_LABELS[difficulty]} ({DIFFICULTY_MULTIPLIER[difficulty]}x)</Badge>
        </div>
      </div>
      <div className="game-name-entry">
        <label>Enter your name for the leaderboard</label>
        <input type="text" value={playerName} onChange={e=>setPlayerName(e.target.value)}
          placeholder="Your name" maxLength={20} className="game-name-input"
          onKeyDown={e=>{if(e.key==='Enter')handleSave();}}/>
        <Button className="game-start-btn" onClick={handleSave} disabled={!playerName.trim()}>Submit Score</Button>
      </div>
      <div className="game-start-actions">
        <Button variant="ghost" className="game-exit-btn" onClick={()=>{setPhase('start');onHighlight([]);}}>Play Again</Button>
        <Button variant="ghost" className="game-exit-btn" onClick={onExit}>Back to Explorer</Button>
      </div>
    </div>;
  }

  if(phase==='leaderboard'){
    const list=board;
    return <div className="game-overlay glass">
      <div className="game-title"><Trophy size={28}/><h2>Leaderboard</h2></div>
      {madeBoard&&<p className="game-lb-banner"><Crown size={16}/>You made the top 10!</p>}
      {!isRemoteAvailable()&&<p className="game-lb-note">Showing local scores — the shared leaderboard is unreachable.</p>}
      <div className="game-lb-tabs">
        <Button variant="ghost" className={tab==='today'?'active':''} onClick={()=>{sfx.uiSelect();setTab('today');}}>Top 10 Today</Button>
        <Button variant="ghost" className={tab==='alltime'?'active':''} onClick={()=>{sfx.uiSelect();setTab('alltime');}}>Top 10 All Time</Button>
      </div>
      {boardLoading&&list.length===0?<p className="game-lb-empty">Loading scores…</p>:
      list.length===0?<p className="game-lb-empty">No scores yet — be the first!</p>:
      <div className="game-lb-table">
        <div className="game-lb-header"><span>#</span><span>Name</span><span>Score</span><span>Level</span></div>
        {list.map((e,i)=>(
          <div key={i} className={`game-lb-row ${i<3?'top-three':''}`}>
            <span className="game-lb-rank">{i+1}</span>
            <span className="game-lb-name">{e.name}</span>
            <span className="game-lb-score">{e.score}</span>
            <Badge variant="outline" className="game-lb-diff">{DIFFICULTY_LABELS[e.difficulty as Difficulty]}</Badge>
          </div>
        ))}
      </div>}
      <div className="game-start-actions">
        <Button className="game-start-btn" onClick={()=>{sfx.uiSelect();setSaved(false);setMadeBoard(false);setPhase('start');}}><Zap size={16}/>Play Again</Button>
        <Button variant="ghost" className="game-exit-btn" onClick={onExit}>Back to Explorer</Button>
      </div>
    </div>;
  }

  return null;
}
