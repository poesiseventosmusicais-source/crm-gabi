'use client';
import { useState } from 'react';
import { createClient } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setMessage('');
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message); else setMessage('Conta criada! Verifique seu email.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('Email ou senha incorretos.'); else window.location.href = '/dashboard';
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#2a2a2a,#1a1a1a)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <img src="/logo.png" alt="GJ" style={{ width:100, height:100, borderRadius:20, objectFit:'cover', marginBottom:16, border:'2px solid rgba(229,224,213,0.12)' }} />
          <h1 style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:26, fontWeight:600, color:'#e5e0d5', margin:'0 0 4px 0' }}>Gabriele Justino</h1>
          <p style={{ color:'rgba(229,224,213,0.4)', fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>Advocacia Familiar</p>
        </div>
        <div style={{ backgroundColor:'rgba(229,224,213,0.05)', backdropFilter:'blur(20px)', borderRadius:20, padding:'32px 28px', border:'1px solid rgba(229,224,213,0.08)' }}>
          <h2 style={{ fontSize:17, fontWeight:600, color:'#e5e0d5', marginBottom:22, textAlign:'center' }}>{isSignUp?'Criar conta':'Entrar'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(229,224,213,0.45)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required style={{ width:'100%', padding:'12px 16px', borderRadius:10, border:'1px solid rgba(229,224,213,0.1)', backgroundColor:'rgba(229,224,213,0.05)', color:'#e5e0d5', fontSize:14, fontFamily:'inherit' }} placeholder="seu@email.com" />
            </div>
            <div style={{ marginBottom:22 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(229,224,213,0.45)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Senha</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} style={{ width:'100%', padding:'12px 16px', borderRadius:10, border:'1px solid rgba(229,224,213,0.1)', backgroundColor:'rgba(229,224,213,0.05)', color:'#e5e0d5', fontSize:14, fontFamily:'inherit' }} placeholder="Mínimo 6 caracteres" />
            </div>
            {error && <div style={{ backgroundColor:'rgba(166,61,64,0.15)', border:'1px solid rgba(166,61,64,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#e5a3a5' }}>{error}</div>}
            {message && <div style={{ backgroundColor:'rgba(77,92,66,0.15)', border:'1px solid rgba(77,92,66,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#a5c496' }}>{message}</div>}
            <button type="submit" disabled={loading} style={{ width:'100%', padding:13, borderRadius:10, border:'none', background:loading?'rgba(107,124,94,0.5)':'linear-gradient(135deg,#6b7c5e,#4d5c42)', color:'#fff', fontSize:14, fontWeight:600, fontFamily:'inherit', cursor:loading?'wait':'pointer', boxShadow:'0 4px 16px rgba(107,124,94,0.3)' }}>{loading?'Aguarde...':isSignUp?'Criar conta':'Entrar'}</button>
          </form>
          <div style={{ textAlign:'center', marginTop:18, fontSize:13, color:'rgba(229,224,213,0.35)' }}>
            {isSignUp?'Já tem conta?':'Não tem conta?'}{' '}
            <button onClick={()=>{setIsSignUp(!isSignUp);setError('');setMessage('');}} style={{ background:'none', border:'none', color:'#8a9e7a', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', textDecoration:'underline' }}>{isSignUp?'Fazer login':'Criar conta'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
