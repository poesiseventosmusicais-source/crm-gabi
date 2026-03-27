'use client';
import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
import { Sidebar, PageHeader, Card, StatCard, Badge, Button, EmptyState, UrgencyBadge, Modal, C } from '../../components/ui';
import { formatDate, formatCurrency, daysUntil, daysSince, urgencyColor, urgencyLabel, todayISO, getCalendarDays } from '../../lib/helpers';

export default function DashboardPage() {
  const supabase = createClient();
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [custas, setCustas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calView, setCalView] = useState('2weeks');
  const [calModal, setCalModal] = useState(null);
  const [dlModal, setDlModal] = useState(null);

  useEffect(() => { init(); }, []);
  async function init() {
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) { window.location.href='/'; return; }
    await load();
  }
  async function load() {
    setLoading(true);
    const [cl,ca,pr,dl,up,cu] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('cases').select('*'),
      supabase.from('processes').select('*'),
      supabase.from('deadlines').select('*').order('due_date'),
      supabase.from('case_updates').select('*').order('update_date',{ascending:false}).limit(20),
      supabase.from('custas').select('*'),
    ]);
    setClients(cl.data||[]); setCases(ca.data||[]); setProcesses(pr.data||[]);
    setDeadlines(dl.data||[]); setUpdates(up.data||[]); setCustas(cu.data||[]);
    setLoading(false);
  }
  async function handleLogout() { await supabase.auth.signOut(); window.location.href='/'; }
  function nav(tab) { const r={dashboard:'/dashboard',deadlines:'/prazos',processes:'/processos',cases:'/casos',clients:'/clientes',financial:'/financeiro'}; window.location.href=r[tab]; }

  const getEnt = (t,id) => t==='process'?processes.find(p=>p.id===id):cases.find(c=>c.id===id);
  const getCl = (id) => clients.find(c=>c.id===id);
  const pending = deadlines.filter(d=>!d.completed).sort((a,b)=>a.due_date.localeCompare(b.due_date));
  const overdue = pending.filter(d=>daysUntil(d.due_date)<0);
  const urgent = pending.filter(d=>d.urgency==='Urgente');
  const audiencias = pending.filter(d=>d.theme==='Audiência');
  const urgentCount = urgent.length + overdue.filter(d=>d.urgency!=='Urgente').length;

  const allEnts = [...cases.map(c=>({...c,_t:'case'})),...processes.map(p=>({...p,_t:'process'}))];
  const totalFees = allEnts.reduce((s,e)=>s+Number(e.fees||0),0);
  const totalPaid = allEnts.reduce((s,e)=>s+Number(e.fees_paid||0),0);
  const totalCustas = custas.reduce((s,c)=>s+Number(c.value||0),0);

  const calDays = getCalendarDays(calView);
  const dlByDate = {};
  pending.forEach(d=>{ if(!dlByDate[d.due_date]) dlByDate[d.due_date]=[]; dlByDate[d.due_date].push(d); });

  const today = todayISO();

  if (loading) return <div style={{display:'flex'}}><Sidebar activeTab="dashboard" onTabChange={nav} onLogout={handleLogout} urgentCount={0}/><div style={{marginLeft:220,flex:1,padding:'36px 40px',display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div style={{color:C.textLight}}>Carregando...</div></div></div>;

  return (
    <div style={{ display:'flex' }}>
      <Sidebar activeTab="dashboard" onTabChange={nav} onLogout={handleLogout} urgentCount={urgentCount} />
      <div style={{ marginLeft:220, flex:1, padding:'32px 36px', maxWidth:1080 }}>
        <PageHeader title="Painel" subtitle={`${processes.filter(p=>p.status!=='Encerrado').length} processos · ${cases.filter(c=>c.status!=='Encerrado').length} casos ativos`} />

        {/* Overdue alert */}
        {overdue.length>0 && (
          <Card style={{ marginBottom:14, border:`1px solid #e8c4c5`, backgroundColor:C.urgentBg }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.danger, marginBottom:8 }}>⚠ Prazos vencidos ({overdue.length})</div>
            {overdue.slice(0,5).map(d=>{ const ent=getEnt(d.entity_type,d.entity_id); const cl=ent?getCl(ent.client_id):null;
              return <div key={d.id} onClick={()=>setDlModal(d)} style={{fontSize:12,color:'#7a2a2c',marginBottom:4,cursor:'pointer'}}><strong>{cl?.name}</strong> — {d.theme}: {d.description} (venceu {formatDate(d.due_date)})</div>;
            })}
          </Card>
        )}

        {/* Audiências */}
        {audiencias.length>0 && (
          <Card style={{ marginBottom:14, border:'1px solid #c5d5e8', backgroundColor:'#f8fbff' }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.commonText, marginBottom:8 }}>📅 Próximas Audiências ({audiencias.length})</div>
            {audiencias.slice(0,5).map(d=>{ const ent=getEnt(d.entity_type,d.entity_id); const cl=ent?getCl(ent.client_id):null;
              return <div key={d.id} onClick={()=>setDlModal(d)} style={{fontSize:12,color:C.commonText,marginBottom:4,cursor:'pointer'}}><strong>{cl?.name}</strong> — {d.description} · {formatDate(d.due_date)}{d.due_time?` às ${d.due_time}`:''} <UrgencyBadge urgency={d.urgency}/></div>;
            })}
          </Card>
        )}

        {/* Urgent deadlines */}
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:12 }}>Prazos Urgentes</div>
          {urgent.length===0?<div style={{fontSize:13,color:C.textFaint,padding:'12px 0'}}>Nenhum prazo urgente</div>:(
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {urgent.slice(0,8).map(d=>{const days=daysUntil(d.due_date);const ent=getEnt(d.entity_type,d.entity_id);const cl=ent?getCl(ent.client_id):null;
                return <div key={d.id} onClick={()=>setDlModal(d)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderRadius:10,backgroundColor:'#fafaf7',border:`1px solid ${C.borderLight}`,cursor:'pointer'}}>
                  <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{d.theme}: {d.description}</div><div style={{fontSize:11,color:C.textFaint,marginTop:2}}>{cl?.name} · {d.entity_type==='process'?'Processo':'Caso'} · {formatDate(d.due_date)}</div></div>
                  <div style={{display:'flex',gap:6}}><UrgencyBadge urgency={d.urgency}/><Badge color={urgencyColor(days)}>{urgencyLabel(days)}</Badge></div>
                </div>;
              })}
            </div>
          )}
        </Card>

        {/* Calendar */}
        <Card style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, fontFamily:"'Cormorant Garamond',serif" }}>Calendário</div>
            <div style={{display:'flex',gap:4}}>
              {[{id:'week',l:'1 Sem'},{id:'2weeks',l:'2 Sem'},{id:'month',l:'Mês'}].map(v=>(
                <button key={v.id} onClick={()=>setCalView(v.id)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid',fontSize:11,fontWeight:600,fontFamily:'inherit',cursor:'pointer',borderColor:calView===v.id?C.accent:C.border,backgroundColor:calView===v.id?C.accentBg:'transparent',color:calView===v.id?C.accentDark:C.textLight}}>{v.l}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=><div key={d} style={{textAlign:'center',fontSize:10,fontWeight:700,color:C.textLight,textTransform:'uppercase',padding:'4px 0'}}>{d}</div>)}
            {calDays.map(day=>{
              const isToday=day===today; const dayDls=dlByDate[day]||[];
              return <div key={day} onClick={()=>{if(dayDls.length>0) setCalModal({date:day,dls:dayDls});}} style={{padding:'6px 3px',borderRadius:8,textAlign:'center',minHeight:calView==='month'?48:58,backgroundColor:isToday?C.accentBg:dayDls.length>0?'#fafaf7':'transparent',border:isToday?`2px solid ${C.accent}`:`1px solid ${C.borderLight}`,cursor:dayDls.length>0?'pointer':'default'}}>
                <div style={{fontSize:12,fontWeight:isToday?700:500,color:isToday?C.accentDark:C.textMed,marginBottom:2}}>{new Date(day+'T12:00:00').getDate()}</div>
                {dayDls.slice(0,2).map(d=><div key={d.id} style={{fontSize:8,padding:'1px 3px',borderRadius:3,marginBottom:1,backgroundColor:d.urgency==='Urgente'?C.urgentBg:C.accentBg,color:d.urgency==='Urgente'?C.urgentText:C.accentDark,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.theme}</div>)}
                {dayDls.length>2&&<div style={{fontSize:8,color:C.textLight}}>+{dayDls.length-2}</div>}
              </div>;
            })}
          </div>
        </Card>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          <StatCard label="Honorários" value={formatCurrency(totalFees)} />
          <StatCard label="Recebido" value={formatCurrency(totalPaid)} color={C.success} />
          <StatCard label="A Receber" value={formatCurrency(totalFees-totalPaid)} color={totalFees-totalPaid>0?C.warning:C.success} />
          <StatCard label="Custas" value={formatCurrency(totalCustas)} color={C.danger} />
        </div>

        {/* Calendar day modal */}
        {calModal && (
          <Modal title={`Prazos — ${formatDate(calModal.date)}`} onClose={()=>setCalModal(null)} width={500}>
            {calModal.dls.map(d=>{const ent=getEnt(d.entity_type,d.entity_id);const cl=ent?getCl(ent.client_id):null;
              return <div key={d.id} onClick={()=>{setCalModal(null);setDlModal(d);}} style={{padding:'12px 14px',borderRadius:10,backgroundColor:'#fafaf7',border:`1px solid ${C.borderLight}`,marginBottom:8,cursor:'pointer'}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{d.description}</span><Badge color="gray">{d.theme}</Badge><UrgencyBadge urgency={d.urgency}/></div>
                <div style={{fontSize:12,color:C.textLight}}>{cl?.name} · {d.entity_type==='process'?'Processo':'Caso'}</div>
              </div>;
            })}
          </Modal>
        )}

        {/* Deadline detail modal */}
        {dlModal && (
          <Modal title="Detalhe do Prazo" onClose={()=>setDlModal(null)} width={500}>
            {(()=>{const d=dlModal;const ent=getEnt(d.entity_type,d.entity_id);const cl=ent?getCl(ent.client_id):null;
              return <>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}><Badge color="gray">{d.theme}</Badge><UrgencyBadge urgency={d.urgency}/><Badge color={d.entity_type==='process'?'blue':'olive'}>{d.entity_type==='process'?'Processo':'Caso'}</Badge>{d.completed&&<Badge color="green">Concluído</Badge>}</div>
                <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:8}}>{d.description}</div>
                <div style={{fontSize:13,color:C.textMed,marginBottom:4}}>📅 {formatDate(d.due_date)}{d.due_time?` às ${d.due_time}`:''}</div>
                {cl&&<div style={{fontSize:13,color:C.textMed,marginBottom:4}}>👤 {cl.name}</div>}
                {ent&&<div style={{fontSize:13,color:C.textMed,marginBottom:16}}>📋 {ent.type}{ent.process_number?` · ${ent.process_number}`:''}</div>}
                <div style={{display:'flex',gap:10}}>
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
