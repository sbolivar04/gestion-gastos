import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronDown,
    ChevronUp,
} from 'lucide-react';

const SelectorPresupuestoPremium = ({
    fuentes,
    fuenteId,
    onSelect,
    error
}: {
    fuentes: any[],
    fuenteId: string,
    onSelect: (id: string) => void,
    error?: boolean
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fuenteSeleccionada = fuentes.find(f => f.id === fuenteId);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', marginTop: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginLeft: '4px', marginBottom: '8px', display: 'block' }}>
                Presupuesto
            </label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: error ? 'rgba(239, 68, 68, 0.02)' : 'var(--card)',
                    border: isOpen ? '2px solid var(--primary)' : (error ? '1.5px solid var(--danger)' : (fuenteSeleccionada ? '1.5px solid var(--primary)' : '1.5px solid var(--border)')),
                    borderRadius: '14px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    color: fuenteSeleccionada ? 'var(--text)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 4px var(--primary)10' : (error ? '0 0 0 4px rgba(239, 68, 68, 0.1)' : 'none'),
                    outline: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{fuenteSeleccionada ? `${fuenteSeleccionada.nombre} ($${new Intl.NumberFormat('es-CO').format(fuenteSeleccionada.monto_estimado)})` : 'No asociado a presupuesto específico'}</span>
                </div>
                {isOpen ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
            </div>

            {isOpen && (
                <div
                    className="fade-in"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        background: 'var(--card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 1000,
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px' }} className="custom-scroll">
                        <div
                            onClick={() => {
                                onSelect('');
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '10px 12px',
                                borderRadius: '10px',
                                fontSize: '14px',
                                color: fuenteId === '' ? 'var(--primary)' : 'var(--text)',
                                fontWeight: fuenteId === '' ? '600' : '400',
                                background: fuenteId === '' ? 'var(--primary)10' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (fuenteId !== '') e.currentTarget.style.background = 'var(--bg)';
                            }}
                            onMouseLeave={(e) => {
                                if (fuenteId !== '') e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            No asociado a presupuesto específico
                        </div>
                        {fuentes.map(f => (
                            <div
                                key={f.id}
                                onClick={() => {
                                    onSelect(f.id);
                                    setIsOpen(false);
                                }}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    color: fuenteId === f.id ? 'var(--primary)' : 'var(--text)',
                                    fontWeight: fuenteId === f.id ? '600' : '400',
                                    background: fuenteId === f.id ? 'var(--primary)10' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                    if (fuenteId !== f.id) e.currentTarget.style.background = 'var(--bg)';
                                }}
                                onMouseLeave={(e) => {
                                    if (fuenteId !== f.id) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {f.nombre} (${new Intl.NumberFormat('es-CO').format(f.monto_estimado)})
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectorPresupuestoPremium;
