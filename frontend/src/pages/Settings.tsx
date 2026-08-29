import { useState, useRef } from 'react';
import { User, Smartphone, Bell, Shield, Check, Copy, ExternalLink, Zap, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui';
import { useStore } from '../store/useStore';
import { cn } from '../components/ui';

type Tab = 'profile' | 'whatsapp' | 'notifications' | 'security';

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile',       label: 'Perfil',               icon: User        },
  { id: 'whatsapp',      label: 'Integração WhatsApp',  icon: Smartphone  },
  { id: 'notifications', label: 'Notificações',          icon: Bell        },
  { id: 'security',      label: 'Segurança',             icon: Shield      },
];

export default function Settings() {
  const { userSettings, updateSettings } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saved, setSaved] = useState(false);
  const [webhookTested, setWebhookTested] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state (synced on save)
  const [form, setForm] = useState({ ...userSettings });
  const patch = (key: keyof typeof form, value: string | boolean | number) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      patch('avatarUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const testWebhook = async () => {
    if (!form.n8nWebhookUrl) return;
    setWebhookTested('testing');
    try {
      await fetch(form.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test', source: 'WhatsApp Fin', message: 'Conexão testada com sucesso!' }),
      });
      setWebhookTested('ok');
    } catch {
      setWebhookTested('error');
    }
    setTimeout(() => setWebhookTested('idle'), 4000);
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(form.n8nWebhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Configurações</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as preferências da sua conta e integrações.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr] items-start">
        {/* Sidebar nav */}
        <Card className="sticky top-6">
          <div className="p-2 space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                  activeTab === tab.id
                    ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-green-500' : ''} />
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* --- Perfil --- */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar upload */}
              <div className="flex items-center gap-5">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {form.avatarUrl ? (
                    <img
                      src={form.avatarUrl}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-white dark:border-slate-900"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-white dark:border-slate-900">
                      {(form.firstName[0] || '?').toUpperCase()}{(form.lastName[0] || '').toUpperCase()}
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-900 dark:text-white">{form.firstName} {form.lastName}</p>
                  <p className="text-sm text-slate-500">{form.email}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                    >
                      Mudar foto
                    </button>
                    {form.avatarUrl && (
                      <>
                        <span className="text-slate-300">·</span>
                        <button
                          onClick={() => patch('avatarUrl', '')}
                          className="text-xs text-red-500 hover:underline font-medium"
                        >
                          Remover
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome</label>
                  <input type="text" value={form.firstName} onChange={e => patch('firstName', e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sobrenome</label>
                  <input type="text" value={form.lastName} onChange={e => patch('lastName', e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
                  <input type="email" value={form.email} onChange={e => patch('email', e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone / WhatsApp</label>
                  <input type="tel" value={form.phone} onChange={e => patch('phone', e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> Salvo!</span>}
                <Button onClick={handleSave}>Salvar Alterações</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- WhatsApp + n8n --- */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap size={18} className="text-green-500" />
                  Webhook n8n
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Cole aqui a URL do webhook do seu fluxo n8n. O app enviará as transações e comandos do WhatsApp para este endpoint.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">URL do Webhook n8n</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={form.n8nWebhookUrl}
                      onChange={e => patch('n8nWebhookUrl', e.target.value)}
                      placeholder="https://seu-n8n.app.n8n.cloud/webhook/..."
                      className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none font-mono"
                    />
                    {form.n8nWebhookUrl && (
                      <button onClick={copyWebhook} title="Copiar" className="px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500">
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={testWebhook}
                    variant="outline"
                    disabled={!form.n8nWebhookUrl || webhookTested === 'testing'}
                  >
                    {webhookTested === 'testing' ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /> Testando...</span>
                    ) : webhookTested === 'ok' ? (
                      <span className="flex items-center gap-2 text-green-600"><Check size={16} /> Conexão OK!</span>
                    ) : webhookTested === 'error' ? (
                      <span className="text-red-500">Falha na conexão</span>
                    ) : (
                      'Testar Conexão'
                    )}
                  </Button>
                  <Button onClick={handleSave}>Salvar</Button>
                </div>

                {/* How-to guide */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Como configurar no n8n</p>
                  <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
                    <li>No n8n, crie um novo fluxo e adicione o nó <strong>Webhook</strong></li>
                    <li>Defina o método como <strong>POST</strong> e copie a URL gerada</li>
                    <li>Cole a URL acima e clique em <strong>Testar Conexão</strong></li>
                    <li>Adicione nós para processar os dados: tipo, valor, descrição, conta</li>
                    <li>Conecte ao nó <strong>WhatsApp</strong> (Evolution API, Z-API, ou similar) para enviar respostas</li>
                  </ol>
                  <a
                    href="https://n8n.io/integrations/webhook/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline mt-1"
                  >
                    Documentação n8n Webhook <ExternalLink size={12} />
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone size={18} className="text-green-500" />
                  Número Vinculado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Número WhatsApp</label>
                  <input type="tel" value={form.phone} onChange={e => patch('phone', e.target.value)}
                    placeholder="+55 11 99999-9999"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  <p className="text-xs text-slate-500">Este número será usado para enviar e receber mensagens via n8n.</p>
                </div>
                <div className="flex justify-end">
                  {saved && <span className="text-sm text-green-600 flex items-center gap-1 mr-3"><Check size={14} /> Salvo!</span>}
                  <Button onClick={handleSave}>Salvar</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* --- Notificações --- */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Controle quais alertas são enviados via WhatsApp pelo n8n e defina os limites de cada um.</p>
            </CardHeader>
            <CardContent className="space-y-3">

              {/* Saldo baixo */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Saldo baixo</p>
                    <p className="text-xs text-slate-500 mt-0.5">Alerta quando qualquer conta ficar abaixo do limite definido</p>
                  </div>
                  <button
                    onClick={() => patch('notifyLowBalance', !form.notifyLowBalance)}
                    className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none', form.notifyLowBalance ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600')}
                  >
                    <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200', form.notifyLowBalance ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>
                {form.notifyLowBalance && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <label className="text-xs text-slate-500 shrink-0">Limite mínimo:</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">R$</span>
                      <input
                        type="number" min="0" step="50"
                        value={form.lowBalanceThreshold}
                        onChange={e => patch('lowBalanceThreshold', Number(e.target.value))}
                        className="w-28 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Orçamento */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Orçamento estourando</p>
                    <p className="text-xs text-slate-500 mt-0.5">Aviso quando uma categoria atingir o percentual definido do limite mensal</p>
                  </div>
                  <button
                    onClick={() => patch('notifyBudgetAlert', !form.notifyBudgetAlert)}
                    className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none', form.notifyBudgetAlert ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600')}
                  >
                    <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200', form.notifyBudgetAlert ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>
                {form.notifyBudgetAlert && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <label className="text-xs text-slate-500 shrink-0">Alertar a partir de:</label>
                    <input
                      type="number" min="1" max="100" step="5"
                      value={form.budgetAlertPercentage}
                      onChange={e => patch('budgetAlertPercentage', Number(e.target.value))}
                      className="w-20 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none"
                    />
                    <span className="text-xs text-slate-500">% do orçamento</span>
                  </div>
                )}
              </div>

              {/* Contas a vencer */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Contas a vencer</p>
                    <p className="text-xs text-slate-500 mt-0.5">Lembrete de transações fixas com vencimento próximo</p>
                  </div>
                  <button
                    onClick={() => patch('notifyFixedDue', !form.notifyFixedDue)}
                    className={cn('relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none', form.notifyFixedDue ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600')}
                  >
                    <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200', form.notifyFixedDue ? 'translate-x-5' : 'translate-x-0')} />
                  </button>
                </div>
                {form.notifyFixedDue && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <label className="text-xs text-slate-500 shrink-0">Alertar com:</label>
                    <input
                      type="number" min="1" max="30" step="1"
                      value={form.fixedDueDays}
                      onChange={e => patch('fixedDueDays', Number(e.target.value))}
                      className="w-20 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none"
                    />
                    <span className="text-xs text-slate-500">dias de antecedência</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} /> Salvo!</span>}
                <Button onClick={handleSave}>Salvar Preferências</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* --- Segurança --- */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 text-sm text-amber-700 dark:text-amber-400">
                ⚠️ Nunca compartilhe sua URL de webhook publicamente. Qualquer pessoa com acesso pode enviar dados ao sistema.
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Limpar todos os dados locais</label>
                <p className="text-xs text-slate-500">Remove todas as transações, contas e configurações do localStorage.</p>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (window.confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
                      localStorage.removeItem('finance-store');
                      window.location.reload();
                    }
                  }}
                >
                  Limpar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
