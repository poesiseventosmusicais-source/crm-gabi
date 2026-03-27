'use client';
import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
import { Sidebar, PageHeader, Card, Badge, Button, Modal, Input, Select, EmptyState, ConfirmDialog, WhatsAppBtn, UrgencyBadge, C } from '../../components/ui';
import { ORIGINS, formatDate, formatCurrency, daysUntil, statusColor, paymentColor } from '../../lib/helpers';

export default function ClientesPage() {
  const supabase = createClient();
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
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
    const [cl,ca,pr,dl,cu] = await Promise.all([
      supabase.from('clients').select('*').order('name'),supabase.from('cases').select('*'),supabase.from('processes').select('*'),
      supabase.from('deadlines').select('*').order('due_date'),supabase.from('custas').select('*'),
    ]);
    setClients(cl.data||[]);setCases(ca.data||[]);setProcesses(pr.data||[]);setDeadlines(dl.data||[]);setCustasData(cu.data||[]);
    setLoading(false);
  }
  async function saveClient(form) {
    if(form.id) await supabase.from('clients').update({name:form.name,phone:form.phone,email:form.email,cpf:form.cpf,origin:form.origin,notes:form.notes}).eq('id',form.id);
    else await supabase.from('clients').insert({...form,user_id:userId});
    setModal(null); await load();
  }
  async function deleteClient(id) { await supabase.from('clients').delete().eq('id',id); setConfirm(null);setDetail(null); await load(); }
  async function handleLogout(){await supabase.auth.signOut();window.location.href='/';}
  function nav(tab){const r={dashboard:'/dashboard',deadlines:'/prazos',processes:'/processos',cases:'/casos',clients:'/clientes',financial:'/financeiro'};window.location.href=r[tab];}
  const urgentCount=deadlines.filter(d=>!d.completed&&(d.urgency==='Urgente'||daysUntil(d.due_date)<0)).length;

  const filtered=clients.filter(c=>!search||c.name?.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search)||c.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{display:'flex'}}>
      <Sidebar activeTab="clients" onTabChange={nav} onLogout={handleLogout} urgentCount={urgentCount}/>
      <div style={{marginLeft:220,flex:1,padding:'32px 36px',maxWidth:1080}}>
        <PageHeader title="Clientes" subtitle={`${clients.length} cadastrado${clients.length!==1?'s':''}`} action={<Button onClick={()=>setModal({type:'new'})}>+ Novo Cliente</Button>}/>
        <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, telefone, email..." style={{width:'100%',maxWidth:400,padding:'10px 16px',borderRadius:10,border:`1px solid ${C.border}`,backgroundColor:'#fff',fontSize:13,fontFamily:'inherit',marginBottom:20}}/>

        {loading?<div style={{color:C.textLight,padding:40,textAlign:'center'}}>Carregando...</div>
        :filtered.length===0?<EmptyState icon="♦" title="Nenhum cliente" action={<Button onClick={()=>setModal({type:'new'})}>+ Novo Cliente</Button>}/>
        :<div style={{display:'flex',flexDirection:'column',gap:10}}>
          {filtered.map(cl=>{
            const clCases=cases.filter(c=>c.client_id===cl.id);
            const clProcs=processes.filter(p=>p.client_id===cl.id);
            return <Card key={cl.id} onClick={()=>setDetail(cl)} style={{cursor:'pointer'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:C.text,marginBottom:4}}>{cl.name}</div>
                  <div style={{fontSize:12,color:C.textLight,display:'flex',gap:14}}>{cl.phone&&<span>{cl.phone}</span>}{cl.email&&<span>{cl.email}</span>}</div>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  {cl.phone&&<WhatsAppBtn phone={cl.phone}/>}
                  <Badge color="olive">{cl.origin}</Badge>
                  <Badge color="blue">{clProcs.length} proc.</Badge>
                  <Badge color="gray">{clCases.length} caso{clCases.length!==1?'s':''}</Badge>
                </div>
              </div>
            </Card>;
          })}
        </div>}

        {modal&&<ClientForm initial={modal.data} onSave={saveClient} onClose={()=>setModal(null)}/>}

        {/* Client 360 detail */}
        {detail&&(()=>{
          const cl=detail;
          const clCases=cases.filter(c=>c.client_id===cl.id);
          const clProcs=processes.filter(p=>p.client_id===cl.id);
          const clCaseIds=clCases.map(c=>c.id);
          const clProcIds=clProcs.map(p=>p.id);
          const clDls=deadlines.filter(d=>!d.completed&&((d.entity_type==='case'&&clCaseIds.includes(d.entity_id))||(d.entity_type==='process'&&clProcIds.includes(d.entity_id))));
          const totalFees=[...clCases,...clProcs].reduce((s,e)=>s+Number(e.fees||0),0);
          const totalPaid=[...clCases,...clProcs].reduce((s,e)=>s+Number(e.fees_paid||0),0);
          const totalCu=custasData.filter(c=>(c.entity_type==='case'&&clCaseIds.includes(c.entity_id))||(c.entity_type==='process'&&clProcIds.includes(c.entity_id))).reduce((s,c)=>s+Number(c.value||0),0);

          return <Modal title={cl.name} onClose={()=>setDetail(null)} width={680}>
            <div style={{display:'flex',gap:8,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
              {cl.phone&&<WhatsAppBtn phone={cl.phone} size="md"/>}
              <Badge color="olive">{cl.origin}</Badge>
              {cl.email&&<span style={{fontSize:12,color:C.textLight}}>{cl.email}</span>}
              {cl.cpf&&<span style={{fontSize:12,color:C.textLight}}>CPF: {cl.cpf}</span>}
            </div>

            {/* Processos */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:10}}>Processos ({clProcs.length})</div>
              {clProcs.length===0?<div style={{fontSize:12,color:C.textFaint}}>Nenhum processo</div>:clProcs.map(p=>(
                <div key={p.id} onClick={()=>{setDetail(null);window.location.href='/processos';}} style={{padding:'10px 14px',borderRadius:10,backgroundColor:'#fafaf7',border:`1px solid ${C.borderLight}`,marginBottom:6,cursor:'pointer'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{p.type} — {p.process_number||'Sem número'}</div><div style={{fontSize:11,color:C.textLight}}>{p.system} · {p.status}</div></div>
                    <Badge color={paymentColor(p.payment_status)}>{formatCurrency(p.fees)}</Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Casos */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:10}}>Casos ({clCases.length})</div>
              {clCases.length===0?<div style={{fontSize:12,color:C.textFaint}}>Nenhum caso</div>:clCases.map(c=>(
                <div key={c.id} onClick={()=>{setDetail(null);window.location.href='/casos';}} style={{padding:'10px 14px',borderRadius:10,backgroundColor:'#fafaf7',border:`1px solid ${C.borderLight}`,marginBottom:6,cursor:'pointer'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{c.type} — {c.status}</div></div>
                    <Badge color={paymentColor(c.payment_status)}>{formatCurrency(c.fees)}</Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Prazos pendentes */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:10}}>Prazos Pendentes ({clDls.length})</div>
              {clDls.length===0?<div style={{fontSize:12,color:C.textFaint}}>Nenhum prazo pendente</div>:clDls.map(d=>(
                <div key={d.id} style={{padding:'8px 14px',borderRadius:8,backgroundColor:'#fafaf7',marginBottom:4,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:12}}>{d.theme}: {d.description}</span>
                  <div style={{display:'flex',gap:4}}><UrgencyBadge urgency={d.urgency}/><span style={{fontSize:11,color:C.textLight}}>{formatDate(d.due_date)}</span></div>
                </div>
              ))}
            </div>

            {/* Resumo financeiro */}
            <div style={{padding:'14px 16px',backgroundColor:'#fafaf7',borderRadius:10,marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:C.textLight,marginBottom:8,textTransform:'uppercase'}}>Resumo Financeiro</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:10,fontSize:13}}>
                <div><span style={{color:C.textLight}}>Honorários:</span><br/><strong>{formatCurrency(totalFees)}</strong></div>
                <div><span style={{color:C.textLight}}>Recebido:</span><br/><strong style={{color:C.success}}>{formatCurrency(totalPaid)}</strong></div>
                <div><span style={{color:C.textLight}}>Pendente:</span><br/><strong style={{color:C.warning}}>{formatCurrency(totalFees-totalPaid)}</strong></div>
                <div><span style={{color:C.textLight}}>Custas:</span><br/><strong style={{color:C.danger}}>{formatCurrency(totalCu)}</strong></div>
              </div>
            </div>

            <div style={{display:'flex',gap:10}}>
              <Button variant="secondary" onClick={()=>{setDetail(null);setModal({type:'edit',data:cl});}}>Editar</Button>
              <Button variant="danger" size="sm" onClick={()=>{setDetail(null);setConfirm(cl);}}>Excluir</Button>
            </div>
          </Modal>;
        })()}

        {confirm&&<ConfirmDialog title="Excluir cliente" message={`Excluir "${confirm.name}"? Casos e processos vinculados também serão removidos.`} danger onConfirm={()=>deleteClient(confirm.id)} onCancel={()=>setConfirm(null)}/>}
      </div>
    </div>
  );
}

function ClientForm({initial,onSave,onClose}) {
  const d=initial||{};
  const [f,sF]=useState({name:'',phone:'',email:'',cpf:'',origin:'Indicação',notes:'',...d});
  const s=(k,v)=>sF({...f,[k]:v});
  return <Modal title={d.id?'Editar Cliente':'Novo Cliente'} onClose={onClose}>
    <Input label="Nome" value={f.name} onChange={v=>s('name',v)} required/>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Input label="Telefone" value={f.phone} onChange={v=>s('phone',v)} placeholder="(19) 99999-9999"/>
      <Input label="Email" value={f.email} onChange={v=>s('email',v)}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
      <Input label="CPF" value={f.cpf} onChange={v=>s('cpf',v)}/>
      <Select label="Origem" value={f.origin} onChange={v=>s('origin',v)} options={ORIGINS}/>
    </div>
    <Input label="Observações" value={f.notes} onChange={v=>s('notes',v)} textarea/>
    <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
      <Button variant="secondary" onClick={onClose}>Cancelar</Button>
      <Button onClick={()=>{if(f.name) onSave(f);}} disabled={!f.name}>Salvar</Button>
    </div>
  </Modal>;
}
