import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from './hooks/useAuth';
import { useSyncSupabase } from './lib/supabaseService';
import LoginPage from './pages/Login';

const Dashboard         = lazy(() => import('./pages/Dashboard'));
const Accounts          = lazy(() => import('./pages/Accounts'));
const Transactions      = lazy(() => import('./pages/Transactions'));
const FixedTransactions = lazy(() => import('./pages/FixedTransactions'));
const Receipts          = lazy(() => import('./pages/Receipts'));
const Assistant         = lazy(() => import('./pages/Assistant'));
const Reports           = lazy(() => import('./pages/Reports'));
const Settings          = lazy(() => import('./pages/Settings'));
const Budget            = lazy(() => import('./pages/Budget'));
const SavingsGoals      = lazy(() => import('./pages/SavingsGoals'));
const WhatsAppInstances = lazy(() => import('./pages/WhatsAppInstances'));
const CreditCards       = lazy(() => import('./pages/CreditCards'));
const OpenFinance       = lazy(() => import('./pages/OpenFinance'));

const Spinner = () => (
  <div className="flex items-center justify-center h-screen bg-slate-900">
    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const S = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  }>
    {children}
  </Suspense>
);

// Inner component so hooks run inside BrowserRouter
function AuthGate() {
  const { user, loading: authLoading } = useAuth();
  const { loading: syncLoading }       = useSyncSupabase(user?.id ?? null);

  // Still checking if user is logged in
  if (authLoading) return <Spinner />;

  // Not authenticated — show login
  if (!user) return <LoginPage />;

  // Authenticated but still loading data from Supabase
  if (syncLoading) return <Spinner />;

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"    element={<S><Dashboard /></S>} />
        <Route path="accounts"     element={<S><Accounts /></S>} />
        <Route path="open-finance" element={<S><OpenFinance /></S>} />
        <Route path="transactions" element={<S><Transactions /></S>} />
        <Route path="fixed"        element={<S><FixedTransactions /></S>} />
        <Route path="budget"       element={<S><Budget /></S>} />
        <Route path="goals"        element={<S><SavingsGoals /></S>} />
        <Route path="receipts"     element={<S><Receipts /></S>} />
        <Route path="assistant"    element={<S><Assistant /></S>} />
        <Route path="whatsapp"      element={<S><WhatsAppInstances /></S>} />
        <Route path="credit-cards"  element={<S><CreditCards /></S>} />
        <Route path="reports"      element={<S><Reports /></S>} />
        <Route path="settings"     element={<S><Settings /></S>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  );
}

export default App;
