import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Pencil,
    Check,
    X,
    Plus
} from 'lucide-react';

const SelectorCategoriaPremium = ({
    categorias,
    categoryId,
    onSelect,
    onAddNew,
    error,
    onEdit
}: {
    categorias: any[],
    categoryId: string,
    onSelect: (id: string) => void,
    onAddNew: () => void,
    error?: boolean,
    onEdit: (id: string, newName: string) => void
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEditClick = (e: React.MouseEvent, c: any) => {
        e.stopPropagation();
        setEditingId(c.id);
        setEditingName(c.nombre);
    };

    const handleSaveEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingId && editingName.trim()) {
            onEdit(editingId, editingName.trim());
            setEditingId(null);
        }
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    };

    const categoriaSeleccionada = categorias.find(c => c.id === categoryId);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: error ? 'rgba(239, 68, 68, 0.02)' : 'var(--card)',
                    border: isOpen ? '2px solid var(--primary)' : (error ? '1.5 solid var(--danger)' : (categoriaSeleccionada ? '1.5px solid var(--primary)' : '1.5px solid var(--border)')),
                    borderRadius: '14px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    color: categoriaSeleccionada ? 'var(--text)' : 'var(--text-muted)',
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
                    {categoriaSeleccionada && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: categoriaSeleccionada.color || 'var(--primary)', boxShadow: `0 0 10px ${categoriaSeleccionada.color}40` }}></div>}
                    <span>{categoriaSeleccionada ? categoriaSeleccionada.nombre : 'Seleccionar Categoría'}</span>
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
                        {categorias.length === 0 && (
                            <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                                No hay categorías creadas.
                            </div>
                        )}
                        {categorias.map(c => (
                            <div
                                key={c.id}
                                onClick={() => {
                                    if (editingId !== c.id) {
                                        onSelect(c.id);
                                        setIsOpen(false);
                                    }
                                }}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    color: categoryId === c.id ? 'var(--primary)' : 'var(--text)',
                                    fontWeight: categoryId === c.id ? '600' : '400',
                                    background: categoryId === c.id ? 'var(--primary)10' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '10px'
                                }}
                                onMouseEnter={(e) => {
                                    if (categoryId !== c.id) e.currentTarget.style.background = 'var(--bg)';
                                }}
                                onMouseLeave={(e) => {
                                    if (categoryId !== c.id) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {editingId === c.id ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }} onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveEdit(e as any);
                                                } else if (e.key === 'Escape') {
                                                    handleCancelEdit(e as any);
                                                }
                                            }}
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                flex: 1,
                                                border: '1px solid var(--primary)',
                                                borderRadius: '6px',
                                                padding: '4px 8px',
                                                fontSize: '13px',
                                                outline: 'none'
                                            }}
                                            autoFocus
                                        />
                                        <button onClick={handleSaveEdit} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px' }}><Check size={14} /></button>
                                        <button onClick={handleCancelEdit} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}><X size={14} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color || 'var(--primary)', boxShadow: `0 0 10px ${c.color}40` }}></div>
                                            <span>{c.nombre}</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleEditClick(e, c)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '6px',
                                                transition: 'color 0.2s, background 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary)10'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div
                        onClick={() => {
                            onAddNew();
                            setIsOpen(false);
                        }}
                        style={{
                            padding: '14px',
                            borderTop: '1px solid var(--border)',
                            color: 'var(--primary)',
                            fontSize: '14px',
                            fontWeight: '700',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'var(--bg)',
                            transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary)05'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg)'}
                    >
                        <Plus size={16} /> Agregar nueva categoría...
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectorCategoriaPremium;
