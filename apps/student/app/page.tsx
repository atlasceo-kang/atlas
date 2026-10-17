'use client';

import { useEffect, useMemo, useState } from 'react';

type Task = { id: number; title: string; done: boolean; date: string };
type Assignment = { id: number; title: string; subject: string; className: string; date: string; done: boolean };
const ASSIGNMENTS_KEY = 'atlas-assignments-v04';
const STORAGE_KEY = 'atlas-planner-v03';
const OLD_KEY = 'atlas-planner-v02';
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const parseDay = (key: string) => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d); };
const percent = (items: Task[]) => items.length ? Math.round(items.filter(t => t.done).length / items.length * 100) : 0;
const valid = (item: unknown): item is Task => {
  if (!item || typeof item !== 'object') return false;
  const t = item as Partial<Task>;
  return typeof t.id === 'number' && Number.isFinite(t.id) && typeof t.title === 'string' && typeof t.done === 'boolean' && typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date);
};

export default function Home() {
  const [today] = useState(() => dateKey(new Date()));
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [view, setView] = useState<'student'|'teacher'>('student');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentSubject, setAssignmentSubject] = useState('수학');
  const [assignmentClass, setAssignmentClass] = useState('고3 A반');
  const [assignmentDate, setAssignmentDate] = useState(() => dateKey(new Date()));
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(),d.getMonth(),1); });

  useEffect(() => {
    try {
      const storedAssignments = localStorage.getItem(ASSIGNMENTS_KEY);
      if (storedAssignments !== null) {
        const parsed: unknown = JSON.parse(storedAssignments);
        if (Array.isArray(parsed) && parsed.every((a: unknown) => {
          if (!a || typeof a !== 'object') return false;
          const x = a as Partial<Assignment>;
          return typeof x.id === 'number' && typeof x.title === 'string' && typeof x.subject === 'string' && typeof x.className === 'string' && typeof x.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && typeof x.done === 'boolean';
        })) setAssignments(parsed);
        else setMessage('강사 과제 데이터 형식을 확인해주세요. 기존 데이터는 유지됩니다.');
      }
      const current = localStorage.getItem(STORAGE_KEY);
      if (current !== null) {
        const parsed: unknown = JSON.parse(current);
        if (Array.isArray(parsed) && parsed.every(valid)) setTasks(parsed);
        else setMessage('저장된 데이터 형식을 확인해주세요. 기존 데이터는 변경하지 않았습니다.');
      } else {
        const old = localStorage.getItem(OLD_KEY);
        if (old !== null) {
          const parsed: unknown = JSON.parse(old);
          if (Array.isArray(parsed) && parsed.every(t => t && typeof t === 'object' && typeof t.id === 'number' && typeof t.title === 'string' && typeof t.done === 'boolean')) {
            setTasks(parsed.map(t => ({...t, date: dateKey(new Date())})));
            setMessage('v0.2의 할 일을 오늘 날짜로 가져왔습니다.');
          } else setMessage('이전 기록을 읽지 못했습니다. 기존 저장 데이터는 유지됩니다.');
        } else setTasks([
          {id:1,title:'수학 오답노트 정리',done:false,date:dateKey(new Date())},
          {id:2,title:'영어 단어 30개 암기',done:true,date:dateKey(new Date())},
          {id:3,title:'국어 독서 지문 분석',done:false,date:dateKey(new Date())},
        ]);
      }
    } catch { setMessage('저장된 기록을 읽지 못했습니다. 브라우저 저장소를 확인해주세요.'); }
    finally { setReady(true); }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
    catch { setMessage('저장에 실패했습니다. 브라우저 저장 공간을 확인해주세요.'); }
  }, [tasks, ready]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments)); }
    catch { setMessage('강사 과제 저장에 실패했습니다.'); }
  }, [assignments, ready]);

  const dayTasks = useMemo(() => tasks.filter(t => t.date === selected), [tasks, selected]);
  const dayAssignments = useMemo(() => assignments.filter(a => a.date === selected), [assignments, selected]);
  const allDay = useMemo(() => [...dayTasks, ...dayAssignments], [dayTasks, dayAssignments]);
  const weekTasks = useMemo(() => { const d = parseDay(selected); const weekday = (d.getDay()+6)%7; const start = new Date(d.getFullYear(),d.getMonth(),d.getDate()-weekday); const end = new Date(start.getFullYear(),start.getMonth(),start.getDate()+7); return [...tasks, ...assignments].filter(t => {const day = parseDay(t.date); return day >= start && day < end;}); }, [tasks, assignments, selected]);
  const monthTasks = useMemo(() => [...tasks, ...assignments].filter(t => t.date.startsWith(selected.slice(0,7))), [tasks, assignments, selected]);
  const first = new Date(month.getFullYear(),month.getMonth(),1);
  const offset = first.getDay();
  const count = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const cells = Array.from({length: Math.ceil((offset+count)/7)*7}, (_,i) => i-offset+1);
  const displayDate = parseDay(selected).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  const btn = {border:'1px solid #cbd5e1',background:'white',borderRadius:9,padding:'8px 12px',cursor:'pointer'} as const;

  return <main style={{maxWidth:980,margin:'0 auto',padding:'32px 16px',color:'#0f172a'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><h1 style={{color:'#2563eb',margin:'0 0 22px'}}>ATLAS <small style={{fontSize:13,color:'#64748b'}}>v0.4</small></h1><span>Student Growth OS</span></header>
    <section style={{background:'white',padding:'clamp(16px,4vw,30px)',borderRadius:18,boxShadow:'0 8px 30px #0f172a0c'}}>
      <nav aria-label="화면 전환" style={{display:'flex',gap:8,marginBottom:20}}><button style={{...btn,background:view==='student'?'#dbeafe':'white'}} onClick={()=>setView('student')}>학생 플래너</button><button style={{...btn,background:view==='teacher'?'#dbeafe':'white'}} onClick={()=>setView('teacher')}>강사 과제 관리</button></nav>
      {view === 'teacher' ? <div>
        <h2>강사 과제 관리</h2><p style={{color:'#64748b'}}>강사 화면에서 과제를 등록하면 이 브라우저의 학생 플래너에 자동으로 나타납니다.</p>
        <form onSubmit={e=>{e.preventDefault();const title=assignmentTitle.trim();if(!title)return;setAssignments(prev=>[...prev,{id:Math.max(Date.now(),...prev.map(a=>a.id+1),0),title,subject:assignmentSubject,className:assignmentClass,date:assignmentDate,done:false}]);setAssignmentTitle('');}} style={{display:'grid',gap:10,margin:'18px 0'}}>
          <input required maxLength={200} aria-label="과제명" placeholder="과제명 (예: 수학 기출 20문제)" value={assignmentTitle} onChange={e=>setAssignmentTitle(e.target.value)} style={{...btn,width:'100%',boxSizing:'border-box'}}/>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><label>과목 <select value={assignmentSubject} onChange={e=>setAssignmentSubject(e.target.value)} style={btn}>{['국어','수학','영어','탐구','기타'].map(x=><option key={x}>{x}</option>)}</select></label><label>대상 반 <input value={assignmentClass} maxLength={50} onChange={e=>setAssignmentClass(e.target.value)} style={btn}/></label><label>마감일 <input type="date" required value={assignmentDate} onChange={e=>setAssignmentDate(e.target.value)} style={btn}/></label></div>
          <button style={{...btn,background:'#2563eb',color:'white',justifySelf:'start'}}>과제 등록</button>
        </form>
        <h3>등록된 과제 ({assignments.length}개)</h3>
        {assignments.length===0 && <p style={{color:'#64748b'}}>아직 등록된 과제가 없습니다.</p>}
        {assignments.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(a=><div key={a.id} style={{padding:'12px 0',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><div><strong>{a.title}</strong><div style={{fontSize:12,color:'#64748b'}}>{a.subject} · {a.className} · {a.date} · {a.done?'완료':'미완료'}</div></div><button style={btn} onClick={()=>{if(window.confirm('이 과제를 삭제할까요?'))setAssignments(prev=>prev.filter(x=>x.id!==a.id));}}>삭제</button></div>)}
        <p style={{fontSize:12,color:'#64748b',marginTop:20}}>데모: 대상 반은 표시용이며 실제 학생별 배정·권한·다중 기기 공유 기능은 아직 없습니다.</p>
      </div> : <><p style={{color:'#64748b'}}>학생의 성장을 관리합니다.</p><h2>오늘도 한 걸음 성장해볼까요?</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10,margin:'22px 0'}}>
        {[['선택한 날',allDay],['선택한 주',weekTasks],['선택한 달',monthTasks]].map(([label,items]) => <div key={label as string} style={{background:'#f1f5f9',borderRadius:12,padding:14}}><div style={{fontSize:12,color:'#64748b'}}>{label as string} 성취율</div><strong style={{fontSize:24}}>{percent(items as Task[])}%</strong><div style={{fontSize:12,color:'#64748b'}}>{(items as Task[]).filter(t=>t.done).length}/{(items as Task[]).length}개 완료</div></div>)}
      </div>
      <div style={{height:12,background:'#e2e8f0',borderRadius:10,overflow:'hidden',marginBottom:24}}><div style={{height:'100%',width:`${percent(allDay)}%`,background:'#22c55e',transition:'width .2s'}}/></div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><h3 style={{margin:0}}>학습 캘린더</h3><div style={{display:'flex',alignItems:'center',gap:8}}><button style={btn} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} aria-label="이전 달">‹</button><strong>{month.getFullYear()}년 {month.getMonth()+1}월</strong><button style={btn} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} aria-label="다음 달">›</button><button style={btn} onClick={()=>{setSelected(today);const d=parseDay(today);setMonth(new Date(d.getFullYear(),d.getMonth(),1));}}>오늘</button></div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:5,marginTop:14}}>
        {['일','월','화','수','목','금','토'].map(day=><div key={day} style={{textAlign:'center',fontSize:12,color:'#64748b',padding:6}}>{day}</div>)}
        {cells.map((n,i)=>{if(n<1||n>count)return <div key={`blank-${i}`}/>;const key=dateKey(new Date(month.getFullYear(),month.getMonth(),n));const items=[...tasks,...assignments].filter(t=>t.date===key);const active=key===selected;return <button key={key} onClick={()=>setSelected(key)} aria-label={`${n}일 선택`} aria-pressed={active} style={{border:active?'2px solid #2563eb':'1px solid #e2e8f0',background:active?'#eff6ff':'white',borderRadius:10,minHeight:59,cursor:'pointer',color:'#0f172a',padding:4}}><div style={{fontWeight:active?700:400}}>{n}</div><div style={{fontSize:10,color:items.length?'#16a34a':'#94a3b8'}}>{items.length?`${percent(items)}%`:'·'}</div></button>})}
      </div>
      <h3 style={{marginTop:30}}>Growth Planner</h3><p style={{color:'#64748b',fontSize:14}}>{displayDate} · {allDay.length}개 할 일</p>
      {allDay.length===0 && <p style={{color:'#64748b'}}>이 날짜에 등록된 할 일이 없습니다.</p>}
      {dayTasks.map(t=><label key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 0',borderBottom:'1px solid #e2e8f0'}}><input type="checkbox" checked={t.done} onChange={()=>setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:!x.done}:x))}/><span style={{flex:1,textDecoration:t.done?'line-through':'none',overflowWrap:'anywhere'}}>{t.title}</span><button aria-label={`${t.title} 삭제`} style={{...btn,padding:'5px 9px',color:'#64748b'}} onClick={()=>setTasks(prev=>prev.filter(x=>x.id!==t.id))} type="button">삭제</button></label>)}
      {dayAssignments.map(a=><label key={`assignment-${a.id}`} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 0',borderBottom:'1px solid #e2e8f0'}}><input type="checkbox" checked={a.done} onChange={()=>setAssignments(prev=>prev.map(x=>x.id===a.id?{...x,done:!x.done}:x))}/><span style={{flex:1,textDecoration:a.done?'line-through':'none'}}><strong>[강사 과제 · {a.subject}]</strong> {a.title}<span style={{fontSize:12,color:'#64748b'}}> · {a.className}</span></span></label>)}
      <form onSubmit={e=>{e.preventDefault();const title=input.trim();if(!title)return;setTasks(prev=>[...prev,{id:Math.max(Date.now(),...prev.map(t=>t.id+1),0),title,done:false,date:selected}]);setInput('');}} style={{display:'flex',gap:8,marginTop:22}}><input aria-label="새 할 일" value={input} maxLength={200} onChange={e=>setInput(e.target.value)} placeholder="선택한 날짜에 할 일 추가" style={{flex:1,padding:12,border:'1px solid #cbd5e1',borderRadius:8,minWidth:0}}/><button style={{background:'#2563eb',color:'white',border:0,borderRadius:8,padding:'0 20px',cursor:'pointer'}}>추가</button></form>
      {message && <p role="status" style={{color:'#92400e',fontSize:13}}>{message}</p>}
      <p style={{fontSize:12,color:'#64748b',marginTop:22}}>기록은 현재 브라우저에만 저장됩니다. 기존 v0.3 학습 기록은 유지합니다. 강사와 학생 화면은 같은 브라우저에서만 데이터를 공유합니다.</p></>}
    </section>
  </main>;
}
