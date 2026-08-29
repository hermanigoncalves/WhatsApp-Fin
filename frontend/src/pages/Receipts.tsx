import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../components/ui';
import { useState } from 'react';

export default function Receipts() {
  const [dragActive, setDragActive] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  // Mock handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploaded(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Scanner de Comprovantes com IA</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Faça upload de fotos de comprovantes e deixe a IA extrair os dados.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Zone */}
        <Card className="h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>Área de Upload</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6 pt-0">
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-all duration-300 ${
                dragActive 
                  ? "border-green-500 bg-green-50 dark:bg-green-500/10" 
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-4 group-hover:text-green-500 transition-colors">
                <UploadCloud size={32} />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300 text-lg">Arraste e solte seu comprovante</p>
              <p className="text-sm text-slate-500 mt-2 mb-6 text-center max-w-[250px]">
                Suporta JPEG, PNG e PDF (máx 5MB).
              </p>
              <Button onClick={() => setUploaded(true)}>
                Procurar Arquivos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Extraction Results (Mock State) */}
        <Card className="h-[400px] flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resultado da Extração</CardTitle>
              {uploaded && <Badge variant="default" className="bg-green-500 text-white">IA Concluída</Badge>}
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-6 pt-0 overflow-y-auto">
            {!uploaded ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} className="opacity-20 mb-4" />
                <p>Nenhum comprovante processado ainda.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="p-4 rounded-lg bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-start gap-3 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                  <div className="text-sm">
                    <p className="font-semibold">Extração bem-sucedida</p>
                    <p className="opacity-80">Por favor, revise os dados antes de salvar.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Estabelecimento</label>
                    <input type="text" defaultValue="Restaurante Saboroso" className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Data</label>
                      <input type="date" defaultValue="2024-03-04" className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Valor Total</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                        <input type="text" defaultValue="180,00" className="w-full pl-8 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      Categoria Sugerida
                      <AlertCircle size={12} className="text-blue-500" />
                    </label>
                    <select className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-green-500 outline-none">
                      <option>Alimentação</option>
                      <option>Transporte</option>
                      <option>Serviços</option>
                      <option>Equipamentos</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setUploaded(false)}>Descartar</Button>
                  <Button className="flex-1">Salvar Transação</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
