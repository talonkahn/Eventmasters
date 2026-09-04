import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);
const ADMIN_EMAIL = 'samuelivere92@gmail.com';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId, email) => {
    if (!userId) { setProfile(null); return; }
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      // Force admin role for the designated admin email regardless of DB value
      if (email === ADMIN_EMAIL && data.role !== 'admin') {
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
        data.role = 'admin';
      }
      setProfile(data);
    } catch (err) {
      console.error('Profile load error', err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      loadProfile(session?.user?.id, session?.user?.email).finally(() => setLoading(false));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      loadProfile(session?.user?.id, session?.user?.email);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role: email === ADMIN_EMAIL ? 'admin' : 'buyer' } },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = () => supabase.auth.signOut();

  const isAdmin = profile?.role === 'admin' || session?.user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, isAdmin, loading, signUp, signIn, signOut, refreshProfile: () => loadProfile(session?.user?.id, session?.user?.email) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
