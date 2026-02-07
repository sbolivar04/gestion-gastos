import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import {
  LayoutDashboard,
  History,
  Wallet,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import './index.css';

// Importar Vistas
import LoginForm from './vistas/LoginForm';
import Dashboard from './vistas/Dashboard';
import HistoricoGastos from './vistas/HistoricoGastos';
import ControlDeudas from './vistas/ControlDeudas';
import GestionIngresos from './vistas/GestionIngresos';
import { PiggyBank } from 'lucide-react';

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (!user) return <LoginForm />;

  return (
    <div className="app-shell">
      <header className="header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="nexus-logo-container">
              <svg viewBox="0 0 100 100" className="nexus-logo-svg" width="34" height="34">
                <defs>
                  <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path d="M50 15 L85 50 L50 85 L15 50 Z" fill="none" stroke="url(#logo-grad)" strokeWidth="8" strokeLinejoin="round" />
                <path d="M50 35 L65 50 L50 65 L35 50 Z" fill="url(#logo-grad)" />
                <circle cx="50" cy="50" r="5" fill="white" opacity="0.8" />
              </svg>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.04em', fontFamily: 'Outfit, sans-serif' }}>Gestión Gastos</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ padding: '8px', color: 'var(--text-muted)' }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '8px', color: 'var(--danger)' }}
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          {activeTab === 'dashboard' && <Dashboard user={user} />}
          {activeTab === 'gastos' && <HistoricoGastos />}
          {activeTab === 'deudas' && <ControlDeudas />}
          {activeTab === 'presupuesto' && <GestionIngresos user={user} />}
        </div>
      </main>

      <nav className="nav-bottom">
        <div className="container" style={{ display: 'flex' }}>
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={24} className="nav-icon" />
            <span>Resumen</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'gastos' ? 'active' : ''}`}
            onClick={() => setActiveTab('gastos')}
          >
            <History size={24} className="nav-icon" />
            <span>Gastos</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'deudas' ? 'active' : ''}`}
            onClick={() => setActiveTab('deudas')}
          >
            <Wallet size={24} className="nav-icon" />
            <span>Deudas</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'presupuesto' ? 'active' : ''}`}
            onClick={() => setActiveTab('presupuesto')}
          >
            <PiggyBank size={24} className="nav-icon" />
            <span>Presupuesto</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
