import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Plus, WifiOff, Trash2, Smartphone, QrCode } from 'lucide-react';

type Instance = {
  id: string;
  name: string;
  phone_number: string | null;
  status: 'DISCONNECTED' | 'QR_CODE_READY' | 'CONNECTED' | 'CONNECTING';
  qr_code: string | null;
};

export default function WhatsAppInstances() {
  const { user } = useAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentQr, setCurrentQr] = useState<string | null>(null);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);

  useEffect(() => {
    fetchInstances();
    
    // Subscribe to changes in realtime
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_instances' },
        (_payload) => {
          fetchInstances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Polling for QR Code when connecting
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeInstanceId && qrModalOpen) {
      interval = setInterval(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const headers: Record<string, string> = {};
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          } else if (user?.id === 'demo-test-user') {
            headers['Authorization'] = 'Bearer demo-test-user';
          }

          const res = await fetch(`/api/whatsapp/instances/status?instance_id=${activeInstanceId}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'CONNECTED') {
              setQrModalOpen(false);
              setCurrentQr(null);
              fetchInstances();
            } else if (data.status === 'QR_CODE_READY' && data.qr_code) {
              setCurrentQr(data.qr_code);
            }
          }
        } catch (err) {
          console.warn('Erro ao checar status:', err);
        }
      }, 5000); // Pool every 5s
    }
    return () => clearInterval(interval);
  }, [activeInstanceId, qrModalOpen]);

  const fetchInstances = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setInstances(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim() || !user) return;
    
    const { error } = await supabase
      .from('whatsapp_instances')
      .insert([{ name: newInstanceName, user_id: user.id, status: 'DISCONNECTED' }]);
    
    if (!error) {
      setIsCreateOpen(false);
      setNewInstanceName('');
      fetchInstances();
    } else {
      console.error("Erro no Supabase:", error);
      alert("Erro ao criar conexão: " + error.message);
    }
  };

  const handleConnect = async (id: string) => {
    setActiveInstanceId(id);
    setQrModalOpen(true);
    setCurrentQr(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else if (user?.id === 'demo-test-user') {
        headers['Authorization'] = 'Bearer demo-test-user';
      }

      const res = await fetch('/api/whatsapp/instances/connect', {
        method: 'POST',
        headers,
        body: JSON.stringify({ instance_id: id }),
      });

      const data = await res.json();

      if (data.status === 'NEEDS_SERVER') {
        setQrModalOpen(false);
        alert('⚠️ Para gerar o QR Code, é necessário um servidor dedicado (bot-server) rodando.\n\nSiga as instruções no arquivo bot-server/README.md para implantá-lo no Railway ou Render.');
        return;
      }

      if (data.status === 'QR_CODE_READY' && data.qr) {
        setCurrentQr(data.qr);
      } else if (data.status === 'CONNECTED') {
        setQrModalOpen(false);
        fetchInstances();
      }
    } catch (e) {
      console.error('Erro de conexão:', e);
      setQrModalOpen(false);
      alert('Erro ao conectar com o servidor. Verifique as variáveis de ambiente na Vercel.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta conexão?')) return;
    
    const { error } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Erro ao excluir:", error);
    } else {
      fetchInstances();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">WhatsApp Automations</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Conecte seu WhatsApp para processar e extrair seus comprovantes automaticamente.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus size={20} />
          Nova Conexão
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse flex gap-4 flex-wrap">
          <div className="h-48 w-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      ) : instances.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <Smartphone size={32} />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Sem Instâncias</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">
            Você ainda não conectou nenhum número de WhatsApp. Crie uma conexão e leia o QR code com seu celular.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map((instance) => (
            <div key={instance.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${instance.status === 'CONNECTED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                     <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{instance.name}</h3>
                    <p className="text-sm text-slate-500">{instance.phone_number || 'Sem número'}</p>
                  </div>
                </div>
                
                {instance.status === 'CONNECTED' ? (
                   <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                     Conectado
                   </span>
                ) : instance.status === 'CONNECTING' ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                     <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                     Iniciando
                   </span>
                ) : (
                   <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium">
                     <WifiOff size={12} /> Desconectado
                   </span>
                )}
              </div>
              
              <div className="mt-auto pt-6 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                {instance.status !== 'CONNECTED' && ( // CONNECTING as well so we can jump to QR
                  <button 
                    onClick={() => handleConnect(instance.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <QrCode size={16} /> Ler QR Code
                  </button>
                )}
                
                <button 
                  onClick={() => handleDelete(instance.id)}
                  className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  title="Excluir Conexão"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE INSTANCE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Nova Conexão</h2>
              <form onSubmit={handleCreate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome de Identificação</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="Ex: Celular Pessoal"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:dark:bg-slate-700 text-slate-900 dark:text-white py-3 rounded-xl font-medium transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors">Criar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 text-center p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Conectar WhatsApp</h2>
            <p className="text-slate-500 text-sm mb-8">Aponte a câmera do seu WhatsApp (Aparelhos Conectados) para este código.</p>
            
            <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 mx-auto w-64 h-64 border border-slate-200 dark:border-slate-700">
               {currentQr ? (
                 <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-center">
                   <img
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentQr)}`}
                     alt="QR Code WhatsApp"
                     width={200}
                     height={200}
                     className="rounded-lg"
                   />
                 </div>
               ) : (
                 <div className="flex flex-col items-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <span className="text-sm font-medium">Gerando token...</span>
                 </div>
               )}
            </div>
            
            <button 
                onClick={() => setQrModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium py-2 px-4 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
