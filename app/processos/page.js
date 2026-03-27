'use client';
import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
import { Sidebar, PageHeader, Card, Badge, Button, Modal, Input, Select, ThemeSelector, EmptyState, ConfirmDialog, UrgencyBadge, WhatsAppBtn, C } from '../../components/ui';
import { CASE_TYPES, STATUS_LIST, PAYMENT_STATUS, PROCESS_SYSTEMS, PROCESS_DEADLINE_THEMES, URGENCY, formatDate, formatCurrency, daysUntil, urgencyColor, urgencyLabel, statusColor, paymentColor, todayISO } from '../../lib/helpers';

export default function ProcessosPage() {
  const supabase = createClient();
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [custasData, setCustasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(()=>{init();},[]);
  async function init() { const{data:{user}}=await supabase.auth.getUser(); if(!user){window.location.href='/';return;} setUserId(user.id); await load(); }
  async function load() {
    setLoading(true);
    const [cl,ca,pr,dl,up,cu] = await Promise.all([
      supabase.from('clients').select('*'),supabase.from('cases').select('*'),supabase.from('processes').select('*').order('created_at',{ascending:false}),
      supabase.from('deadlines').select('*').order('due_date'),supabase.from('case_updates').select('*').order('update_date',{ascending:false}),supabase.from('custas').select('*'),
    ]);
    setClients(cl.data||[]);setCases(ca.data||[]);setProcesses(pr.data||[]);setDeadlines(dl.data||[]);setUpdates(up.data||[]);setCustasData(cu.data||[]);
    setLoading(false);
  }
  async function saveProcess(form) {
    const data={client_id:form.client_id,type:form.type,process_number:form.process_number,court:form.court,opposing_party:form.opposing_party,opposing_lawyer:form.opposing_lawyer,system:form.system,status:form.status,fees:Number(form.fees)||0,fees_paid:Number(form.fees_paid)||0,payment_status:form.payment_status,notes:form.notes,linked_case_id:form.linked_case_id||null};
    if(form.id) await supabase.from('processes').update(data).eq('id',form.id);
    else await supabase.from('processes').insert({...data,user_id:userId});
    setModal(null); await load();
  }
  async function deleteProcess(id) { await supabase.from('processes').delete().eq('id',id); setConfirm(null);setDetail(null); await load(); }
  async function addDl(data) { await supabase.from('deadlines').insert({...data,user_id:userId}); await load(); }
  async function toggleDl(id) {
    const dl=deadlines.find(d=>d.id===id); if(!dl) return;
    const completed=!dl.completed;
    await supabase.from('deadlines').update({completed,completed_at:completed?new Date().toISOString():null}).eq('id',id);
    if(completed) await supabase.from('case_updates').insert({user_id:userId,entity_type:'process',entity_id:dl.entity_id,description:`✅ Prazo concluído: ${dl.theme} — ${dl.description}`,update_date:todayISO(),auto_generated:true});
    await load();
  }
  async function addUpdate(entId,text) { await supabase.from('case_updates').insert({user_id:userId,entity_type:'process',entity_id:entId,description:text,update_date:todayISO(),auto_generated:false}); await load(); }
  async function addCusta(data) { await supabase.from('custas').insert({...data,user_id:userId}); await load(); }
  async function handleLogout(){await supabase.auth.signOut();window.location.href='/';}
  function nav(tab){const r={dashboard:'/dashboard',deadlines:'/prazos',processes:'/processos',cases:'/casos',clients:'/clientes',financial:'/financeiro'};window.location.href=r[tab];}
  const getCl=(id)=>clients.find(c=>c.id===id);
  const urgentCount=deadlines.filter(d=>!d.completed&&(d.urgency==='Urgente'||daysUntil(d.due_date)<0)).length;

  const filtered=processes.filter(p=>{const cl=getCl(p.client_id);return !search||cl?.name?.toLowerCase().includes(search.toLowerCase())||(p.process_number||'').includes(search)||(p.type||'').toLowerCase().includes(search.toLowerCase());});

  return (
    <div style={{display:'flex'}}>
      <Sidebar activeTab="processes" onTabChange={nav} onLogout={handleLogout} urgentCount={urgentCount}/>
      <div style={{marginLeft:220,flex:1,padding:'32px 36px',maxWidth:1080}}>
        <PageHeader title="Processos" subtitle={`${processes.filter(p=>p.status!=='Encerrado').length} ativo${processes.filter(p=>p.status!=='Encerrado').length!==1?'s':''}`}
          action={<Button onClick={()=>setModal({type:'new'})}>+ Novo Processo</Button>}/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por cliente, processo, tipo..."
          style={{width:'100%',maxWidth:400,padding:'10px 16px',borderRadius:10,border:`1px solid ${C.border}`,backgroundColor:'#fff',fontSize:13,fontFamily:'inherit',marginBottom:20}}/>

        {loading?<div style={{color:C.textLight,padding:40,textAlign:'center'}}>Carregando...</div>
        :filtered.length===0?<EmptyState icon="⚖" title="Nenhum processo" action={<Button onClick={()=>setModal({type:'new'})}>+ Novo Processo</Button>}/>
        :<div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map(p=>{const cl=getCl(p.client_id);const pDls=deadlines.filter(d=>d.entity_type==='process'&&d.entity_id===p.id&&!d.completed);const urgDls=pDls.filter(d=>d.urgency==='Urgente');
            return <Card key={p.id} onClick={()=>setDetail(p)} style={{cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:4}}>{cl?.name||'—'} — {p.type}{p.linked_case_id?<Badge color="olive" style={{marginLeft:8,fontSize:10}}>Vinculado</Badge>:null}</div>
                  <div style={{fontSize:12,color:C.textLight,display:'flex',gap:14,flexWrap:'wrap'}}>
                    {p.process_number&&<span>Proc: {p.process_number}</span>}{p.system&&<span>{p.system}</span>}{p.court&&<span>{p.court}</span>}{p.opposing_party&&<span>vs. {p.opposing_party}</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  {cl?.phone&&<WhatsAppBtn phone={cl.phone}/>}{urgDls.length>0&&<Badge color="urgent">{urgDls.length} urg.</Badge>}{pDls.length>0&&<Badge color="gray">{pDls.length} prazo{pDls.length!==1?'s':''}</Badge>}<Badge color={statusColor(p.status)}>{p.status}</Badge>
                </div>
              </div>
            </Card>;
          })}
        </div>}

        {modal&&<ProcessForm initial={modal.data} clients={clients} onSave={saveProcess} onClose={()=>setModal(null)}/>}
        {detail&&<ProcessDetail proc={detail} client={getCl(detail.client_id)} deadlines={deadlines.filter(d=>d.entity_type==='process'&&d.entity_id===detail.id)} updates={updates.filter(u=>u.entity_type==='process'&&u.entity_id===detail.id)} custas={custasData.filter(c=>c.entity_type==='process'&&c.entity_id===detail.id)} linkedCase={detail.linked_case_id?cases.find(c=>c.id===detail.linked_case_id):null} onEdit={()=>{setModal({type:'edit',data:detail});setDetail(null);}} onDelete={()=>{setConfirm(detail);setDetail(null);}} onAddDl={addDl} onToggleDl={toggleDl} onAddUpdate={addUpdate} onAddCusta={addCusta} onClose={()=>setDetail(null)} onViewLinked={()=>{setDetail(null);window.location.href='/casos';}}/>}
        {confirm&&<ConfirmDialog title="Excluir processo" message="Tem certeza? Prazos e atualizações serão removidos." danger onConfirm={()=>deleteProcess(confirm.id)} onCancel={()=>setConfirm(null)}/>}
      </div>
    </div>
  );
}

function ProcessForm({initial,clients,onSave,onClose}) {
  const d=initial||{};
  const [f,sF]=useState({client_id:'',type:'Divórcio',process_number:'',court:'',opposing_party:'',opposing_lawyer:'',system:'SAJ',status:'Em andamento',fees:0,fees_paid:0,payment_status:'Pendente',notes:'',linked_case_id:'',...d});
  const s=(k,v)=>sF({...f,[k]:v});
  return <Modal title={d.id?'Editar Processo':'Novo Processo'} onClose={onClose} width={620}>
    <Select label="Cliente" value={f.client_id} onChange={v=>s('client_id',v)} options={clients.map(c=>({value:c.id,label:c.name}))} required/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
      <Select label="Tipo" value={f.type} onChange={v=>s('type',v)} options={CASE_TYPES} required/>
      <Select label="Sistema" value={f.system} onChange={v=>s('system',v)} options={PROCESS_SYSTEMS} required/>
      <Select label="Status" value={f.status} onChange={v=>s('status',v)} options={STATUS_LIST}/>
    </div>
    <Input label="Nº do Processo" value={f.process_number} onChange={v=>s('process_number',v)}/>
    <Input label="Vara / Comarca" value={f.court} onChange={v=>s('court',v)}/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Input label="Parte Contrária" value={f.opposing_party} onChange={v=>s('opposing_party',v)}/>
      <Input label="Advogado Contrário" value={f.opposing_lawyer} onChange={v=>s('opposing_lawyer',v)}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
      <Input label="Honorários (R$)" value={f.fees} onChange={v=>s('fees',v)} type="number"/>
      <Input label="Recebido (R$)" value={f.fees_paid} onChange={v=>s('fees_paid',v)} type="number"/>
      <Select label="Pagamento" value={f.payment_status} onChange={v=>s('payment_status',v)} options={PAYMENT_STATUS}/>
    </div>
    <Input label="Observações" value={f.notes} onChange={v=>s('notes',v)} textarea/>
    <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
      <Button variant="secondary" onClick={onClose}>Cancelar</Button>
      <Button onClick={()=>{if(f.client_id&&f.type) onSave(f);}} disabled={!f.client_id}>Salvar</Button>
    </div>
  </Modal>;
}

function ProcessDetail({proc,client,deadlines:dls,updates:ups,custas:cus,linkedCase,onEdit,onDelete,onAddDl,onToggleDl,onAddUpdate,onAddCusta,onClose,onViewLinked}) {
  const [newDl,setNewDl]=useState({theme:'',description:'',due_date:'',due_time:'',urgency:'Comum'});
  const [showDl,setShowDl]=useState(false);
  const [newUp,setNewUp]=useState('');
  const [newCu,setNewCu]=useState({description:'',value:'',custa_date:todayISO()});
  const [showCu,setShowCu]=useState(false);
  const totalCu=cus.reduce((s,c)=>s+Number(c.value||0),0);

  return <Modal title={`${client?.name||'—'} — ${proc.type}`} onClose={onClose} width={720}>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
      <Badge color={statusColor(proc.status)}>{proc.status}</Badge>
      <Badge color={paymentColor(proc.payment_status)}>{proc.payment_status}</Badge>
      {proc.system&&<Badge color="olive">{proc.system}</Badge>}
      {proc.process_number&&<Badge color="gray">Proc: {proc.process_number}</Badge>}
      {client?.phone&&<WhatsAppBtn phone={client.phone}/>}
      {linkedCase&&<Badge color="olive" onClick={onViewLinked} style={{cursor:'pointer'}}>🔗 Ver Caso</Badge>}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,marginBottom:20,padding:'12px 14px',backgroundColor:'#fafaf7',borderRadius:10}}>
      <div><div style={{fontSize:10,color:C.textLight,textTransform:'uppercase',marginBottom:3}}>Honorários</div><div style={{fontSize:15,fontWeight:700}}>{formatCurrency(proc.fees)}</div></div>
      <div><div style={{fontSize:10,color:C.textLight,textTransform:'uppercase',marginBottom:3}}>Recebido</div><div style={{fontSize:15,fontWeight:700,color:C.success}}>{formatCurrency(proc.fees_paid)}</div></div>
      <div><div style={{fontSize:10,color:C.textLight,textTransform:'uppercase',marginBottom:3}}>Pendente</div><div style={{fontSize:15,fontWeight:700,color:C.warning}}>{formatCurrency(proc.fees-proc.fees_paid)}</div></div>
      <div><div style={{fontSize:10,color:C.textLight,textTransform:'uppercase',marginBottom:3}}>Custas</div><div style={{fontSize:15,fontWeight:700,color:C.danger}}>{formatCurrency(totalCu)}</div></div>
    </div>
    {(proc.court||proc.opposing_party||proc.opposing_lawyer)&&<div style={{fontSize:13,color:C.textMed,marginBottom:16,padding:'10px 14px',backgroundColor:'#fafaf7',borderRadius:10}}>{proc.court&&<div>📍 {proc.court}</div>}{proc.opposing_party&&<div>⚔ vs. {proc.opposing_party}</div>}{proc.opposing_lawyer&&<div>👔 Adv.: {proc.opposing_lawyer}</div>}</div>}
    {proc.notes&&<div style={{fontSize:13,color:C.textMed,marginBottom:16,padding:'10px 14px',backgroundColor:'#fafaf7',borderRadius:10}}>{proc.notes}</div>}

    {/* Prazos */}
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div style={{fontSize:14,fontWeight:700,color:C.text}}>Prazos</div>
        <Button variant="secondary" size="sm" onClick={()=>setShowDl(!showDl)}>{showDl?'Cancelar':'+ Prazo'}</Button>
      </div>
      {showDl&&<div style={{padding:14,backgroundColor:'#fafaf7',borderRadius:10,marginBottom:12,border:`1px solid ${C.borderLight}`}}>
        <ThemeSelector themes={PROCESS_DEADLINE_THEMES} selected={newDl.theme} onSelect={t=>setNewDl({...newDl,theme:t})}/>
        <Input label="Descrição" value={newDl.description} onChange={v=>setNewDl({...newDl,description:v})}/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          <Input label="Data" value={newDl.due_date} onChange={v=>setNewDl({...newDl,due_date:v})} type="date"/>
          {newDl.theme==='Audiência'&&<Input label="Horário" value={newDl.due_time} onChange={v=>setNewDl({...newDl,due_time:v})} type="time"/>}
          <Select label="Urgência" value={newDl.urgency} onChange={v=>setNewDl({...newDl,urgency:v})} options={URGENCY}/>
        </div>
        <Button size="sm" onClick={()=>{if(newDl.theme&&newDl.description&&newDl.due_date){onAddDl({entity_type:'process',entity_id:proc.id,...newDl});setNewDl({theme:'',description:'',due_date:'',due_time:'',urgency:'Comum'});setShowDl(false);}}} disabled={!newDl.theme||!newDl.description||!newDl.due_date}>Salvar</Button>
      </div>}
      {dls.length===0?<div style={{fontSize:12,color:C.textFaint}}>Nenhum prazo</div>:
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {dls.sort((a,b)=>a.due_date.localeCompare(b.due_date)).map(d=><div key={d.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:8,backgroundColor:d.completed?'#fafaf7':'#fff',border:`1px solid ${d.urgency==='Urgente'&&!d.completed?'#e8c4c5':C.borderLight}`,opacity:d.completed?0.5:1}}>
            <input type="checkbox" checked={d.completed} onChange={()=>onToggleDl(d.id)} style={{cursor:'pointer',width:16,height:16,accentColor:C.accent}}/>
            <div style={{flex:1}}><div style={{display:'flex',gap:6,alignItems:'center'}}><span style={{fontSize:13,color:C.text,textDecoration:d.completed?'line-through':'none',fontWeight:d.urgency==='Urgente'?600:400}}>{d.description}</span><Badge color="gray" style={{fontSize:9}}>{d.theme}</Badge><UrgencyBadge urgency={d.urgency}/></div></div>
            <span style={{fontSize:11,color:C.textLight}}>{formatDate(d.due_date)}{d.due_time?` ${d.due_time}`:''}</span>
          </div>)}
        </div>}
    </div>

    {/* Custas */}
    <div style={{marginBottom:20}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div style={{fontSize:14,fontWeight:700,color:C.text}}>Custas</div>
        <Button variant="secondary" size="sm" onClick={()=>setShowCu(!showCu)}>{showCu?'Cancelar':'+ Custa'}</Button>
      </div>
      {showCu&&<div style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-end'}}>
        <Input label="Descrição" value={newCu.description} onChange={v=>setNewCu({...newCu,description:v})} style={{flex:1,marginBottom:0}}/>
        <Input label="Valor (R$)" value={newCu.value} onChange={v=>setNewCu({...newCu,value:v})} type="number" style={{width:120,marginBottom:0}}/>
        <Input label="Data" value={newCu.custa_date} onChange={v=>setNewCu({...newCu,custa_date:v})} type="date" style={{width:150,marginBottom:0}}/>
        <Button size="sm" onClick={()=>{if(newCu.description&&newCu.value){onAddCusta({entity_type:'process',entity_id:proc.id,description:newCu.description,value:Number(newCu.value),custa_date:newCu.custa_date});setNewCu({description:'',value:'',custa_date:todayISO()});setShowCu(false);}}}>Salvar</Button>
      </div>}
      {cus.length===0?<div style={{fontSize:12,color:C.textFaint}}>Nenhuma custa</div>:cus.map(c=><div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 12px',borderBottom:`1px solid ${C.borderLight}`,fontSize:13}}><span>{c.description}</span><span style={{display:'flex',gap:12}}><span style={{color:C.textLight}}>{formatDate(c.custa_date)}</span><strong style={{color:C.danger}}>{formatCurrency(c.value)}</strong></span></div>)}
    </div>

    {/* Updates */}
    <div style={{marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:10}}>Atualizações</div>
      <div style={{display:'flex',gap:10,marginBottom:12}}>
        <input type="text" value={newUp} onChange={e=>setNewUp(e.target.value)} placeholder="Nova atualização..." onKeyDown={e=>{if(e.key==='Enter'&&newUp.trim()){onAddUpdate(proc.id,newUp.trim());setNewUp('');}}} style={{flex:1,padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,backgroundColor:'#fafaf7',fontSize:13,fontFamily:'inherit'}}/>
        <Button size="sm" onClick={()=>{if(newUp.trim()){onAddUpdate(proc.id,newUp.trim());setNewUp('');}}} disabled={!newUp.trim()}>Adicionar</Button>
      </div>
      {ups.length===0?<div style={{fontSize:12,color:C.textFaint}}>Nenhuma atualização</div>:
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {ups.map(u=><div key={u.id} style={{display:'flex',gap:12,padding:'8px 0',borderBottom:`1px solid ${C.borderLight}`}}>
            <div style={{width:8,height:8,borderRadius:'50%',backgroundColor:u.auto_generated?C.success:C.accent,marginTop:6,flexShrink:0}}/>
            <div><div style={{fontSize:13,color:C.textMed}}>{u.description}</div><div style={{fontSize:11,color:C.textFaint,marginTop:2}}>{formatDate(u.update_date)}</div></div>
          </div>)}
        </div>}
    </div>

    <div style={{display:'flex',gap:10,justifyContent:'space-between'}}>
      <Button variant="danger" size="sm" onClick={onDelete}>Excluir</Button>
      <div style={{display:'flex',gap:8}}><Button variant="secondary" onClick={onClose}>Fechar</Button><Button onClick={onEdit}>Editar</Button></div>
    </div>
  </Modal>;
}
