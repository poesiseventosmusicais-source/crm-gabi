'use client';
import { useState } from 'react';

const C = { bg:"#f7f5f0", card:"#fff", border:"#e5e0d5", borderLight:"#f0ede6", text:"#2a2a2a", textMed:"#525252", textLight:"#8a8a8a", textFaint:"#a3a3a3", accent:"#6b7c5e", accentLight:"#8a9e7a", accentDark:"#4d5c42", accentBg:"rgba(107,124,94,0.08)", danger:"#a63d40", dangerBg:"#faf0f0", warning:"#b8860b", warningBg:"#fdf8ec", success:"#4d5c42", successBg:"#f0f5ed", urgentBg:"#faf0f0", urgentText:"#a63d40", commonBg:"#eef3f8", commonText:"#3a6b9f", whatsapp:"#25D366" };
export { C };

export function Sidebar({ activeTab, onTabChange, onLogout, urgentCount }) {
  const tabs = [
    { id:'dashboard', label:'Painel', icon:'◫' },
    { id:'deadlines', label:'Prazos', icon:'◷' },
    { id:'processes', label:'Processos', icon:'⚖' },
    { id:'cases', label:'Casos', icon:'◈' },
    { id:'clients', label:'Clientes', icon:'♦' },
    { id:'financial', label:'Financeiro', icon:'◉' },
  ];
  return (
    <div style={{ width:220, minHeight:'100vh', background:'linear-gradient(180deg,#2a2a2a,#1a1a1a)', padding:'24px 0', display:'flex', flexDirection:'column', position:'fixed', left:0, top:0, zIndex:50 }}>
      <div style={{ padding:'0 20px', marginBottom:32, textAlign:'center' }}>
        <img src="/logo.png" alt="GJ" style={{ width:60, height:60, borderRadius:14, objectFit:'cover', marginBottom:8, border:'2px solid rgba(229,224,213,0.12)' }} />
        <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:14, fontWeight:600, color:'#e5e0d5' }}>Gabriele Justino</div>
        <div style={{ fontSize:9, color:'rgba(229,224,213,0.35)', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:3 }}>Advocacia Familiar</div>
      </div>
      <nav style={{ flex:1, padding:'0 10px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>onTabChange(t.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', marginBottom:3, border:'none', borderRadius:10, backgroundColor:activeTab===t.id?'rgba(107,124,94,0.18)':'transparent', color:activeTab===t.id?'#8a9e7a':'rgba(229,224,213,0.4)', fontSize:12.5, fontWeight:activeTab===t.id?600:500, fontFamily:'inherit', cursor:'pointer', textAlign:'left', position:'relative' }}>
            <span style={{ fontSize:14, width:18, textAlign:'center' }}>{t.icon}</span>{t.label}
            {t.id==='deadlines' && urgentCount>0 && <span style={{ position:'absolute', right:12, backgroundColor:C.danger, color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 }}>{urgentCount}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding:'0 16px' }}>
        <div style={{ fontSize:10, color:'rgba(229,224,213,0.2)', marginBottom:8 }}>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</div>
        <button onClick={onLogout} style={{ width:'100%', padding:'10px 16px', border:'1px solid rgba(229,224,213,0.08)', borderRadius:10, backgroundColor:'transparent', color:'rgba(229,224,213,0.35)', fontSize:12, fontFamily:'inherit', cursor:'pointer' }}>Sair</button>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
      <div>
        <h1 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:26, fontWeight:600, color:C.text, margin:'0 0 4px 0' }}>{title}</h1>
        {subtitle && <p style={{ fontSize:13, color:C.textLight, margin:0 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, style, onClick }) {
  return <div onClick={onClick} style={{ backgroundColor:C.card, borderRadius:14, padding:'22px 24px', border:`1px solid ${C.border}`, cursor:onClick?'pointer':'default', ...style }}>{children}</div>;
}

export function StatCard({ label, value, detail, color }) {
  return <Card><div style={{ fontSize:11, fontWeight:600, color:C.textLight, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{label}</div><div style={{ fontSize:26, fontWeight:700, color:color||C.text }}>{value}</div>{detail && <div style={{ fontSize:12, color:C.textFaint, marginTop:4 }}>{detail}</div>}</Card>;
}

export function Badge({ children, color, style, onClick }) {
  const map = { green:{bg:C.successBg,text:C.success}, yellow:{bg:C.warningBg,text:C.warning}, orange:{bg:'#fdf2ea',text:'#c46a1a'}, red:{bg:C.dangerBg,text:C.danger}, blue:{bg:C.commonBg,text:C.commonText}, purple:{bg:'#f3f0f8',text:'#6b4c9a'}, gray:{bg:'#f2efe8',text:C.textLight}, olive:{bg:C.accentBg,text:C.accentDark}, urgent:{bg:C.urgentBg,text:C.urgentText}, common:{bg:C.commonBg,text:C.commonText} };
  const c = map[color]||map.gray;
  return <span onClick={onClick} style={{ display:'inline-block', padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:600, backgroundColor:c.bg, color:c.text, cursor:onClick?'pointer':'default', ...style }}>{children}</span>;
}

export function UrgencyBadge({ urgency }) { return <Badge color={urgency==='Urgente'?'urgent':'common'}>{urgency}</Badge>; }

export function Button({ children, onClick, variant='primary', size='md', disabled, style, type='button' }) {
  const base = { border:'none', cursor:disabled?'default':'pointer', fontFamily:'inherit', fontWeight:600, borderRadius:10, opacity:disabled?0.5:1, display:'inline-flex', alignItems:'center', gap:6 };
  const sizes = { sm:{padding:'7px 14px',fontSize:12}, md:{padding:'10px 20px',fontSize:13}, lg:{padding:'13px 26px',fontSize:14} };
  const variants = {
    primary: { background:`linear-gradient(135deg,${C.accent},${C.accentDark})`, color:'#fff', boxShadow:'0 2px 8px rgba(107,124,94,0.25)' },
    secondary: { backgroundColor:'#f2efe8', color:C.textMed },
    danger: { backgroundColor:C.dangerBg, color:C.danger },
    ghost: { backgroundColor:'transparent', color:C.textLight },
    dark: { backgroundColor:C.text, color:'#e5e0d5' },
    whatsapp: { backgroundColor:C.whatsapp, color:'#fff' },
  };
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>{children}</button>;
}

export function Modal({ title, children, onClose, width=520 }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, backgroundColor:'rgba(26,26,26,0.5)', backdropFilter:'blur(4px)' }} />
      <div className="scale-in" style={{ position:'relative', backgroundColor:'#fff', borderRadius:18, width:'100%', maxWidth:width, maxHeight:'90vh', overflow:'auto', padding:'28px 30px', boxShadow:'0 25px 60px rgba(26,26,26,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:20, fontWeight:600, color:C.text, margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'none', backgroundColor:'#f2efe8', color:C.textLight, fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, type='text', placeholder, required, textarea, style, disabled }) {
  const s = { width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:'#fafaf7', fontSize:13, fontFamily:'inherit', color:C.text, resize:textarea?'vertical':undefined, minHeight:textarea?80:undefined };
  return (
    <div style={{ marginBottom:14, ...style }}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.textLight, marginBottom:5, letterSpacing:'0.04em', textTransform:'uppercase' }}>{label}{required&&' *'}</label>}
      {textarea ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} style={s} /> : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} style={s} />}
    </div>
  );
}

