import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { makeWASocket, DisconnectReason } from '@whiskeysockets/baileys';
import { useSupabaseAuthState } from './supabaseAuth';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Configuração segura de CORS com allowlist
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://seu-app.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    // Permite chamadas sem origin (ex: server-to-server, curl) ou na allowlist
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por política CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bot-secret'],
}));

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Middleware de autenticação de secret token entre Vercel API e bot-server
const verifyBotSecret = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const expectedSecret = process.env.BOT_SECRET_TOKEN;
  if (!expectedSecret) {
    return next(); // Se não configurado em dev, permite continuar
  }
  const secretHeader = req.headers['x-bot-secret'];
  if (secretHeader !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: Token x-bot-secret inválido.' });
  }
  next();
};

// Mapa de sockets ativos por instance_id
const activeSockets: Record<string, ReturnType<typeof makeWASocket>> = {};

// ─── Rota de health-check ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    active_sessions: Object.keys(activeSockets).length,
    database_connected: !!supabase,
  });
});

// ─── Gera QR Code e conecta a instância ─────────────────────────────────────
app.post('/connect', verifyBotSecret, async (req, res) => {
  const { instance_id, user_id } = req.body;
  if (!instance_id) return res.status(400).json({ error: 'instance_id é obrigatório.' });

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase não configurado no bot-server.' });
  }

  // Evita duplicar conexão ativa
  if (activeSockets[instance_id]) {
    return res.status(200).json({ status: 'ALREADY_CONNECTING', message: 'Aguardando leitura do QR...' });
  }

  // Verifica se a instância existe
  let query = supabase.from('whatsapp_instances').select('*').eq('id', instance_id);
  if (user_id) {
    query = query.eq('user_id', user_id);
  }
  const { data: instance, error } = await query.single();

  if (error || !instance) {
    return res.status(404).json({ error: 'Instância não encontrada ou não autorizada.' });
  }

  await supabase
    .from('whatsapp_instances')
    .update({ status: 'CONNECTING', qr_code: null })
    .eq('id', instance_id);

  const { state, saveCreds } = await useSupabaseAuthState(`session-${instance_id}`);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ['WhatsApp Fin', 'Chrome', '1.0.0'],
  });

  activeSockets[instance_id] = sock;
  sock.ev.on('creds.update', saveCreds);

  let responseSent = false;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Novo QR Code gerado
    if (qr) {
      await supabase
        .from('whatsapp_instances')
        .update({ qr_code: qr, status: 'QR_CODE_READY' })
        .eq('id', instance_id);

      if (!responseSent) {
        responseSent = true;
        return res.status(200).json({ status: 'QR_CODE_READY', qr });
      }
    }

    // Conectado com sucesso
    if (connection === 'open') {
      await supabase
        .from('whatsapp_instances')
        .update({ status: 'CONNECTED', qr_code: null })
        .eq('id', instance_id);

      if (!responseSent) {
        responseSent = true;
        return res.status(200).json({ status: 'CONNECTED' });
      }
    }

    // Desconectado
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;

      if (!shouldReconnect) {
        await supabase
          .from('whatsapp_instances')
          .update({ status: 'DISCONNECTED', qr_code: null })
          .eq('id', instance_id);
        delete activeSockets[instance_id];
      }

      if (!responseSent) {
        responseSent = true;
        return res.status(200).json({ status: 'DISCONNECTED', shouldReconnect });
      }
    }
  });

  // Timeout de segurança: 45s
  setTimeout(() => {
    if (!responseSent) {
      responseSent = true;
      res.status(202).json({ status: 'PENDING', message: 'Aguardando geração do QR...' });
    }
  }, 45000);
});

// ─── Deleta instância e encerra socket ───────────────────────────────────────
app.delete('/instance/:id', verifyBotSecret, async (req, res) => {
  const { id } = req.params;

  const sock = activeSockets[id];
  if (sock) {
    try { await sock.logout(); } catch {}
    delete activeSockets[id];
  }

  if (supabase) {
    await supabase.from('whatsapp_instances').update({ status: 'DISCONNECTED' }).eq('id', id);
    await supabase.from('whatsapp_sessions').delete().like('session_id', `session-${id}%`);
  }

  res.json({ status: 'deleted' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 WhatsApp Bot Server rodando na porta ${PORT}`);
});
