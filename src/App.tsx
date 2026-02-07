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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Wallet size={18} />
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>Gestión Gastos</h1>
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
