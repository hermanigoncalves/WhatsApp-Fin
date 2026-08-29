import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { signIn, signUp, signInAsTestUser } = useAuth();
  const [mode, setMode]       = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);
      if (error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center shadow-xl shadow-green-900/40">
            <span className="text-white font-bold text-3xl leading-none">W</span>
          </div>
          <h1 className="text-2xl font-bold text-white">WhatsApp Fin</h1>
          <p className="text-slate-400 text-sm">Controle financeiro inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-5">
            {mode === 'signin' ? 'Entrar na conta' : 'Criar conta'}
          </h2>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-300 font-medium">E-mail</label>
              <input
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-slate-300 font-medium">Senha</label>
              <input
                type="password" required minLength={6}
                value={password} onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-green-500 hover:bg-green-400 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/30 cursor-pointer"
            >
              {loading ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-850 px-2 text-slate-400 bg-slate-900/90 rounded">ou para testar</span>
            </div>
          </div>

          {/* Botão de Usuário Teste */}
          <button
            type="button"
            onClick={() => signInAsTestUser()}
            className="w-full py-2.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-100 font-medium text-sm border border-white/10 transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>Acessar com Usuário Teste (1 Clique)</span>
          </button>

          <p className="text-center text-sm text-slate-400 mt-5">
            {mode === 'signin' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-green-400 hover:text-green-300 font-medium cursor-pointer"
            >
              {mode === 'signin' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>

        {mode === 'signup' && (
          <p className="text-center text-xs text-slate-500 mt-4">
            Após cadastro, verifique seu e-mail para confirmar a conta.
          </p>
        )}
      </div>
    </div>
  );
}
