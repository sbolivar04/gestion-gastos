import { useEffect } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface BannerAlertaProps {
    mensaje: string;
    subtitulo?: string;
    onClose: () => void;
    tipo?: 'danger' | 'success';
}

const BannerAlerta = ({ mensaje, subtitulo, onClose, tipo = 'danger' }: BannerAlertaProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const colors = {
        danger: {
            bg: 'var(--card)',
            border: 'var(--danger)',
            title: 'var(--danger)',
            text: '#f87171',
            icon: <AlertCircle size={20} />
        },
        success: {
            bg: 'var(--card)',
            border: 'var(--primary)',
            title: 'var(--primary)',
            text: '#34d399',
            icon: <CheckCircle size={20} />
        }
    };

    const style = colors[tipo];

    return (
        <div className="fade-in" style={{
            background: style.bg,
            border: `1.5px solid ${style.border}`,
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            position: 'relative',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            maxWidth: '100%'
        }}>
            <div style={{ color: style.title, marginTop: '2px' }}>
                {style.icon}
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ color: style.title, fontWeight: '800', fontSize: '14px', margin: 0 }}>{mensaje}</p>
                {subtitulo && <p style={{ color: style.text, fontSize: '13px', fontWeight: '500', margin: '4px 0 0' }}>{subtitulo}</p>}
            </div>
            <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: style.title, padding: '4px', cursor: 'pointer', opacity: 0.7 }}
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default BannerAlerta;
