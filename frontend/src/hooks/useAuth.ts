import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

const MOCK_STORAGE_KEY = 'whatsapp_fin_mock_user';

export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Checa se existe usuário teste / mock salvo
    const savedMock = localStorage.getItem(MOCK_STORAGE_KEY);
    if (savedMock) {
      try {
        const parsed = JSON.parse(savedMock);
        setUser(parsed);
        setLoading(false);
        return;
      } catch {}
    }

    // 2. Obtém sessão inicial do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 3. Escuta alterações de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password });

  /**
   * Login instantâneo em 1 clique com usuário de teste para demonstração e navegação offline
   */
  const signInAsTestUser = () => {
    const mockUser: User = {
      id: 'demo-test-user',
      app_metadata: {},
      user_metadata: { firstName: 'Usuário', lastName: 'Teste' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'teste@whatsappfin.com',
      phone: '+55 11 99999-9999',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as User;

    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const signOut = async () => {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return { user, session, loading, signIn, signUp, signOut, signInAsTestUser };
}
