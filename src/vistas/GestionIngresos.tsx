import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus,
    Trash2,
    PiggyBank,
    DollarSign,
    TrendingUp,
    CreditCard,
    AlertCircle,
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    ChevronDown,
    ChevronUp,
    Receipt,
    Eye,
    Download,
    X
} from 'lucide-react';
import { formatearFecha, getISODateLocal } from '../utilidades/fechas';

const GestionIngresos = ({ user }: any) => {
    const [fuentes, setFuentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        monto_estimado: 0,
        montoDisplay: ''
    });
    const [gastos, setGastos] = useState<any[]>([]);
    const [fuentesExpandidas, setFuentesExpandidas] = useState<string[]>([]);
    const [paginacionGastos, setPaginacionGastos] = useState<Record<string, number>>({});
    const [listaVersion, setListaVersion] = useState<Record<string, number>>({});
    const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'pdf' } | null>(null);
    const [saving, setSaving] = useState(false);

    const handleMontoChange = (val: string) => {
        const numericValue = val.replace(/\D/g, '');
        const number = parseInt(numericValue) || 0;
        setFormData(prev => ({
            ...prev,
            monto_estimado: number,
            montoDisplay: number > 0 ? new Intl.NumberFormat('es-CO').format(number) : ''
        }));
    };

    // Estado para el periodo seleccionado
    const [fechaReferencia, setFechaReferencia] = useState(new Date());

    useEffect(() => {
        fetchFuentes();
    }, [user.id, fechaReferencia]);

    const fetchFuentes = async () => {
        setLoading(true);
        const mes = fechaReferencia.getMonth() + 1;
        const anio = fechaReferencia.getFullYear();

        // 1. Obtener Fuentes
        const { data: dataFuentes } = await supabase
            .from('ingresos_fuentes')
            .select('*')
            .eq('usuario_id', user.id)
            .eq('mes', mes)
            .eq('año', anio);

        // 2. Obtener Gastos del mes para el desglose (incluyendo categoría)
        const primerDia = new Date(anio, mes - 1, 1);
        const ultimoDia = new Date(anio, mes, 0);

        const { data: dataGastos } = await supabase
            .from('gastos')
            .select('*, categorias(nombre, color)')
            .eq('id_usuario', user.id)
            .gte('fecha', getISODateLocal(primerDia))
            .lte('fecha', getISODateLocal(ultimoDia));

        if (dataFuentes) setFuentes(dataFuentes);
        if (dataGastos) setGastos(dataGastos);
        setLoading(false);
    };

    // Referencia para mantener la función actualizada en el closure del subscription
    const fetchFuentesRef = useRef(fetchFuentes);
    useEffect(() => {
        fetchFuentesRef.current = fetchFuentes;
    });

    useEffect(() => {
        const channel = supabase
            .channel('ingresos_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ingresos_fuentes' }, () => {
                fetchFuentesRef.current();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, () => {
                fetchFuentesRef.current();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleDownload = async (url: string = '', isPdfStr: boolean = false) => {
        const downloadUrl = url || previewFile?.url;
        const isPdfType = isPdfStr || previewFile?.type === 'pdf';
        if (!downloadUrl) return;
        try {
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const bUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = bUrl;
            link.download = `comprobante-${Date.now()}.${isPdfType ? 'pdf' : 'jpg'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(bUrl);
        } catch (e) {
            console.error("Error downloading:", e);
            window.open(downloadUrl, '_blank');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre || !formData.monto_estimado) return;

        setSaving(true);
        const mes = fechaReferencia.getMonth() + 1;
        const anio = fechaReferencia.getFullYear();

        // Normalizar nombre: Trim y Capitalización
        const nombreLimpio = formData.nombre.trim();
        const nombreFinal = nombreLimpio.charAt(0).toUpperCase() + nombreLimpio.slice(1).toLowerCase();

        const { error } = await supabase
            .from('ingresos_fuentes')
            .insert([{
                usuario_id: user.id,
                nombre: nombreFinal,
                monto_estimado: formData.monto_estimado,
                mes,
                año: anio
            }]);

        if (!error) {
            setFormData({ nombre: '', monto_estimado: 0, montoDisplay: '' });
            setShowForm(false);
            fetchFuentes();
        }
        setSaving(false);
    };

    const clonarMesAnterior = async () => {
        if (!confirm('¿Quieres copiar los ingresos del mes pasado a este periodo?')) return;

        setLoading(true);
        const mesActual = fechaReferencia.getMonth() + 1;
        const anioActual = fechaReferencia.getFullYear();

        // Calcular mes anterior
        const anterior = new Date(fechaReferencia);
        anterior.setMonth(anterior.getMonth() - 1);
        const mesAnt = anterior.getMonth() + 1;
        const anioAnt = anterior.getFullYear();

        // 1. Obtener ingresos del mes anterior
        const { data: ingresosAnt } = await supabase
            .from('ingresos_fuentes')
            .select('nombre, monto_estimado')
            .eq('usuario_id', user.id)
            .eq('mes', mesAnt)
            .eq('año', anioAnt);

        if (ingresosAnt && ingresosAnt.length > 0) {
            // 2. Insertar en el mes actual
            const nuevasFuentes = ingresosAnt.map(f => ({
                usuario_id: user.id,
                nombre: f.nombre,
                monto_estimado: f.monto_estimado,
                mes: mesActual,
                año: anioActual
            }));

            const { error } = await supabase.from('ingresos_fuentes').insert(nuevasFuentes);
            if (!error) fetchFuentes();
        } else {
            alert('No se encontraron ingresos en el mes anterior para copiar.');
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta fuente de ingresos?')) return;

        const { error } = await supabase
            .from('ingresos_fuentes')
            .delete()
            .eq('id', id);

        if (!error) fetchFuentes();
    };

    const navegarMes = (num: number) => {
        const nueva = new Date(fechaReferencia);
        nueva.setMonth(nueva.getMonth() + num);
        setFechaReferencia(nueva);
    };

    const totalIngresos = fuentes.reduce((acc, f) => acc + Number(f.monto_estimado), 0);
    const nombreMes = fechaReferencia.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Presupuesto Mensual 💰</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Gestiona tus ingresos por cada mes</p>
            </div>

            {/* Navegador de Periodo */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--card)' }}>
                <button onClick={() => navegarMes(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                    <ChevronLeft size={24} />
                </button>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: '800', textTransform: 'capitalize', color: 'var(--primary)' }}>{nombreMes}</p>
                </div>
                <button onClick={() => navegarMes(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Resumen de Capacidad */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)'
            }}>
                <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '24px' }}>
                    <p style={{ fontSize: '14px', opacity: 0.9 }}>Capacidad de {nombreMes}</p>
                    <h3 style={{ fontSize: '36px', fontWeight: '900', margin: '8px 0', color: 'white', letterSpacing: '-0.03em' }}>
                        ${new Intl.NumberFormat('es-CO').format(totalIngresos)}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={14} /> {fuentes.length} {fuentes.length === 1 ? 'fuente' : 'fuentes'} registradas
                        </span>
                    </div>
                </div>
                <PiggyBank size={140} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.15, transform: 'rotate(-15deg)' }} />
            </div>

            {/* Lista de Fuentes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Detalle de Ingresos</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {fuentes.length === 0 && !loading && (
                            <button
                                onClick={clonarMesAnterior}
                                className="btn-pill btn-pill-secondary"
                                style={{ padding: '8px 16px', fontSize: '13px' }}
                            >
                                <Copy size={16} /> Importar anterior
                            </button>
                        )}
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`btn-pill ${showForm ? 'btn-pill-secondary' : 'btn-pill-primary'}`}
                            style={{ padding: '8px 20px', fontSize: '13px' }}
                        >
                            {showForm ? 'Cancelar' : <><Plus size={16} /> Añadir</>}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="card" style={{ padding: '20px', border: '1px solid var(--primary)' }}>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Fuente de ingreso</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Sueldo, Rendimientos, etc."
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Monto para {nombreMes}</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: formData.monto_estimado > 0 ? 'var(--text-muted)' : 'transparent', transition: 'all 0.2s' }}>$</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={formData.montoDisplay}
                                        onChange={e => handleMontoChange(e.target.value)}
                                        style={{ width: '100%', padding: `12px 12px 12px ${formData.monto_estimado > 0 ? '30px' : '12px'}`, borderRadius: '10px', border: `1.5px solid ${formData.monto_estimado > 0 ? 'var(--primary)' : 'var(--border)'}`, background: 'var(--bg)', color: 'var(--text)', transition: 'all 0.2s', outline: 'none' }}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-pill btn-pill-primary"
                                style={{ width: '100%', padding: '14px', marginTop: '8px' }}
                            >
                                {saving ? <div className="loading-spinner" style={{ width: '18px', height: '18px' }}></div> : <><Check size={18} /> Guardar Presupuesto</>}
                            </button>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    </div>
                ) : fuentes.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', background: 'transparent', border: '2px dashed var(--border)' }}>
                        <DollarSign size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-muted)' }}>Sin ingresos registrados para {nombreMes}.</p>
                        <p style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-muted)' }}>¡Añádelos o impórtalos para ver tu saldo disponible!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {fuentes.map((f) => {
                            const isExpanded = fuentesExpandidas.includes(f.id);
                            const gastosAsociados = gastos
                                .filter(g => g.id_ingreso_fuente === f.id)
                                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                            const totalGastadoFuente = gastosAsociados.reduce((acc, g) => acc + Number(g.monto), 0);
                            const perc = f.monto_estimado > 0 ? Math.min(100, Math.round((totalGastadoFuente / f.monto_estimado) * 100)) : 0;

                            const toggleExpand = () => {
                                setFuentesExpandidas(prev => {
                                    const expanded = prev.includes(f.id);
                                    if (!expanded) {
                                        // Reset pagination when expanding
                                        setPaginacionGastos(p => ({ ...p, [f.id]: 5 }));
                                        return [...prev, f.id];
                                    } else {
                                        return prev.filter(id => id !== f.id);
                                    }
                                });
                            };

                            const limit = paginacionGastos[f.id] || 5;
                            const gastosMostrados = gastosAsociados.slice(0, limit);
                            const hasMoreGastos = gastosAsociados.length > limit;

                            return (
                                <div key={f.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                                    <div
                                        onClick={toggleExpand}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', background: isExpanded ? 'var(--bg)' : 'transparent', transition: 'all 0.2s' }}
                                    >
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'var(--primary)10', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '700', fontSize: '15px' }}>{f.nombre}</p>
                                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                    ${new Intl.NumberFormat('es-CO').format(totalGastadoFuente)} de ${new Intl.NumberFormat('es-CO').format(f.monto_estimado)}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '800', color: perc > 90 ? 'var(--danger)' : 'var(--primary)', background: perc > 90 ? 'var(--danger)15' : 'var(--primary)15', padding: '2px 8px', borderRadius: '10px' }}>
                                                    {perc}%
                                                </span>
                                                {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div
                                            key={listaVersion[f.id] || 0}
                                            className="fade-in"
                                            style={{ borderTop: '1px solid var(--border)', padding: '12px' }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {gastosAsociados.length > 0 ? (
                                                    <>
                                                        {gastosMostrados.map((g, idx) => (
                                                            <div
                                                                key={g.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '10px 8px',
                                                                    borderRadius: '10px',
                                                                    transition: 'background 0.2s',
                                                                    animationDelay: `${(idx % 5) * 0.05}s`
                                                                }}
                                                                className="hover-bg fade-in"
                                                            >                                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                    <div style={{ width: '32px', height: '32px', background: 'var(--bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                                                        <Receipt size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <p style={{ fontSize: '13px', fontWeight: '600' }}>{g.titulo}</p>
                                                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatearFecha(g.fecha)} • {g.categorias?.nombre}</p>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--danger)' }}>
                                                                        -${new Intl.NumberFormat('es-CO').format(g.monto)}
                                                                    </p>
                                                                    {g.comprobante_url && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const fullUrl = `https://yupaibsqnxfismckuqje.supabase.co/storage/v1/object/public/comprobantes/${g.comprobante_url}`;
                                                                                const isPdf = g.comprobante_url.toLowerCase().endsWith('.pdf');
                                                                                setPreviewFile({ url: fullUrl, type: isPdf ? 'pdf' : 'image' });
                                                                            }}
                                                                            style={{
                                                                                background: 'rgba(16, 185, 129, 0.1)',
                                                                                border: 'none',
                                                                                color: 'var(--primary)',
                                                                                cursor: 'pointer',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                width: '30px',
                                                                                height: '30px',
                                                                                borderRadius: '8px'
                                                                            }}
                                                                            title="Ver comprobante"
                                                                        >
                                                                            <Eye size={16} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {hasMoreGastos ? (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPaginacionGastos(p => ({ ...p, [f.id]: gastosAsociados.length }));
                                                                    setListaVersion(v => ({ ...v, [f.id]: (v[f.id] || 0) + 1 }));
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px',
                                                                    marginTop: '8px',
                                                                    background: 'var(--bg)',
                                                                    border: '1.5px solid var(--border)',
                                                                    borderRadius: '12px',
                                                                    color: 'var(--primary)',
                                                                    fontSize: '12px',
                                                                    fontWeight: '700',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                className="btn-hover-soft"
                                                            >
                                                                Mostrar todos los movimientos ({gastosAsociados.length})
                                                            </button>
                                                        ) : gastosAsociados.length > 5 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPaginacionGastos(p => ({ ...p, [f.id]: 5 }));
                                                                    setListaVersion(v => ({ ...v, [f.id]: (v[f.id] || 0) + 1 }));
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px',
                                                                    marginTop: '8px',
                                                                    background: 'var(--bg)',
                                                                    border: '1.5px solid var(--border)',
                                                                    borderRadius: '12px',
                                                                    color: 'var(--primary)',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                className="btn-hover-soft"
                                                            >
                                                                Mostrar menos movimientos
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                        No hay gastos registrados para esta fuente.
                                                    </p>
                                                )}
                                            </div>

                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '12px', fontWeight: '600', padding: '6px' }}
                                                >
                                                    <Trash2 size={14} /> Eliminar Fuente
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Barra de progreso visual al final de la card principal si no está expandida */}
                                    {!isExpanded && (
                                        <div style={{ width: '100%', height: '3px', background: 'var(--border)30' }}>
                                            <div style={{ width: `${perc}%`, height: '100%', background: perc > 90 ? 'var(--danger)' : 'var(--primary)', transition: 'width 0.3s ease' }}></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}


                    </div>
                )}
            </div>

            {/* Modal de Vista Previa de Comprobante (Igual al de Historico para consistencia) */}
            {previewFile && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }} onClick={() => setPreviewFile(null)}>
                    <div className="fade-in" style={{ position: 'relative', width: 'auto', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ position: 'absolute', top: '-50px', right: 0, display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => previewFile && handleDownload(previewFile.url, previewFile.type === 'pdf')}
                                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
                                title="Descargar"
                            >
                                <Download size={18} /> Descargar
                            </button>
                            <button
                                onClick={() => setPreviewFile(null)}
                                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {previewFile.type === 'pdf' ? (
                            <div style={{ width: '90vw', maxWidth: '800px', height: '80vh', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)' }}>
                                <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.url)}&embedded=true`} style={{ width: '100%', height: '100%', border: 'none' }} title="Vista Previa PDF" />
                            </div>
                        ) : (
                            <img src={previewFile.url} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
                        )}
                    </div>
                </div>
            )}

            {/* Info Card */}
            <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '20px', display: 'flex', gap: '16px' }}>
                <div style={{ color: 'var(--primary)', marginTop: '2px' }}>
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>Control Histórico</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        Ahora tus ingresos son independientes cada mes. Si los cambias en Marzo, tus datos de Febrero se mantendrán intactos para que tu historia financiera sea real.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GestionIngresos;
