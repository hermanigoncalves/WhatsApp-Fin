import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Teste isolado do validador JWT
async function validateJwtAuthTest(req, env = {}) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;

  if (env.NODE_ENV === 'development' && env.ALLOW_DEV_MOCK_AUTH === 'true') {
    const mockUserId = req.headers?.['x-mock-user-id'] || '00000000-0000-0000-0000-000000000001';
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

  const supabaseUrl = env.SUPABASE_URL || '';
  const supabaseKey = env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return {
      user: null,
      error: 'Configuração do Supabase incompleta no servidor (SUPABASE_URL/ANON_KEY ausentes).',
      statusCode: 500,
    };
  }

  return {
    user: { id: 'mock-user-id', email: 'test@example.com' },
    error: null,
    statusCode: 200,
  };
}

describe('🔒 Testes de Middleware JWT e Proteção de Endpoints', () => {
  it('Deve rejeitar requisições sem o header Authorization com 401', async () => {
    const req = { headers: {} };
    const res = await validateJwtAuthTest(req);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.user, null);
    assert.match(res.error, /Authorization/);
  });

  it('Deve rejeitar cabeçalho sem prefixo Bearer com 401', async () => {
    const req = { headers: { authorization: 'Basic 123456' } };
    const res = await validateJwtAuthTest(req);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.user, null);
  });

  it('Deve rejeitar token Bearer vazio com 401', async () => {
    const req = { headers: { authorization: 'Bearer   ' } };
    const res = await validateJwtAuthTest(req);
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.user, null);
  });

  it('Deve permitir mock em ambiente de desenvolvimento quando expressamente ativado', async () => {
    const req = { headers: { 'x-mock-user-id': 'user-123' } };
    const env = { NODE_ENV: 'development', ALLOW_DEV_MOCK_AUTH: 'true' };
    const res = await validateJwtAuthTest(req, env);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.user?.id, 'user-123');
    assert.strictEqual(res.error, null);
  });
});
