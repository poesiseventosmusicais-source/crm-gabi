'use client';
import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
import { Sidebar, PageHeader, Card, StatCard, Badge, Button, EmptyState, C } from '../../components/ui';
import { formatCurrency, statusColor, paymentColor, daysUntil } from '../../lib/helpers';

export default function FinanceiroPage() {
  const supabase = createClient();
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [custasData, setCustasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPay, setFilterPay] = useState('');

  useEffect(()=>{init();},[]);
  async function init() { const{data:{user}}=await supabase.auth.getUser(); if(!user){window.location.href='/';return;} await load(); }
  async function load() {
    setLoading(true);
    const [cl,ca,pr,dl,cu] = await Promise.all([
      supabase.from('clients').select('*'),supabase.from('cases').select('*'),supabase.from('processes').select('*'),
      supabase.from('deadlines').select('*'),supabase.from('custas').select('*'),
    ]);
    setClients(cl.data||[]);setCases(ca.data||[]);setProcesses(pr.data||[]);setDeadlines(dl.data||[]);setCustasData(cu.data||[]);
    setLoading(false);
  }
  async function handleLogout(){await supabase.auth.signOut();window.location.href='/';}
  function nav(tab){const r={dashboard:'/dashboard',deadlines:'/prazos',processes:'/processos',cases:'/casos',clients:'/clientes',financial:'/financeiro'};window.location.href=r[tab];}
  const getCl=(id)=>clients.find(c=>c.id===id);
  const urgentCount=deadlines.filter(d=>!d.completed&&(d.urgency==='Urgente'||daysUntil(d.due_date)<0)).length;

  const allEnts=[...cases.map(c=>({...c,_t:'case'})),...processes.map(p=>({...p,_t:'process'}))];
  const totalFees=allEnts.reduce((s,e)=>s+Number(e.fees||0),0);
  const totalPaid=allEnts.reduce((s,e)=>s+Number(e.fees_paid||0),0);
  const totalCustas=custasData.reduce((s,c)=>s+Number(c.value||0),0);

  // By type
  const byType={};
  allEnts.forEach(e=>{if(!byType[e.type]) byType[e.type]={fees:0,paid:0,custas:0,count:0};byType[e.type].fees+=Number(e.fees||0);byType[e.type].paid+=Number(e.fees_paid||0);byType[e.type].count++;});
  custasData.forEach(c=>{
    const ent=c.entity_type==='process'?processes.find(p=>p.id===c.entity_id):cases.find(ca=>ca.id===c.entity_id);
    if(ent&&byType[ent.type]) byType[ent.type].custas+=Number(c.value||0);
  });

  // By system (processes only)
  const bySystem={};
  processes.forEach(p=>{if(!bySystem[p.system]) bySystem[p.system]={fees:0,paid:0,count:0};bySystem[p.system].fees+=Number(p.fees||0);bySystem[p.system].paid+=Number(p.fees_paid||0);bySystem[p.system].count++;});

  // By origin
  const byOrigin={};
  allEnts.forEach(e=>{const cl=getCl(e.client_id);const o=cl?.origin||'Outro';if(!byOrigin[o]) byOrigin[o]={fees:0,paid:0,count:0};byOrigin[o].fees+=Number(e.fees||0);byOrigin[o].paid+=Number(e.fees_paid||0);byOrigin[o].count++;});

  const filtered=allEnts.filter(e=>!filterPay||e.payment_status===filterPay);

  return (
    <div style={{display:'flex'}}>
      <Sidebar activeTab="financial" onTabChange={nav} onLogout={handleLogout} urgentCount={urgentCount}/>
      <div style={{marginLeft:220,flex:1,padding:'32px 36px',maxWidth:1080}}>
        <PageHeader title="Financeiro" subtitle="Honorários, custas e recebimentos"/>
        {loading?<div style={{color:C.textLight,padding:40,textAlign:'center'}}>Carregando...</div>:<>

        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:24}}>
          <StatCard label="Honorários" value={formatCurrency(totalFees)}/>
          <StatCard label="Recebido" value={formatCurrency(totalPaid)} color={C.success}/>
          <StatCard label="A Receber" value={formatCurrency(totalFees-totalPaid)} color={C.warning}/>
          <StatCard label="Custas" value={formatCurrency(totalCustas)} color={C.danger}/>
          <StatCard label="Resultado" value={formatCurrency(totalPaid-totalCustas)} color={totalPaid-totalCustas>=0?C.success:C.danger} detail="Recebido - Custas"/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:24}}>
          {/* By Type */}
          <Card>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Por Tipo</div>
            {Object.entries(byType).sort((a,b)=>b[1].fees-a[1].fees).map(([type,d])=>(
              <div key={type} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}><span style={{fontWeight:600}}>{type} ({d.count})</span><span style={{fontWeight:700}}>{formatCurrency(d.fees)}</span></div>
                <div style={{height:5,backgroundColor:C.borderLight,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:d.fees>0?`${(d.paid/d.fees)*100}%`:'0%',background:`linear-gradient(90deg,${C.accent},${C.accentLight})`,borderRadius:3}}/></div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:3,fontSize:10}}>
                  <span style={{color:C.success}}>Rec: {formatCurrency(d.paid)}</span>
                  <span style={{color:C.danger}}>Custas: {formatCurrency(d.custas)}</span>
                </div>
              </div>
            ))}
          </Card>

          {/* By System */}
          <Card>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Por Sistema</div>
            {Object.keys(bySystem).length===0?<div style={{fontSize:12,color:C.textFaint}}>Sem processos</div>:
            Object.entries(bySystem).sort((a,b)=>b[1].fees-a[1].fees).map(([sys,d])=>{
              const max=Math.max(...Object.values(bySystem).map(x=>x.fees));
              return <div key={sys} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}><span style={{fontWeight:600}}>{sys} ({d.count})</span><span style={{fontWeight:700}}>{formatCurrency(d.fees)}</span></div>
                <div style={{height:5,backgroundColor:C.borderLight,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:max>0?`${(d.fees/max)*100}%`:'0%',background:`linear-gradient(90deg,${C.warning},#d4a843)`,borderRadius:3}}/></div>
              </div>;
            })}
          </Card>

          {/* By Origin */}
          <Card>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Por Origem</div>
            {Object.entries(byOrigin).sort((a,b)=>b[1].fees-a[1].fees).map(([origin,d])=>{
              const max=Math.max(...Object.values(byOrigin).map(x=>x.fees));
              return <div key={origin} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:4}}><span style={{fontWeight:600}}>{origin} ({d.count})</span><span style={{fontWeight:700}}>{formatCurrency(d.fees)}</span></div>
                <div style={{height:5,backgroundColor:C.borderLight,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:max>0?`${(d.fees/max)*100}%`:'0%',background:`linear-gradient(90deg,#6b4c9a,#9b7cc8)`,borderRadius:3}}/></div>
              </div>;
            })}
          </Card>
        </div>

        {/* Detail table */}
        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>Detalhamento</div>
            <div style={{display:'flex',gap:6}}>
              {['','Pendente','Parcial','Pago'].map(f=>(
                <button key={f} onClick={()=>setFilterPay(f)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid',fontSize:11,fontWeight:600,fontFamily:'inherit',cursor:'pointer',borderColor:filterPay===f?C.accent:C.border,backgroundColor:filterPay===f?C.accentBg:'transparent',color:filterPay===f?C.accentDark:C.textLight}}>{f||'Todos'}</button>
              ))}
            </div>
          </div>
          {filtered.length===0?<div style={{fontSize:13,color:C.textFaint,padding:'20px 0',textAlign:'center'}}>Nenhum resultado</div>:(
            <div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 0.8fr 1fr 1fr 1fr 1fr 0.8fr',gap:8,padding:'8px 12px',fontSize:10,fontWeight:700,color:C.textLight,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                <span>Cliente</span><span>Tipo</span><span style={{textAlign:'right'}}>Honor.</span><span style={{textAlign:'right'}}>Receb.</span><span style={{textAlign:'right'}}>Custas</span><span style={{textAlign:'right'}}>Saldo</span><span style={{textAlign:'center'}}>Pgto</span>
              </div>
              {filtered.map(e=>{
                const cl=getCl(e.client_id);
                const eCu=custasData.filter(c=>c.entity_type===e._t&&c.entity_id===e.id).reduce((s,c)=>s+Number(c.value||0),0);
                const saldo=Number(e.fees_paid||0)-eCu;
                return <div key={e.id} style={{display:'grid',gridTemplateColumns:'2fr 0.8fr 1fr 1fr 1fr 1fr 0.8fr',gap:8,padding:'10px 12px',borderBottom:`1px solid ${C.borderLight}`,fontSize:13,alignItems:'center'}}>
                  <div><div style={{fontWeight:600}}>{cl?.name||'—'}</div><div style={{fontSize:11,color:C.textFaint}}>{e.type}</div></div>
                  <Badge color={e._t==='process'?'blue':'gray'}>{e._t==='process'?'Proc.':'Caso'}</Badge>
                  <div style={{textAlign:'right',fontWeight:600}}>{formatCurrency(e.fees)}</div>
                  <div style={{textAlign:'right',color:C.success,fontWeight:600}}>{formatCurrency(e.fees_paid)}</div>
                  <div style={{textAlign:'right',color:C.danger,fontWeight:600}}>{formatCurrency(eCu)}</div>
                  <div style={{textAlign:'right',color:saldo>=0?C.success:C.danger,fontWeight:600}}>{formatCurrency(saldo)}</div>
                  <div style={{textAlign:'center'}}><Badge color={paymentColor(e.payment_status)}>{e.payment_status}</Badge></div>
                </div>;
              })}
              <div style={{display:'grid',gridTemplateColumns:'2fr 0.8fr 1fr 1fr 1fr 1fr 0.8fr',gap:8,padding:'14px 12px',borderTop:`2px solid ${C.border}`,marginTop:4,fontSize:13,fontWeight:700}}>
                <span>TOTAL ({filtered.length})</span><span></span>
                <span style={{textAlign:'right'}}>{formatCurrency(filtered.reduce((s,e)=>s+Number(e.fees||0),0))}</span>
                <span style={{textAlign:'right',color:C.success}}>{formatCurrency(filtered.reduce((s,e)=>s+Number(e.fees_paid||0),0))}</span>
                <span style={{textAlign:'right',color:C.danger}}>{formatCurrency(filtered.reduce((s,e)=>s+custasData.filter(c=>c.entity_type===e._t&&c.entity_id===e.id).reduce((ss,c)=>ss+Number(c.value||0),0),0))}</span>
                <span style={{textAlign:'right'}}>{formatCurrency(filtered.reduce((s,e)=>s+Number(e.fees_paid||0)-custasData.filter(c=>c.entity_type===e._t&&c.entity_id===e.id).reduce((ss,c)=>ss+Number(c.value||0),0),0))}</span>
                <span></span>
              </div>
            </div>
          )}
        </Card>
        </>}
      </div>
    </div>
  );
}
