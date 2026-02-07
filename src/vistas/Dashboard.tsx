import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Wallet,
    History,
    TrendingUp,
    Receipt,
    ArrowUpRight,
    ArrowDownRight,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { formatearFecha, getISODateLocal } from '../utilidades/fechas';

type Granularidad = 'dia' | 'semana' | 'mes' | 'año' | 'periodo';

const PERIODOS: { id: Granularidad; label: string }[] = [
    { id: 'dia', label: 'Día' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'año', label: 'Año' },
    { id: 'periodo', label: 'Periodo' },
];

const Skeleton = ({ width, height, borderRadius = '12px' }: { width?: string, height: string, borderRadius?: string }) => (
    <div className="skeleton" style={{ width: width || '100%', height, borderRadius, background: 'var(--border)', opacity: 0.1, position: 'relative', overflow: 'hidden' }}>
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
            animation: 'shimmer 1.5s infinite'
        }}></div>
    </div>
);

const Dashboard = ({ user }: any) => {
    const [stats, setStats] = useState({
        totalGastado: 0,
        deudasPendientes: 0,
        disponible: 0,
        mesAnterior: 0,
        capacidadTotal: 0,
        numRegistros: 0
    });
    const [gastosRecientes, setGastosRecientes] = useState<any[]>([]);
    const [categoriasSummary, setCategoriasSummary] = useState<any[]>([]);
    const [deudasProximas, setDeudasProximas] = useState<any[]>([]);
    const [fuentesDetalle, setFuentesDetalle] = useState<any[]>([]);
    const [fuentesExpandidas, setFuentesExpandidas] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const [granularidad, setGranularidad] = useState<Granularidad>('mes');
    const [fechaNavegacion, setFechaNavegacion] = useState<Date>(new Date());

    useEffect(() => {
        fetchData();
    }, [user.id, granularidad, fechaNavegacion]);

    const getStartEnd = (date: Date, gran: Granularidad) => {
        const start = new Date(date);
        const end = new Date(date);
        switch (gran) {
            case 'dia':
                start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
                break;
            case 'semana':
                const dia = start.getDay(); // 0 (Sun) to 6 (Sat)
                const diff = start.getDate() - dia + (dia === 0 ? -6 : 1); // Adjust to Monday
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end.setTime(start.getTime());
                end.setDate(start.getDate() + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'mes':
                start.setDate(1); start.setHours(0, 0, 0, 0);
                end.setMonth(end.getMonth() + 1, 0); end.setHours(23, 59, 59, 999);
                break;
            case 'año':
                start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31); end.setHours(23, 59, 59, 999);
                break;
            default:
                start.setFullYear(2000); end.setFullYear(2100);
        }
        return { start, end };
    };

    const navegarFecha = (direccion: number) => {
        const nueva = new Date(fechaNavegacion);
        switch (granularidad) {
            case 'dia': nueva.setDate(nueva.getDate() + direccion); break;
            case 'semana': nueva.setDate(nueva.getDate() + (direccion * 7)); break;
            case 'mes': nueva.setMonth(nueva.getMonth() + direccion); break;
            case 'año': nueva.setFullYear(nueva.getFullYear() + direccion); break;
        }
        setFechaNavegacion(nueva);
    };

    const fetchData = async () => {
        setLoading(true);
        const { start, end } = getStartEnd(fechaNavegacion, granularidad);
        const startISO = getISODateLocal(start);
        const endISO = getISODateLocal(end);

        const prevStart = new Date(start);
        const prevEnd = new Date(end);
        if (granularidad === 'mes') {
            prevStart.setMonth(prevStart.getMonth() - 1);
            prevEnd.setMonth(prevEnd.getMonth() - 1);
        } else if (granularidad === 'dia') {
            prevStart.setDate(prevStart.getDate() - 1);
            prevEnd.setDate(prevEnd.getDate() - 1);
        } else if (granularidad === 'semana') {
            prevStart.setDate(prevStart.getDate() - 7);
            prevEnd.setDate(prevEnd.getDate() - 7);
        }

        // 1. Obtener rango completo del MES para el cálculo de "Disponible" (Opción 1)
        const mesActual = fechaNavegacion.getMonth() + 1;
        const anioActual = fechaNavegacion.getFullYear();
        const startOfMonth = new Date(anioActual, mesActual - 1, 1);
        const endOfMonth = new Date(anioActual, mesActual, 0);
        const startOfMonthISO = getISODateLocal(startOfMonth);
        const endOfMonthISO = getISODateLocal(endOfMonth);

        // 2. Consultar INGRESOS específicos de ese mes/año
        const { data: ingresos } = await supabase
            .from('ingresos_fuentes')
            .select('id, nombre, monto_estimado')
            .eq('usuario_id', user.id)
            .eq('mes', mesActual)
            .eq('año', anioActual);

        // --- LÓGICA DE AUTO-IMPORTACIÓN ---
        // Si no hay ingresos en el mes actual Y estamos viendo el mes/año de HOY
        const hoy = new Date();
        const esMesActual = mesActual === (hoy.getMonth() + 1) && anioActual === hoy.getFullYear();

        if (ingresos?.length === 0 && esMesActual) {
            const anterior = new Date(fechaNavegacion);
            anterior.setMonth(anterior.getMonth() - 1);
            const mesAnt = anterior.getMonth() + 1;
            const anioAnt = anterior.getFullYear();

            // Buscamos ingresos del mes pasado
            const { data: ingresosAnt } = await supabase
                .from('ingresos_fuentes')
                .select('nombre, monto_estimado')
                .eq('usuario_id', user.id)
                .eq('mes', mesAnt)
                .eq('año', anioAnt);

            if (ingresosAnt && ingresosAnt.length > 0) {
                const nuevasFuentes = ingresosAnt.map(f => ({
                    usuario_id: user.id,
                    nombre: f.nombre,
                    monto_estimado: f.monto_estimado,
                    mes: mesActual,
                    año: anioActual
                }));

                await supabase.from('ingresos_fuentes').insert(nuevasFuentes);
                fetchData(); // Recargamos todo ya con los datos nuevos
                return;
            }
        }
        // ----------------------------------

        const capacidadTotal = ingresos?.reduce((acc, f) => acc + Number(f.monto_estimado), 0) || 0;

        // 3. Consultar GASTOS del periodo seleccionado (para las otras tarjetas y gráficos)
        const { data: gastosMes } = await supabase
            .from('gastos')
            .select('monto, id_categoria, categorias(nombre, color)')
            .eq('id_usuario', user.id)
            .gte('fecha', startISO)
            .lte('fecha', endISO);

        // 4. Consultar TODOS los gastos del mes (para el cálculo de "Disponible" y desglose)
        const { data: todosGastosMes } = await supabase
            .from('gastos')
            .select('monto, id_ingreso_fuente, categorias(nombre, color)')
            .eq('id_usuario', user.id)
            .gte('fecha', startOfMonthISO)
            .lte('fecha', endOfMonthISO);

        const totalGastadoMesCompleto = todosGastosMes?.reduce((acc, g) => acc + Number(g.monto), 0) || 0;

        // 5. Gastos del periodo anterior (para la comparativa de la flechita)
        const { data: gastosAnteriores } = await supabase
            .from('gastos')
            .select('monto')
            .eq('id_usuario', user.id)
            .gte('fecha', getISODateLocal(prevStart))
            .lte('fecha', getISODateLocal(prevEnd));

        // 6. Deudas
        const { data: deudas } = await supabase
            .from('deudas')
            .select('*')
            .eq('id_propietario', user.id)
            .neq('estado', 'pagado');

        const { data: recientes } = await supabase
            .from('gastos')
            .select('*, categorias(nombre, color)')
            .eq('id_usuario', user.id)
            .order('fecha', { ascending: false })
            .limit(5);

        const total = gastosMes?.reduce((acc, g) => acc + Number(g.monto), 0) || 0;
        const totalAnterior = gastosAnteriores?.reduce((acc, g) => acc + Number(g.monto), 0) || 0;
        const totalDeudas = deudas?.reduce((acc, d) => acc + (Number(d.monto_total) - Number(d.monto_pagado)), 0) || 0;

        const hoyStr = new Date().toISOString().split('T')[0];
        const sieteDiasStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const proximas = deudas?.filter(d => d.fecha_limite && d.fecha_limite >= hoyStr && d.fecha_limite <= sieteDiasStr)
            .sort((a, b) => a.fecha_limite.localeCompare(b.fecha_limite)) || [];

        const catMap = new Map();
        gastosMes?.forEach(g => {
            const catObj: any = Array.isArray(g.categorias) ? g.categorias[0] : g.categorias;
            const cat = catObj?.nombre || 'Otros';
            const color = catObj?.color || '#6366F1';
            const current = catMap.get(cat) || { total: 0, color };
            catMap.set(cat, { total: current.total + Number(g.monto), color });
        });

        const sortedCats = Array.from(catMap.entries())
            .map(([nombre, data]: [string, any]) => ({ nombre, ...data }))
            .sort((a, b) => b.total - a.total);

        setStats({
            totalGastado: total,
            deudasPendientes: totalDeudas,
            disponible: capacidadTotal - totalGastadoMesCompleto,
            mesAnterior: totalAnterior,
            capacidadTotal,
            numRegistros: gastosMes?.length || 0
        });
        setGastosRecientes(recientes || []);
        setCategoriasSummary(sortedCats);

        // --- Procesar Desglose por Fuentes ---
        const detalle = (ingresos || []).map(f => {
            const gastosFuente = (todosGastosMes || []).filter(g => g.id_ingreso_fuente === f.id);
            const totalG = gastosFuente.reduce((acc, g) => acc + Number(g.monto), 0);

            // Agrupar categorías para esta fuente
            const catMapFuente = new Map();
            gastosFuente.forEach(g => {
                const catObj: any = Array.isArray(g.categorias) ? g.categorias[0] : g.categorias;
                const cName = catObj?.nombre || 'Otros';
                const current = catMapFuente.get(cName) || 0;
                catMapFuente.set(cName, current + Number(g.monto));
            });

            return {
                id: f.id,
                nombre: f.nombre,
                estimado: Number(f.monto_estimado),
                gastado: totalG,
                categorias: Array.from(catMapFuente.entries()).map(([nombre, total]) => ({ nombre, total }))
            };
        });

        // Caso "Sin fuente"
        const gastosSinFuente = (todosGastosMes || []).filter(g => !g.id_ingreso_fuente);
        if (gastosSinFuente.length > 0) {
            const totalSF = gastosSinFuente.reduce((acc, g) => acc + Number(g.monto), 0);
            const catMapSF = new Map();
            gastosSinFuente.forEach(g => {
                const catObj: any = Array.isArray(g.categorias) ? g.categorias[0] : g.categorias;
                const cName = catObj?.nombre || 'Otros';
                catMapSF.set(cName, (catMapSF.get(cName) || 0) + Number(g.monto));
            });
            detalle.push({
                id: 'no-fuente',
                nombre: 'Sin fuente específica',
                estimado: 0,
                gastado: totalSF,
                categorias: Array.from(catMapSF.entries()).map(([nombre, total]) => ({ nombre, total }))
            });
        }

        setFuentesDetalle(detalle);
        setDeudasProximas(proximas);
        setLoading(false);
    };

    const diff = stats.mesAnterior > 0 ? ((stats.totalGastado - stats.mesAnterior) / stats.mesAnterior * 100).toFixed(0) : null;
    const porcentajePresupuesto = stats.capacidadTotal > 0 ? Math.min(Math.round((stats.totalGastado / stats.capacidadTotal) * 100), 100) : 0;

    const renderRangoTexto = () => {
        const { start, end } = getStartEnd(fechaNavegacion, granularidad);
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };

        if (granularidad === 'dia') return start.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (granularidad === 'mes') return start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
        if (granularidad === 'año') return start.getFullYear().toString();

        if (granularidad === 'semana') {
            const optionsEnd: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
            return `${start.toLocaleDateString('es-CO', options)} - ${end.toLocaleDateString('es-CO', optionsEnd)}`;
        }
        return 'Historial Completo';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Hola, {user?.user_metadata?.nombre_completo?.split(' ')[0] || user?.email?.split('@')[0]} 👋</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Resumen de tus finanzas</p>
            </div>

            {/* Navegación por Periodos (Estilo Gastos/Deudas) */}
            <div className="card" style={{ padding: '0', overflow: 'visible', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', borderRadius: '16px', position: 'relative', zIndex: 50 }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
                    {PERIODOS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setGranularidad(p.id)}
                            style={{
                                flex: 1,
                                padding: '10px 6px',
                                background: granularidad === p.id ? 'var(--bg)' : 'transparent',
                                border: 'none',
                                borderBottom: granularidad === p.id ? '2px solid var(--primary)' : '2px solid transparent',
                                color: granularidad === p.id ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: granularidad === p.id ? '700' : '500',
                                fontSize: '11px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                {granularidad !== 'periodo' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--card)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                        <button onClick={() => navegarFecha(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <ChevronLeft size={18} />
                        </button>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)', textTransform: 'capitalize' }}>
                            {renderRangoTexto()}
                        </span>
                        <button onClick={() => navegarFecha(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <>
                    <Skeleton height="160px" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Skeleton height="100px" />
                        <Skeleton height="100px" />
                    </div>
                    <Skeleton height="120px" />
                    <Skeleton height="200px" />
                </>
            ) : (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Card Principal */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden', minHeight: '160px', display: 'flex', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)' }}>
                        <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '24px' }}>
                            <p style={{ fontSize: '14px', opacity: 0.9 }}>Total Gastado {granularidad === 'mes' ? 'del Mes' : 'en el Periodo'}</p>
                            <h3 style={{ fontSize: '36px', fontWeight: '900', margin: '8px 0', color: 'white', letterSpacing: '-0.03em' }}>
                                ${new Intl.NumberFormat('es-CO').format(stats.totalGastado)}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                                {diff !== null && stats.mesAnterior > 0 && (
                                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                        {Number(diff) > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {Math.abs(Number(diff))}% vs anterior
                                    </span>
                                )}
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                    {stats.numRegistros} {stats.numRegistros === 1 ? 'registro' : 'registros'}
                                </span>
                            </div>
                        </div>
                        <Wallet size={140} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.15, transform: 'rotate(-15deg)' }} />
                    </div>

                    {/* Grid de Mini Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ color: '#F59E0B', background: '#F59E0B15', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <History size={20} />
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>Deudas por Pagar</p>
                                <h4 style={{ fontSize: '18px', fontWeight: '800' }}>${new Intl.NumberFormat('es-CO').format(stats.deudasPendientes)}</h4>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ color: '#3B82F6', background: '#3B82F615', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' }}>Disponible</p>
                                <h4 style={{ fontSize: '18px', fontWeight: '800' }}>${new Intl.NumberFormat('es-CO').format(Math.max(0, stats.disponible))}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Card de Presupuesto Real */}
                    <div className="card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Uso de Ingresos</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Capacidad Total: ${new Intl.NumberFormat('es-CO').format(stats.capacidadTotal)}</p>
                            </div>
                            <span style={{ padding: '4px 12px', borderRadius: '20px', background: porcentajePresupuesto > 90 ? 'var(--danger)15' : 'var(--primary)15', color: porcentajePresupuesto > 90 ? 'var(--danger)' : 'var(--primary)', fontSize: '12px', fontWeight: '700' }}>
                                {porcentajePresupuesto}%
                            </span>
                        </div>

                        <div style={{ width: '100%', height: '12px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                            <div style={{
                                width: `${porcentajePresupuesto}%`,
                                height: '100%',
                                background: porcentajePresupuesto > 90 ? 'var(--danger)' : 'var(--primary)',
                                borderRadius: '10px',
                                transition: 'width 1s ease-out'
                            }}></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: fuentesDetalle.length > 0 ? '24px' : '0' }}>
                            <span style={{ fontWeight: '700' }}>Gastado: ${new Intl.NumberFormat('es-CO').format(stats.totalGastado)}</span>
                            <span style={{ color: 'var(--text-muted)' }}>reste ${new Intl.NumberFormat('es-CO').format(Math.max(0, stats.capacidadTotal - stats.totalGastado))}</span>
                        </div>

                        {/* DESGLOSE DETALLADO */}
                        {fuentesDetalle.length > 0 && (
                            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {fuentesDetalle.map((fuente, idx) => {
                                    const idFuente = fuente.id || `f-${idx}`;
                                    const isExpanded = fuentesExpandidas.includes(idFuente);
                                    const percFuente = fuente.estimado > 0 ? Math.min(100, Math.round((fuente.gastado / fuente.estimado) * 100)) : 100;

                                    const toggleExpand = () => {
                                        setFuentesExpandidas(prev =>
                                            prev.includes(idFuente) ? prev.filter(id => id !== idFuente) : [...prev, idFuente]
                                        );
                                    };

                                    return (
                                        <div key={idFuente}>
                                            <div
                                                onClick={toggleExpand}
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--primary)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                                                    <p style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)' }}>{fuente.nombre}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '12px' }}>
                                                        <span style={{ fontWeight: '800', color: percFuente > 90 ? 'var(--danger)' : 'var(--primary)', fontSize: '15px' }}>${new Intl.NumberFormat('es-CO').format(fuente.gastado)}</span>
                                                        {fuente.estimado > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '4px' }}>/ ${new Intl.NumberFormat('es-CO').format(fuente.estimado)}</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', paddingLeft: '24px', borderLeft: '2px solid var(--primary)30' }}>
                                                    {fuente.categorias.length > 0 ? (
                                                        fuente.categorias.map((cat: any, cidx: number) => (
                                                            <div key={cidx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                                <span>{cat.nombre}</span>
                                                                <span style={{ fontWeight: '600', color: 'var(--text)' }}>${new Intl.NumberFormat('es-CO').format(cat.total)}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin gastos registrados</p>
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ width: '100%', height: '6px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden', marginBottom: '4px' }}>
                                                <div style={{
                                                    width: `${percFuente}%`,
                                                    height: '100%',
                                                    background: percFuente > 90 ? 'var(--danger)' : 'var(--primary)',
                                                    borderRadius: '10px'
                                                }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Distribución por Categoría */}
                    {categoriasSummary.length > 0 && (
                        <div className="card" style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px' }}>Distribución de Gastos</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {categoriasSummary.slice(0, 5).map((cat, i) => {
                                    const porcentaje = ((cat.total / stats.totalGastado) * 100).toFixed(0);
                                    return (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color, boxShadow: `0 0 8px ${cat.color}60` }}></div>
                                                    <span style={{ fontWeight: '600' }}>{cat.nombre}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', color: 'var(--text-muted)' }}>
                                                    <span style={{ fontWeight: '500' }}>${new Intl.NumberFormat('es-CO').format(cat.total)}</span>
                                                    <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{porcentaje}%</span>
                                                </div>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ width: `${porcentaje}%`, height: '100%', background: cat.color, borderRadius: '10px' }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}


                    {/* Actividad Reciente */}
                    <div style={{ marginTop: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Actividad Reciente</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {gastosRecientes.length > 0 ? (
                                gastosRecientes.map(g => (
                                    <div key={g.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', background: 'var(--bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: (Array.isArray(g.categorias) ? g.categorias[0]?.color : g.categorias?.color) || 'var(--primary)' }}>
                                                <Receipt size={20} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '700', fontSize: '14px' }}>{g.titulo}</p>
                                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatearFecha(g.fecha)} • {(Array.isArray(g.categorias) ? g.categorias[0]?.nombre : g.categorias?.nombre) || 'General'}</p>
                                            </div>
                                        </div>
                                        <p style={{ fontWeight: '900', fontSize: '16px', color: 'var(--danger)' }}>
                                            -${new Intl.NumberFormat('es-CO').format(g.monto)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No hay movimientos recientes.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
