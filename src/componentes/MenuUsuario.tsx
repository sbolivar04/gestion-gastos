import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import {
    UserCircle2,
    Moon,
    Sun,
    LogOut,
    ChevronDown,
    X,
    AlertCircle,
    Copy,
    Check,
    Save,
    Pencil,
    Eye,
    EyeOff,
    Lock
} from 'lucide-react';
import { formatearNombreMostrar } from '../utilidades/formato';

interface MenuUsuarioProps {
    user: any;
    perfil: any;
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onLogout: () => void;
}

const MenuUsuario = ({ user, perfil, isDarkMode, onToggleTheme, onLogout }: MenuUsuarioProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Estados para Perfil
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState(perfil?.nombre_completo || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Nuevos estados para el rediseño
    const [isEditingName, setIsEditingName] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        if (perfil?.nombre_completo) {
            setFullName(perfil.nombre_completo);
        }
    }, [perfil]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            // Normalizar Nombre: Trim y Capitalize de cada palabra
            const normalizarNombre = (str: string) => {
                return str
                    .trim()
                    .toLowerCase()
                    .split(/\s+/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            };

            const nombreLimpio = normalizarNombre(fullName.trim());

            // Actualizar nombre en tabla perfiles
            if (nombreLimpio !== perfil?.nombre_completo) {
                const { error: perfilError } = await supabase
                    .from('perfiles')
                    .update({ nombre_completo: nombreLimpio })
                    .eq('id', user.id);

                if (perfilError) throw perfilError;
                setFullName(nombreLimpio); // Actualizar estado local con el nombre normalizado
            }

            // Actualizar contraseña si se ingresó algo
            const cleanPass = newPassword.trim();
            const cleanConfirm = confirmPassword.trim();

            if (cleanPass) {
                if (cleanPass !== cleanConfirm) {
                    throw new Error('Las contraseñas no coinciden');
                }
                if (cleanPass.length < 6) {
                    throw new Error('La contraseña debe tener al menos 6 caracteres');
                }
                // 1. Actualizar en Supabase Auth (Sistema real)
                const { error: authError } = await supabase.auth.updateUser({ password: cleanPass });
                if (authError) throw authError;

                // 2. Actualizar en nuestra tabla perfiles (Para visualización)
                const { error: perfilPassError } = await supabase
                    .from('perfiles')
                    .update({ password_plana: cleanPass })
                    .eq('id', user.id);
                if (perfilPassError) throw perfilPassError;
            }

            setSuccess('Perfil actualizado con éxito');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowProfileModal(false);
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const userInitial = user?.email?.[0].toUpperCase() || 'U';
    const nombreParaMostrar = formatearNombreMostrar(perfil?.nombre_completo || user?.email?.split('@')[0]);

    return (
        <div className="menu-usuario-wrapper" ref={menuRef}>
            <button
                className="user-profile-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{ padding: '4px' }}
                title="Menú de usuario"
            >
                <div className="avatar">
                    {userInitial}
                </div>
                <div className="user-info">
                    <span className="user-name">{nombreParaMostrar}</span>
                </div>
                <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''} `} style={{ marginLeft: '8px', opacity: 0.5 }} />
            </button>

            {isOpen && (
                <div className="user-dropdown-menu">
                    <button
                        className="dropdown-item"
                        onClick={() => {
                            setShowProfileModal(true);
                            setIsOpen(false);
                            setError(null);
                            setSuccess(null);
                        }}
                        title="Ver detalles de mi perfil"
                    >
                        <UserCircle2 size={22} strokeWidth={1.5} />
                        <span>Ver perfil</span>
                    </button>

                    <button
                        className="dropdown-item"
                        onClick={() => {
                            onToggleTheme();
                            setIsOpen(false);
                        }}
                        title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                    >
                        {isDarkMode ? <Sun size={22} strokeWidth={1.5} /> : <Moon size={22} strokeWidth={1.5} />}
                        <span>{isDarkMode ? 'Cambiar a claro' : 'Cambiar a oscuro'}</span>
                    </button>

                    <button
                        className="dropdown-item"
                        onClick={onLogout}
                        title="Salir de la aplicación"
                    >
                        <LogOut size={22} strokeWidth={1.5} />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            )}

            {/* Modal de Perfil (Rediseñado Diana Murcia) */}
            {showProfileModal && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content card-modal" style={{ maxWidth: '420px', padding: 0, borderRadius: '24px', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', padding: '40px 24px 24px', textAlign: 'center' }}>
                            <button
                                className="btn-close"
                                type="button"
                                onClick={() => setShowProfileModal(false)}
                                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                title="Cerrar ventana"
                            >
                                <X size={24} strokeWidth={1.5} />
                            </button>

                            {/* Avatar Centrado Grande */}
                            <div
                                className="avatar"
                                style={{
                                    width: '90px',
                                    height: '90px',
                                    fontSize: '32px',
                                    margin: '0 auto 16px',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                                }}
                            >
                                {userInitial}
                            </div>

                            {/* Nombre */}
                            <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text)', margin: '0', letterSpacing: '-0.02em' }}>
                                {perfil?.nombre_completo || 'Usuario'}
                            </h2>
                        </div>

                        <div style={{ height: '1px', background: 'var(--border)', width: '90%', margin: '0 auto' }}></div>

                        <form onSubmit={handleUpdateProfile} className="modal-body" style={{ padding: '24px 32px 32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Usuario (Fila informativa) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', minHeight: '40px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Usuario:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, justifyContent: 'flex-end', width: '230px' }}>
                                        <span style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '600' }}>@{user?.email?.split('@')[0]}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const username = user?.email?.split('@')[0] || '';
                                                navigator.clipboard.writeText(username);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: copied ? 'var(--primary)' : 'var(--text-muted)', display: 'flex' }}
                                            title="Copiar"
                                        >
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Nombre (Fila informativa/editable) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', minHeight: '40px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Nombre:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, justifyContent: 'flex-end', width: '230px' }}>
                                        {isEditingName ? (
                                            <input
                                                type="text"
                                                className="input-premium"
                                                style={{
                                                    padding: '8px 12px',
                                                    height: '36px',
                                                    width: '100%',
                                                    flex: 1,
                                                    maxWidth: '220px',
                                                    fontSize: '14px',
                                                    border: '1.5px solid var(--primary)',
                                                    background: 'var(--card)',
                                                    borderRadius: '8px',
                                                    outline: 'none'
                                                }}
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                autoFocus
                                            />
                                        ) : (
                                            <span style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '500' }}>{fullName}</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingName(!isEditingName)}
                                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: isEditingName ? 'var(--primary)' : 'var(--text-muted)', display: 'flex' }}
                                            title={isEditingName ? 'Cancelar edición' : 'Editar nombre'}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Contraseña (Fila informativa/editable) */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', minHeight: '40px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Contraseña:</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, justifyContent: 'flex-end', width: '230px' }}>
                                            <span style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '600', letterSpacing: showPassword ? 'normal' : '0.15em' }}>
                                                {showPassword ? (perfil?.password_plana || 'No sincronizada') : '••••••••'}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ padding: '6px', color: showPassword ? 'var(--primary)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                                                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                                                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: isChangingPassword ? 'var(--primary)' : 'var(--text-muted)', display: 'flex' }}
                                                title={isChangingPassword ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
                                            >
                                                <Lock size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Campos de cambio de contraseña que aparecen al pulsar el candado/lápiz */}
                                    {isChangingPassword && (
                                        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px', width: '100%' }}>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Nueva"
                                                style={{
                                                    padding: '10px 14px',
                                                    fontSize: '13px',
                                                    borderRadius: '12px',
                                                    border: '1.5px solid var(--border)',
                                                    background: 'var(--bg)',
                                                    color: 'var(--text)',
                                                    outline: 'none',
                                                    width: '100%',
                                                    transition: 'all 0.2s'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Confirmar"
                                                style={{
                                                    padding: '10px 14px',
                                                    fontSize: '13px',
                                                    borderRadius: '12px',
                                                    border: '1.5px solid var(--border)',
                                                    background: 'var(--bg)',
                                                    color: 'var(--text)',
                                                    outline: 'none',
                                                    width: '100%',
                                                    transition: 'all 0.2s'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="alert-error" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '12px', fontSize: '13px' }}>
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="alert-success" style={{ marginTop: '20px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '12px', fontSize: '13px', textAlign: 'center', fontWeight: '600' }}>
                                    {success}
                                </div>
                            )}

                            {/* El botón solo aparece si hay algo por guardar o si se está editando activamente */}
                            {(fullName.trim() !== (perfil?.nombre_completo || '').trim() || newPassword.trim() !== '') && (
                                <button
                                    type="submit"
                                    className="btn-pill btn-pill-primary fade-in"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        marginTop: '30px',
                                        gap: '8px'
                                    }}
                                >
                                    {loading ? (
                                        <div className="loading-spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }}></div>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Actualizar Perfil
                                        </>
                                    )}
                                </button>
                            )}
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default MenuUsuario;
