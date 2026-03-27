'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';
import LoginPage from './login/page';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#2a2a2a' }}><div style={{ width:40, height:40, border:'3px solid rgba(107,124,94,0.2)', borderTopColor:'#6b7c5e', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (!session) return <LoginPage />;
  if (typeof window !== 'undefined') window.location.href = '/dashboard';
  return null;
}
