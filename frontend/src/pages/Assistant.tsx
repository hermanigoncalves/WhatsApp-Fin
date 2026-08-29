import { MessageCircle, Send, PlusCircle, Paperclip } from 'lucide-react';
import { Card, CardContent } from '../components/ui';

const messages = [
  { id: 1, text: 'Olá! Acabei de enviar o comprovante do Uber de hoje.', sender: 'user', time: '10:45 AM' },
  { id: 2, text: 'Processando seu comprovante...', sender: 'ai', time: '10:45 AM', isProcessing: true },
  { id: 3, text: 'Pronto! Registrei uma despesa de R$ 32,50 como "Transporte" na conta Nubank.', sender: 'ai', time: '10:46 AM' },
  { id: 4, text: 'Você gastou muito com Transporte esta semana. Quer ver um relatório?', sender: 'ai', time: '10:46 AM' },
];

export default function Assistant() {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col sm:flex-row gap-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Side info panel */}
      <div className="w-full sm:w-80 flex flex-col gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Assistente WhatsApp</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Interaja com seu Agente de IA Financeira em tempo real.</p>
        </div>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-700 text-white border-none shadow-lg shadow-green-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Agente Online</h3>
                <p className="text-green-100 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                  Ouvindo WhatsApp
                </p>
              </div>
            </div>
            <p className="text-sm text-green-50 leading-relaxed">
              O modelo de IA está ativo e monitorando seu número conectado. Envie uma mensagem pelo WhatsApp ou teste a interação aqui.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm relative">
        
        {/* Chat header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner font-bold text-slate-700 dark:text-slate-300">
              🤖
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Agente Financeiro</h2>
              <p className="text-xs text-slate-500 font-medium">Lembre-se: Sou uma IA, confira os lançamentos.</p>
            </div>
          </div>
        </div>

        {/* Message history */}
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30 dark:bg-[#0B1120]/50 relative">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] sm:max-w-[60%] rounded-2xl p-4 shadow-sm relative group ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
              }`}>
                {msg.isProcessing ? (
                  <div className="flex items-center gap-2 text-slate-500 italic">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    </div>
                    {msg.text}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                )}
                <span className={`text-[10px] mt-2 block opacity-0 group-hover:opacity-100 transition-opacity ${
                  msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                }`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </CardContent>

        {/* Input area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 z-10">
          <div className="flex items-center gap-2 max-w-4xl mx-auto bg-slate-100 dark:bg-slate-800 rounded-full pr-2 pl-4 py-2 border border-transparent focus-within:border-green-500/50 focus-within:ring-4 focus-within:ring-green-500/10 transition-all">
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2">
              <PlusCircle size={20} />
            </button>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Digite uma mensagem para testar a IA..." 
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-100 px-2 placeholder:text-slate-500"
            />
            <button className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 shrink-0">
              <Send size={18} className="translate-x-0.5" />
            </button>
          </div>
        </div>

      </Card>
    </div>
  );
}
