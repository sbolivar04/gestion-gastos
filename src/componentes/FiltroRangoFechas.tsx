import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatearFecha, getHoyColombia } from '../utilidades/fechas';
import CalendarioPremium from './CalendarioPremium';

export type Granularidad = 'dia' | 'semana' | 'mes' | 'año' | 'periodo';

interface RangeData {
    start: Date;
    end: Date;
    granularidad: Granularidad;
    label: string;
}

interface FiltroRangoFechasProps {
    onChange: (data: RangeData) => void;
    initialGranularidad?: Granularidad;
    initialDate?: Date;
}

const PERIODOS: { id: Granularidad; label: string }[] = [
    { id: 'dia', label: 'Día' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'año', label: 'Año' },
    { id: 'periodo', label: 'Periodo' },
];

const FiltroRangoFechas = ({
    onChange,
    initialGranularidad = 'mes',
    initialDate = new Date()
}: FiltroRangoFechasProps) => {
    const [granularidad, setGranularidad] = useState<Granularidad>(initialGranularidad);
    const [fechaNavegacion, setFechaNavegacion] = useState<Date>(initialDate);

    // Estados para Periodo Personalizado
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');
    const [mostrarCalDesde, setMostrarCalDesde] = useState(false);
    const [mostrarCalHasta, setMostrarCalHasta] = useState(false);

    const getStartEnd = useCallback((date: Date, gran: Granularidad) => {
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
            case 'periodo':
                if (fechaDesde) {
                    const d = new Date(fechaDesde);
                    d.setHours(0, 0, 0, 0);
                    start.setTime(d.getTime());
                } else {
                    start.setFullYear(2000);
                }
                if (fechaHasta) {
                    const h = new Date(fechaHasta);
                    h.setHours(23, 59, 59, 999);
                    end.setTime(h.getTime());
                } else {
                    end.setFullYear(2100);
                }
                break;
            default:
                start.setFullYear(2000); end.setFullYear(2100);
        }
        return { start, end };
    }, [fechaDesde, fechaHasta]);

    const renderRangoTexto = useCallback(() => {
        const { start, end } = getStartEnd(fechaNavegacion, granularidad);
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };

        if (granularidad === 'dia') return start.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (granularidad === 'mes') return start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
        if (granularidad === 'año') return start.getFullYear().toString();

        if (granularidad === 'semana') {
            const optionsEnd: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
            return `${start.toLocaleDateString('es-CO', options)} - ${end.toLocaleDateString('es-CO', optionsEnd)}`;
        }
        if (granularidad === 'periodo') {
            if (!fechaDesde && !fechaHasta) return 'Seleccionar Periodo';
            return `${fechaDesde ? formatearFecha(fechaDesde) : '...'} - ${fechaHasta ? formatearFecha(fechaHasta) : '...'}`;
        }
        return 'Historial Completo';
    }, [fechaNavegacion, granularidad, getStartEnd, fechaDesde, fechaHasta]);

    const navegarFecha = (direccion: number) => {
        const nueva = new Date(fechaNavegacion);
        if (granularidad === 'mes') nueva.setMonth(nueva.getMonth() + direccion);
        else if (granularidad === 'dia') nueva.setDate(nueva.getDate() + direccion);
        else if (granularidad === 'semana') nueva.setDate(nueva.getDate() + (direccion * 7));
        else if (granularidad === 'año') nueva.setFullYear(nueva.getFullYear() + direccion);
        setFechaNavegacion(nueva);
    };

    useEffect(() => {
        const { start, end } = getStartEnd(fechaNavegacion, granularidad);
        onChange({
            start,
            end,
            granularidad,
            label: renderRangoTexto()
        });
    }, [granularidad, fechaNavegacion, fechaDesde, fechaHasta, getStartEnd, onChange, renderRangoTexto]);

    return (
        <div className="card" style={{ padding: '0', overflow: 'visible', marginBottom: '16px', position: 'relative', zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {PERIODOS.map(p => (
                    <button
                        key={p.id}
                        onClick={() => {
                            setGranularidad(p.id);
                            if (p.id !== 'periodo') {
                                setFechaDesde('');
                                setFechaHasta('');
                            }
                        }}
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

            {/* Navegador de Rango */}
            {granularidad !== 'periodo' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--card)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                    <button onClick={() => navegarFecha(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <ChevronLeft size={18} />
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', textTransform: 'capitalize' }}>
                        {renderRangoTexto()}
                    </span>
                    <button onClick={() => navegarFecha(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {granularidad === 'periodo' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', background: 'var(--card)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                    {/* Selector Inicio */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => {
                                setMostrarCalDesde(!mostrarCalDesde);
                                setMostrarCalHasta(false);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{ background: 'var(--bg)', border: fechaDesde ? '1.5px solid var(--primary)' : '1px solid var(--border)', borderRadius: '10px', padding: '6px 10px', fontSize: '11px', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{fechaDesde ? formatearFecha(fechaDesde) : 'Desde'}</span>
                        </button>
                        {mostrarCalDesde && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', zIndex: 2000 }}>
                                <CalendarioPremium
                                    selectedDate={fechaDesde || getHoyColombia()}
                                    onSelect={(date) => { setFechaDesde(date); setMostrarCalDesde(false); }}
                                    maxDate="2099-12-31"
                                    onClose={() => setMostrarCalDesde(false)}
                                />
                            </div>
                        )}
                    </div>

                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>-</span>

                    {/* Selector Fin */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => {
                                setMostrarCalHasta(!mostrarCalHasta);
                                setMostrarCalDesde(false);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{ background: 'var(--bg)', border: fechaHasta ? '1.5px solid var(--primary)' : '1px solid var(--border)', borderRadius: '10px', padding: '6px 10px', fontSize: '11px', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{fechaHasta ? formatearFecha(fechaHasta) : 'Hasta'}</span>
                        </button>
                        {mostrarCalHasta && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 2000 }}>
                                <CalendarioPremium
                                    selectedDate={fechaHasta || getHoyColombia()}
                                    onSelect={(date) => { setFechaHasta(date); setMostrarCalHasta(false); }}
                                    maxDate="2099-12-31"
                                    onClose={() => setMostrarCalHasta(false)}
                                />
                            </div>
                        )}
                    </div>

                    {(fechaDesde || fechaHasta) && (
                        <button
                            onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', cursor: 'pointer', marginLeft: '4px', fontWeight: '600' }}
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            )}
        </div >
    );
};

export default FiltroRangoFechas;
