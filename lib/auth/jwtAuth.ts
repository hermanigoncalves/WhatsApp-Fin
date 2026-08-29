import { createClient } from '@supabase/supabase-js';

export interface AuthResult {
  user: { id: string; email?: string } | null;
  error: string | null;
  statusCode: number;
}

/**
 * Valida o token JWT no cabeçalho Authorization da requisição Serverless.
 * Garante que apenas usuários autenticados acessem os endpoints de API.
 */
export async function validateJwtAuth(req: any): Promise<AuthResult> {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;

  // Modo seguro de desenvolvimento local (somente se explicitamente ativado para testes)
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_MOCK_AUTH === 'true') {
    const mockUserId = req.headers['x-mock-user-id'] || '00000000-0000-0000-0000-000000000001';
    return {
      user: { id: mockUserId, email: 'dev@local.test' },
      error: null,
      statusCode: 200,
    };
  }

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: 'Unauthorized: Cabeçalho Authorization com token Bearer é obrigatório.',
      statusCode: 401,
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      user: null,
      error: 'Unauthorized: Token Bearer vazio.',
      statusCode: 401,
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return {
      user: null,
      error: 'Configuração do Supabase incompleta no servidor (SUPABASE_URL/ANON_KEY ausentes).',
      statusCode: 500,
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        user: null,
        error: `Unauthorized: Token inválido ou expirado (${error?.message || 'usuário não encontrado'}).`,
        statusCode: 401,
      };
    }

    return {
      user: { id: user.id, email: user.email },
      error: null,
      statusCode: 200,
    };
  } catch (err: any) {
    return {
      user: null,
      error: `Internal Auth Error: ${err.message}`,
      statusCode: 500,
    };
  }
}
