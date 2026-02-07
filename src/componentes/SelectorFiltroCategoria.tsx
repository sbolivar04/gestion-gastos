import React, { useState, useRef, useEffect } from 'react';
import { Tag, ChevronDown, ChevronUp } from 'lucide-react';

interface SelectorFiltroCategoriaProps {
    categorias: any[];
    value: string;
    onChange: (value: string) => void;
}

const SelectorFiltroCategoria: React.FC<SelectorFiltroCategoriaProps> = ({ categorias, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const categoriaSeleccionada = categorias.find(c => c.id === value);
    const label = value === 'todas' ? 'Todas las categorías' : (categoriaSeleccionada?.nombre || 'Categoría');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} style={{ flex: '1 1 180px', position: 'relative' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    borderRadius: '16px',
                    border: value !== 'todas' || isOpen ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                    background: 'var(--card)',
                    color: value !== 'todas' ? 'var(--text)' : 'var(--text-muted)',
                    outline: 'none',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                }}
            >
                {value !== 'todas' && categoriaSeleccionada ? (
                    <div style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: categoriaSeleccionada.color || 'var(--primary)',
                        boxShadow: `0 0 10px ${categoriaSeleccionada.color || 'var(--primary)'}60`,
                        transition: 'all 0.2s'
                    }}></div>
                ) : (
                    <Tag
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: value !== 'todas' ? 'var(--primary)' : 'var(--text-muted)',
                            transition: 'color 0.2s'
                        }}
                    />
                )}

                <span style={{ fontWeight: value !== 'todas' ? '600' : '500', marginLeft: value !== 'todas' ? '0' : '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                </span>

                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                        zIndex: 2100,
                        padding: '8px',
                        maxHeight: '280px',
                        overflowY: 'auto'
                    }}
                >
                    <div
                        onClick={() => { onChange('todas'); setIsOpen(false); }}
                        style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            color: value === 'todas' ? 'var(--primary)' : 'var(--text)',
                            background: value === 'todas' ? 'var(--primary)15' : 'transparent',
                            cursor: 'pointer',
                            fontWeight: value === 'todas' ? '600' : '400',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { if (value !== 'todas') e.currentTarget.style.background = 'var(--bg)'; }}
                        onMouseLeave={(e) => { if (value !== 'todas') e.currentTarget.style.background = 'transparent'; }}
                    >
                        Todas las categorías
                    </div>

                    {categorias.map(c => (
                        <div
                            key={c.id}
                            onClick={() => { onChange(c.id); setIsOpen(false); }}
                            style={{
                                padding: '10px 12px',
                                borderRadius: '10px',
                                fontSize: '14px',
                                color: value === c.id ? 'var(--primary)' : 'var(--text)',
                                background: value === c.id ? 'var(--primary)15' : 'transparent',
                                cursor: 'pointer',
                                fontWeight: value === c.id ? '600' : '500',
                                marginTop: '2px',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                            onMouseEnter={(e) => { if (value !== c.id) e.currentTarget.style.background = 'var(--bg)'; }}
                            onMouseLeave={(e) => { if (value !== c.id) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color || 'var(--primary)', boxShadow: `0 0 8px ${c.color}60` }}></div>
                            {c.nombre}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SelectorFiltroCategoria;
