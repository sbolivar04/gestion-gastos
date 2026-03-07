import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import {
  LayoutDashboard,
  History,
  Wallet,
  PiggyBank
} from 'lucide-react';
import './index.css';

// Importar Vistas
import LoginForm from './vistas/LoginForm';
import Dashboard from './vistas/Dashboard';
import HistoricoGastos from './vistas/HistoricoGastos';
import ControlDeudas from './vistas/ControlDeudas';
import GestionIngresos from './vistas/GestionIngresos';
import MenuUsuario from './componentes/MenuUsuario';

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setPerfil(data);
    } catch (err) {
      console.error('Error cargando perfil:', err);
    }
  };

  useEffect(() => {
    // 1. Carga inicial rápida
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchPerfil(currentUser.id);
      setLoading(false);
    });

    // 2. Suscripción a cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchPerfil(currentUser.id);
      else setPerfil(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Suscripción en tiempo real para el perfil
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`perfil_cambios_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perfiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          setPerfil(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
      <header className="header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Wallet size={18} />
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text)' }}>Gestión Gastos</h1>
          </div>

          <MenuUsuario
            user={user}
            perfil={perfil}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            onLogout={handleLogout}
          />
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          {activeTab === 'dashboard' && <Dashboard user={user} perfil={perfil} />}
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
