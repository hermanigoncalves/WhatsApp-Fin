import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

const MOCK_STORAGE_KEY = 'whatsapp_fin_mock_user';

const getInitialMockUser = (): User | null => {
  try {
    const saved = localStorage.getItem(MOCK_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }>;
  signOut: () => Promise<void>;
  signInAsTestUser: () => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
}

const initialMock = getInitialMockUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialMock,
  session: null,
  loading: !initialMock,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email, password) => {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.data.session) {
      set({ user: result.data.user, session: result.data.session, loading: false });
    }
    return result;
  },

  signUp: async (email, password) => {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    const result = await supabase.auth.signUp({ email, password });
    if (result.data.session) {
      set({ user: result.data.user, session: result.data.session, loading: false });
    }
    return result;
  },

  signInAsTestUser: () => {
    const mockUser: User = {
      id: 'demo-test-user',
      app_metadata: {},
      user_metadata: { firstName: 'Hermani', lastName: 'Tester' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'teste@whatsappfin.com',
      phone: '+55 11 99999-9999',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as User;

    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
    set({ user: mockUser, session: null, loading: false });
  },

  signOut: async () => {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    try {
      await supabase.auth.signOut();
    } catch {}
    set({ user: null, session: null, loading: false });
  },
}));

// Listener global único do Supabase Auth
if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data: { session } }) => {
    const savedMock = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!savedMock) {
      useAuthStore.setState({
        session: session ?? null,
        user: session?.user ?? null,
        loading: false,
      });
    } else {
      useAuthStore.setState({ loading: false });
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    const savedMock = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!savedMock) {
      useAuthStore.setState({
        session: session ?? null,
        user: session?.user ?? null,
        loading: false,
      });
    }
  });
}

export function useAuth() {
  return useAuthStore();
}
