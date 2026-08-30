import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  Receipt, 
  MessageCircle, 
  BarChart3, 
  Settings,
  X,
  Calendar,
  Target,
  CreditCard,
} from 'lucide-react';
import { cn } from '../components/ui';
import { useStore } from '../store/useStore';

const navItems = [
  { name: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard },
  { name: 'Contas',       path: '/accounts',     icon: Wallet          },
  { name: 'Cartões',      path: '/credit-cards', icon: CreditCard      },
  { name: 'Transações',   path: '/transactions', icon: ArrowLeftRight  },
  { name: 'Recorrentes',  path: '/fixed',        icon: Calendar        },
  { name: 'Orçamento',    path: '/budget',       icon: Target          },
  { name: 'Objetivos',    path: '/goals',        icon: Target          },
  { name: 'Comprovantes', path: '/receipts',     icon: Receipt         },
  { name: 'Assistente',   path: '/assistant',    icon: MessageCircle   },
  { name: 'WhatsApp Bot', path: '/whatsapp',     icon: MessageCircle   },
  { name: 'Relatórios',   path: '/reports',      icon: BarChart3       },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const { userSettings } = useStore();
  const fullName = [userSettings.firstName, userSettings.lastName].filter(Boolean).join(' ') || 'Usuário';
  const initials = ((userSettings.firstName[0] || '') + (userSettings.lastName[0] || '')).toUpperCase() || '?';

  return (
    <>
      <div className={cn(
        "fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsOpen(false)} />
      
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">W</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              WhatsApp Fin
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                )
              }
            >
              <item.icon size={20} className="shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="p-4 mt-auto">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )
            }
          >
            <Settings size={20} />
            Configurações
          </NavLink>
          
          <div className="mt-6 px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-slate-700 shadow">
                {userSettings.avatarUrl ? (
                  <img src={userSettings.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{fullName}</p>
                <p className="text-xs text-slate-500 truncate">{userSettings.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
