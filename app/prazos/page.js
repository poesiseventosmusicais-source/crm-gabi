'use client';
import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
import { Sidebar, PageHeader, Card, Badge, Button, EmptyState, UrgencyBadge, Modal, C } from '../../components/ui';
import { formatDate, daysUntil, urgencyColor, urgencyLabel, todayISO } from '../../lib/helpers';

export default function PrazosPage() {
  const supabase = createClient();
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [dlModal, setDlModal] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => { init(); }, []);
  async function init() {
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { window.location.href='/'; return; }
    setUserId(user.id); await load();
  }
  async function load() {
    setLoading(true);
    const [cl,ca,pr,dl] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('cases').select('*'),
      supabase.from('processes').select('*'),
      supabase.from('deadlines').select('*').order('due_date'),
    ]);
    setClients(cl.data||[]); setCases(ca.data||[]); setProcesses(pr.data||[]); setDeadlines(dl.data||[]);
    setLoading(false);
  }
  async function toggleDl(id) {
    const dl = deadlines.find(d=>d.id===id); if (!dl) return;
    const completed = !dl.completed;
    await supabase.from('deadlines').update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', id);
    if (completed) {
      await supabase.from('case_updates').insert({ user_id: userId, entity_type: dl.entity_type, entity_id: dl.entity_id, description: `✅ Prazo concluído: ${dl.theme} — ${dl.description}`, update_date: todayISO(), auto_generated: true });
    }
    await load();
  }
  async function handleLogout() { await supabase.auth.signOut(); window.location.href='/'; }
  function nav(tab) { const r={dashboard:'/dashboard',deadlines:'/prazos',processes:'/processos',cases:'/casos',clients:'/clientes',financial:'/financeiro'}; window.location.href=r[tab]; }
  const getEnt = (t,id) => t==='process'?processes.find(p=>p.id===id):cases.find(c=>c.id===id);
  const getCl = (id) => clients.find(c=>c.id===id);

  const pending = deadlines.filter(d=>!d.completed).sort((a,b)=>a.due_date.localeCompare(b.due_date));
  const completed = deadlines.filter(d=>d.completed);
  const urgent = pending.filter(d=>d.urgency==='Urgente');
  const overdue = pending.filter(d=>daysUntil(d.due_date)<0);
  const urgentCount = urgent.length + overdue.filter(d=>d.urgency!=='Urgente').length;
  const list = filter==='pending'?pending:filter==='completed'?completed:[...pending,...completed];

  return (
    <div style={{display:'flex'}}>
      <Sidebar activeTab="deadlines" onTabChange={nav} onLogout={handleLogout} urgentCount={urgentCount} />
      <div style={{marginLeft:220,flex:1,padding:'32px 36px',maxWidth:1080}}>
        <PageHeader title="Prazos" subtitle={`${pending.length} pendente${pending.length!==1?'s':''} · ${urgent.length} urgente${urgent.length!==1?'s':''}`} />
        <div style={{display:'flex',gap:8,marginBottom:24}}>
          {[{id:'pending',l:'Pendentes'},{id:'completed',l:'Concluídos'},{id:'all',l:'Todos'}].map(f=>(
            <button key={f.id} onClick={()=>setFilter(f.id)} style={{padding:'8px 18px',borderRadius:8,border:'1px solid',fontSize:13,fontWeight:600,fontFamily:'inherit',cursor:'pointer',borderColor:filter===f.id?C.accent:C.border,backgroundColor:filter===f.id?C.accentBg:'#fff',color:filter===f.id?C.accentDark:C.textLight}}>{f.l}</button>
          ))}
        </div>
        {loading?<div style={{color:C.textLight,padding:40,textAlign:'center'}}>Carregando...</div>
        :list.length===0?<EmptyState icon="◷" title="Nenhum prazo encontrado" />
        :list.map(d=>{
          const days=daysUntil(d.due_date); const ent=getEnt(d.entity_type,d.entity_id); const cl=ent?getCl(ent.client_id):null;
          return (
            <Card key={d.id} style={{padding:'14px 18px',marginBottom:8,opacity:d.completed?0.6:1}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <input type="checkbox" checked={d.completed} onChange={()=>toggleDl(d.id)} style={{cursor:'pointer',width:18,height:18,flexShrink:0,accentColor:C.accent}} />
                <div style={{flex:1,cursor:'pointer'}} onClick={()=>setDlModal(d)}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3}}>
                    <span style={{fontSize:14,fontWeight:600,color:C.text,textDecoration:d.completed?'line-through':'none'}}>{d.description}</span>
                    <Badge color="gray">{d.theme}</Badge>
                    <UrgencyBadge urgency={d.urgency} />
                  </div>
                  <div style={{fontSize:12,color:C.textLight,display:'flex',gap:12}}>
                    {cl&&<span>{cl.name}</span>}
                    <span>{d.entity_type==='process'?'Processo':'Caso'}</span>
                    <span>{formatDate(d.due_date)}{d.due_time?` ${d.due_time}`:''}</span>
                  </div>
                </div>
                {!d.completed&&<Badge color={urgencyColor(days)}>{urgencyLabel(days)}</Badge>}
              </div>
            </Card>
          );
        })}
        {dlModal&&(
          <Modal title="Detalhe do Prazo" onClose={()=>setDlModal(null)} width={500}>
            {(()=>{const d=dlModal;const ent=getEnt(d.entity_type,d.entity_id);const cl=ent?getCl(ent.client_id):null;
              return <>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}><Badge color="gray">{d.theme}</Badge><UrgencyBadge urgency={d.urgency}/><Badge color={d.entity_type==='process'?'blue':'olive'}>{d.entity_type==='process'?'Processo':'Caso'}</Badge></div>
                <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:8}}>{d.description}</div>
                <div style={{fontSize:13,color:C.textMed,marginBottom:4}}>📅 {formatDate(d.due_date)}{d.due_time?` às ${d.due_time}`:''}</div>
                {cl&&<div style={{fontSize:13,color:C.textMed,marginBottom:16}}>👤 {cl.name}</div>}
                <div style={{display:'flex',gap:10}}>
                  <Button onClick={()=>{toggleDl(d.id);setDlModal(null);}}>{d.completed?'Reabrir':'Concluir'}</Button>
                  <Button variant="secondary" onClick={()=>{setDlModal(null);window.location.href=d.entity_type==='process'?'/processos':'/casos';}}>Ver {d.entity_type==='process'?'Processos':'Casos'}</Button>
                </div>
              </>;
            })()}
          </Modal>
        )}
      </div>
    </div>
  );
}
