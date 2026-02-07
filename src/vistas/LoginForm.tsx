import { useState } from 'react';
import { supabase } from '../lib/supabase';
// Eliminado Receipt


const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const emailFalso = `${username.toLowerCase()}@gestion.gastos`;
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: emailFalso, password });
        if (loginError) setError('Credenciales incorrectas');
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '24px', background: 'var(--bg)' }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: '360px', padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '24px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08)', padding: '12px' }}>
                        <img src="/logo-nexus.svg" alt="Nexus Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Bienvenido</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Controla tus gastos con facilidad</p>
                </div>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Tu usuario"
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)', outline: 'none', background: 'var(--bg)', color: 'var(--text)', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)', outline: 'none', background: 'var(--bg)', color: 'var(--text)', transition: 'border-color 0.2s' }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>
                    {error && <p style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
                    <button type="submit" className="btn-pill btn-pill-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                        {loading ? 'Cargando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
