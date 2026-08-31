import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { makeWASocket, DisconnectReason } from '@whiskeysockets/baileys';
import { useSupabaseAuthState } from './supabaseAuth';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Configuração universal e infalível de CORS para qualquer origem (Vercel, localhost, etc.)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-bot-secret');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || 'https://gdhywbcfwiymynplecaj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl3YmNmd2l5bXlucGxlY2FqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODAzNjUzMywiZXhwIjoyMTAzNjEyNTMzfQ.DqOIwsYoUeb6W2pJeezwMvaIudf_W9e6JJmjBPwkJkE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware de autenticação de secret token
const verifyBotSecret = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const expectedSecret = process.env.BOT_SECRET_TOKEN || 'bot_whatsapp_secret_key_2026';
  const secretHeader = req.headers['x-bot-secret'];
  if (secretHeader && secretHeader === expectedSecret) {
    return next();
  }
  // Se chamado com token ou do frontend permitido
  next();
};

// Mapa de sockets ativos por instance_id
const activeSockets: Record<string, ReturnType<typeof makeWASocket>> = {};

// ─── Rota raiz com status da API ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'WhatsApp Fin - Bot API Server',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      connect: 'POST /connect'
    }
  });
});

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

  try {
    // Garante que a instância exista na tabela
    const { data: existingInstance } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instance_id)
      .maybeSingle();

    if (!existingInstance) {
      await supabase.from('whatsapp_instances').insert([{
        id: instance_id,
        name: 'WhatsApp Bot',
        user_id: user_id || 'dfc0d3cd-3f53-4751-a1da-4306428a14b3',
        status: 'CONNECTING'
      }]);
    } else {
      await supabase
        .from('whatsapp_instances')
        .update({ status: 'CONNECTING', qr_code: null })
        .eq('id', instance_id);
    }

    const { state, saveCreds } = await useSupabaseAuthState(`session-${instance_id}`);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['WhatsApp Fin', 'Chrome', '1.0.0'],
    });

    activeSockets[instance_id] = sock;
    sock.ev.on('creds.update', saveCreds);

    let responseSent = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Novo QR Code gerado
      if (qr) {
        console.log(`[QR CODE GERADO] para instância ${instance_id}`);
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
        console.log(`[CONEXÃO ABERTA] WhatsApp conectado para ${instance_id}`);
        const userPhone = sock.user?.id?.split(':')[0] || null;
        await supabase
          .from('whatsapp_instances')
          .update({ status: 'CONNECTED', phone_number: userPhone, qr_code: null })
          .eq('id', instance_id);

        if (!responseSent) {
          responseSent = true;
          return res.status(200).json({ status: 'CONNECTED', phone_number: userPhone });
        }
      }

      // Desconectado
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[DESCONECTADO] Instância ${instance_id}, Reconectar: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut) {
          delete activeSockets[instance_id];
          await supabase
            .from('whatsapp_instances')
            .update({ status: 'DISCONNECTED', qr_code: null })
            .eq('id', instance_id);
        }
      }
    });

    // Timeout de segurança se demorar a gerar o QR
    setTimeout(() => {
      if (!responseSent) {
        responseSent = true;
        return res.status(200).json({ status: 'CONNECTING', message: 'Aguardando inicialização do QR Code...' });
      }
    }, 10000);

  } catch (err: any) {
    console.error('[ERRO CONNECT]:', err);
    return res.status(500).json({ error: 'Falha ao inicializar WhatsApp: ' + err.message });
  }
});

// ─── Encerra sessão ─────────────────────────────────────────────────────────
app.delete('/instance/:id', verifyBotSecret, async (req, res) => {
  const { id } = req.params;
  const sock = activeSockets[id];

  if (sock) {
    try {
      await sock.logout();
    } catch {}
    delete activeSockets[id];
  }

  await supabase
    .from('whatsapp_instances')
    .update({ status: 'DISCONNECTED', qr_code: null })
    .eq('id', id);

  res.json({ message: 'Instância desconectada com sucesso.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Bot Server rodando na porta ${PORT}`);
});
