import { Bell, Menu, Search, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export default function Topbar({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) {
  const [isDark, setIsDark] = useState(() => {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    if (prefersDark) document.documentElement.classList.add('dark');
    return prefersDark;
  });


  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-30 h-20 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-transparent">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2.5 w-80 shadow-sm transition-shadow focus-within:shadow-md focus-within:border-green-500/50">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar transações, comprovantes..." 
            className="bg-transparent border-none outline-none w-full text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-full text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="relative p-2.5 rounded-full text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-4 ring-slate-50 dark:ring-slate-900" />
        </button>
      </div>
    </header>
  );
}