export function Select({ label, value, onChange, options, required, style }) {
  return (
    <div style={{ marginBottom:14, ...style }}>
      {label && <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.textLight, marginBottom:5, letterSpacing:'0.04em', textTransform:'uppercase' }}>{label}{required&&' *'}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)} required={required} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:`1px solid ${C.border}`, backgroundColor:'#fafaf7', fontSize:13, fontFamily:'inherit', color:C.text, cursor:'pointer' }}>
        <option value="">Selecione...</option>
        {options.map(o=><option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>{typeof o==='string'?o:o.label}</option>)}
      </select>
    </div>
  );
}

export function ThemeSelector({ themes, selected, onSelect }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:C.textLight, marginBottom:6, letterSpacing:'0.04em', textTransform:'uppercase' }}>Tema</label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {themes.map(t=>(
          <button key={t} onClick={()=>onSelect(t)} style={{ padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:600, fontFamily:'inherit', cursor:'pointer', border:selected===t?`2px solid ${C.accent}`:`1px solid ${C.border}`, backgroundColor:selected===t?C.accentBg:'#fafaf7', color:selected===t?C.accentDark:C.textMed }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

export function WhatsAppBtn({ phone, size='sm' }) {
  if (!phone) return null;
  const clean = phone.replace(/\D/g,'');
  const num = clean.length<=11?'55'+clean:clean;
  return <button onClick={e=>{e.stopPropagation();window.open(`https://wa.me/${num}`,'_blank');}} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:size==='sm'?'4px 10px':'8px 16px', borderRadius:8, border:'none', backgroundColor:C.whatsapp, color:'#fff', fontSize:size==='sm'?11:13, fontWeight:600, fontFamily:'inherit', cursor:'pointer' }}>📱 WhatsApp</button>;
}

export function EmptyState({ icon, title, subtitle, action }) {
  return <div style={{ textAlign:'center', padding:'60px 20px', color:C.textFaint }}><div style={{ fontSize:40, marginBottom:16, opacity:0.5 }}>{icon}</div><div style={{ fontSize:16, fontWeight:600, color:C.textLight, marginBottom:6 }}>{title}</div>{subtitle&&<div style={{ fontSize:13, marginBottom:20 }}>{subtitle}</div>}{action}</div>;
}

export function ConfirmDialog({ title, message, onConfirm, onCancel, danger }) {
  return <Modal title={title} onClose={onCancel} width={400}><p style={{ fontSize:14, color:C.textLight, lineHeight:1.6, margin:'0 0 24px 0' }}>{message}</p><div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}><Button variant="secondary" onClick={onCancel}>Cancelar</Button><Button variant={danger?'danger':'primary'} onClick={onConfirm}>{danger?'Excluir':'Confirmar'}</Button></div></Modal>;
}
