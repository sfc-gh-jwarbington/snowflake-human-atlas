import {useCallback,useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Check,Crown,Lightbulb,Trophy,X,Zap} from 'lucide-react';
import {type Atlas} from './anatomy';
import {type Difficulty,type Question,DIFFICULTY_LABELS,DIFFICULTY_MULTIPLIER,DIFFICULTY_TIME,DIFFICULTY_HINTS,generateQuiz,scoreQuestion} from './game-questions';
import {type ScoreEntry,saveScore,getTopToday,getTopAllTime} from './game-store';

type Phase = 'start'|'playing'|'results'|'leaderboard';
interface Props {atlas: Atlas; onSelect: string|null; onExit: ()=>void; onHighlight:(ids:string[])=>void; onReset:()=>void;}

export default function Game({atlas,onSelect,onExit,onHighlight,onReset}:Props){
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
  const [playerName,setPlayerName]=useState('');
  const [tab,setTab]=useState<'today'|'alltime'>('today');
  const [saved,setSaved]=useState(false);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const startTimeRef=useRef(0);

  const q=questions[qi];
  const maxTime=DIFFICULTY_TIME[difficulty];
  const maxHints=DIFFICULTY_HINTS[difficulty];
  const totalScore=scores.reduce((a,b)=>a+b,0);
  const correctCount=scores.filter(s=>s>0).length;

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

  const startGame=()=>{
    const quiz=generateQuiz(atlas,difficulty);
    setQuestions(quiz);setQi(0);setScores([]);setAttempts(0);setAnswered(false);setFeedback(null);setSaved(false);setShowHint(false);setHintsUsed(0);
    setPhase('playing');
    onHighlight([]);onReset();
  };

  useEffect(()=>{if(phase==='playing'&&questions.length>0){setShowHint(false);setHintsUsed(0);startTimer();}},[phase,qi,questions.length,startTimer]);

  useEffect(()=>{
    if(answered&&feedback!=='correct'&&q&&q.targetPartIds.length){
      onHighlight(q.targetPartIds);
    }
  },[answered]);

  useEffect(()=>{
    if(phase!=='playing'||!q||answered)return;
    if(!onSelect)return;
    if(q.type==='find'||q.type==='system-id'){
      if(q.targetPartIds.includes(onSelect)){
        const pts=scoreQuestion(timer,maxTime,attempts,difficulty);
        setScores(s=>[...s,pts]);setFeedback('correct');setAnswered(true);stopTimer();
        onHighlight(q.targetPartIds);
      } else {
        setAttempts(a=>a+1);setFeedback('wrong');
        setTimeout(()=>{setFeedback(null);if(maxHints>0&&hintsUsed<maxHints&&q.hint)setShowHint(true);},600);
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
      setAttempts(a=>a+1);setFeedback('wrong');
      setTimeout(()=>{setFeedback(null);if(maxHints>0&&hintsUsed<maxHints&&q.hint)setShowHint(true);},600);
    }
  };

  const useHint=()=>{
    setHintsUsed(h=>h+1);setShowHint(true);
  };

  const nextQuestion=()=>{
    if(qi+1>=questions.length){
      if(!answered)setScores(s=>[...s,0]);
      setPhase('results');onHighlight([]);onReset();
    } else {
      if(!answered)setScores(s=>[...s,0]);
      setQi(i=>i+1);setAttempts(0);setAnswered(false);setFeedback(null);setShowHint(false);
      onHighlight([]);onReset();
    }
  };

  const handleSave=()=>{
    if(!playerName.trim())return;
    const entry:ScoreEntry={
      name:playerName.trim(),score:totalScore,difficulty,
      date:new Date().toISOString(),correct:correctCount,total:questions.length,
    };
    saveScore(entry);setSaved(true);setPhase('leaderboard');
  };

  if(phase==='start'){
    const today=getTopToday(10),allTime=getTopAllTime(10);
    const list=tab==='today'?today:allTime;
    return <div className="game-start-layout">
      <div className="game-overlay glass">
        <div className="game-title"><Trophy size={28}/><h2>Game Mode</h2></div>
        <p className="game-subtitle">Test your anatomy knowledge — 5 questions, find structures, answer trivia.</p>
        <div className="game-difficulty">
          <span className="game-diff-label">Difficulty</span>
          <div className="game-diff-buttons">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(d=>(
              <Button key={d} variant="ghost" className={`game-diff-btn ${difficulty===d?'active':''}`} onClick={()=>setDifficulty(d)}>
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
          <Button variant="ghost" className={tab==='today'?'active':''} onClick={()=>setTab('today')}>Today</Button>
          <Button variant="ghost" className={tab==='alltime'?'active':''} onClick={()=>setTab('alltime')}>All Time</Button>
        </div>
        {list.length===0?<p className="game-lb-empty">No scores yet — be the first!</p>:
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
    const lowTime=timer<(maxTime*0.33);
    const answerLabel=q.type==='multiple-choice'&&q.choices&&q.correctChoice!=null?q.choices[q.correctChoice]:q.targetConceptName;
    return <>
      <div className="game-hud glass">
        <span className="game-hud-q">Q{qi+1}<span>/{questions.length}</span></span>
        <span className="game-hud-score"><Zap size={14}/>{totalScore}</span>
        <span className={`game-hud-timer ${lowTime?'low':''}`}>{Math.ceil(timer)}s</span>
        <Badge variant="outline" className="game-hud-diff">{DIFFICULTY_LABELS[difficulty]}</Badge>
        <div className="game-hud-bar"><div className={`game-hud-bar-fill ${lowTime?'low':''}`} style={{width:`${timerPct}%`}}/></div>
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
        {answered&&<div className="game-answer-reveal">
          <div className="game-answer-row">
            {feedback==='correct'?<span className="game-correct"><Check size={16}/>Correct! +{scores[scores.length-1]} pts</span>
             :<span className="game-timeout"><X size={16}/>Time's up! It was: <strong>{answerLabel}</strong></span>}
            <Button className="game-next-btn" onClick={nextQuestion}>{qi+1>=questions.length?'See Results':'Next'}</Button>
          </div>
          {q.fact&&<p className="game-fact">{q.fact}</p>}
        </div>}
      </div>
      {feedback==='wrong'&&!answered&&<div className="game-wrong-flash">Try again ({Math.max(0,3-attempts)} left)</div>}
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
    const today=getTopToday(10),allTime=getTopAllTime(10);
    const list=tab==='today'?today:allTime;
    return <div className="game-overlay glass">
      <div className="game-title"><Trophy size={28}/><h2>Leaderboard</h2></div>
      <div className="game-lb-tabs">
        <Button variant="ghost" className={tab==='today'?'active':''} onClick={()=>setTab('today')}>Top 10 Today</Button>
        <Button variant="ghost" className={tab==='alltime'?'active':''} onClick={()=>setTab('alltime')}>Top 10 All Time</Button>
      </div>
      {list.length===0?<p className="game-lb-empty">No scores yet — be the first!</p>:
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
        <Button className="game-start-btn" onClick={()=>{setSaved(false);setPhase('start');}}><Zap size={16}/>Play Again</Button>
        <Button variant="ghost" className="game-exit-btn" onClick={onExit}>Back to Explorer</Button>
      </div>
    </div>;
  }

  return null;
}
