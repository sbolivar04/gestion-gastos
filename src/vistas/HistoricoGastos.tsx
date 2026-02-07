import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus,
    Eye,
    FileText,
    Receipt,
    Calendar,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import CalendarioPremium from '../componentes/CalendarioPremium';
import SelectorCategoriaPremium from '../componentes/SelectorCategoriaPremium';
import SelectorPresupuestoPremium from '../componentes/SelectorPresupuestoPremium';
import { getHoyColombia, formatearFecha, getStartEnd, formatRango } from '../utilidades/fechas';
import BannerAlerta from '../componentes/BannerAlerta';
import SelectorFiltroCategoria from '../componentes/SelectorFiltroCategoria';

type Granularidad = 'dia' | 'semana' | 'mes' | 'año' | 'periodo';

const PERIODOS: { id: Granularidad; label: string }[] = [
    { id: 'dia', label: 'Día' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'año', label: 'Año' },
    { id: 'periodo', label: 'Periodo' },
];

const nombresCampos: Record<string, string> = {
    titulo: 'Título',
    monto: 'Monto',
    fecha: 'Fecha',
    categoria: 'Categoría'
};

const PALETA_COLORES = [
    '#10B981', // Esmeralda (Principal)
    '#3B82F6', // Azul
    '#8B5CF6', // Violeta
    '#EC4899', // Rosa
    '#F59E0B', // Ambar
    '#EF4444', // Rojo
    '#14B8A6', // Teal
    '#6366F1'  // Indigo
];

const HistoricoGastos = () => {
    const [gastos, setGastos] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<any[]>([]);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [titulo, setTitulo] = useState('');
    const [montoDisplay, setMontoDisplay] = useState('');
    const [montoSencillo, setMontoSencillo] = useState(0);
    const [categoriaId, setCategoriaId] = useState('');
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [colorSeleccionado, setColorSeleccionado] = useState(PALETA_COLORES[0]);
    const [mostrarNuevaCat, setMostrarNuevaCat] = useState(false);
    const [fuentes, setFuentes] = useState<any[]>([]);
    const [idIngresoFuente, setIdIngresoFuente] = useState<string>('');

    const hoy = getHoyColombia();
    const [fecha, setFecha] = useState(hoy);
    const [fechaEditada, setFechaEditada] = useState(false);
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    const [archivo, setArchivo] = useState<File | null>(null);
    const [convertirPdf, setConvertirPdf] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [errores, setErrores] = useState<string[]>([]);
    const [errorSistema, setErrorSistema] = useState<string | null>(null);
    const [mensajeExitoso, setMensajeExitoso] = useState<string | null>(null);

    // Preview State
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'image' | 'pdf' } | null>(null);

    // Estados para filtros avanzados
    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');

    // Estados para navegación de fechas
    const [granularidad, setGranularidad] = useState<Granularidad>('mes');
    const [fechaNavegacion, setFechaNavegacion] = useState<Date>(new Date());
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');
    const [mostrarCalDesde, setMostrarCalDesde] = useState(false);
    const [mostrarCalHasta, setMostrarCalHasta] = useState(false);

    // Estados para paginación
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 5;

    const navegarFecha = (direccion: number) => {
        const nuevaFecha = new Date(fechaNavegacion);
        switch (granularidad) {
            case 'dia': nuevaFecha.setDate(nuevaFecha.getDate() + direccion); break;
            case 'semana': nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7)); break;
            case 'mes': nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion); break;
            case 'año': nuevaFecha.setFullYear(nuevaFecha.getFullYear() + direccion); break;
        }
        setFechaNavegacion(nuevaFecha);
    };

    const getRangoTitulo = () => {
        if (granularidad === 'periodo') return 'Historial Personalizado';
        return formatRango(fechaNavegacion, granularidad);
    };

    const resetForm = () => {
        setTitulo('');
        setMontoDisplay('');
        setMontoSencillo(0);
        setCategoriaId('');
        setFecha(getHoyColombia());
        setFechaEditada(false);
        setArchivo(null);
        setConvertirPdf(false);
        setErrores([]);
        setMostrarNuevaCat(false);
        setNuevaCategoria('');
        setErrorSistema(null);
    };

    const handleDownload = async () => {
        if (!previewFile) return;
        try {
            const response = await fetch(previewFile.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `comprobante-${Date.now()}.${previewFile.type === 'pdf' ? 'pdf' : 'jpg'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Error downloading:", e);
            window.open(previewFile.url, '_blank');
        }
    };

    useEffect(() => {
        fetchCategorias();
    }, []);

    useEffect(() => {
        fetchFuentes();
    }, [fecha]);

    const fetchCategorias = async () => {
        const { data: catData } = await supabase.from('categorias').select('*').order('nombre');
        if (catData) {
            const sorted = [...catData].sort((a, b) => {
                if (a.nombre === 'Otros') return 1;
                if (b.nombre === 'Otros') return -1;
                return a.nombre.localeCompare(b.nombre);
            });
            setCategorias(sorted);
        }
    };

    const fetchFuentes = async () => {
        if (!fecha) return;
        const [anioStr, mesStr] = fecha.split('-');
        const mesActual = parseInt(mesStr);
        const anioActual = parseInt(anioStr);

        const { data } = await supabase
            .from('ingresos_fuentes')
            .select('*')
            .eq('mes', mesActual)
            .eq('año', anioActual)
            .order('nombre');

        if (data) setFuentes(data);
    };

    const fetchGastos = async (isNewSearch = false) => {
        setLoading(true);
        const nextPage = isNewSearch ? 0 : page + 1;
        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase.from('gastos').select('*, categorias(nombre, color)', { count: 'exact' });

        if (filtroTexto) query = query.ilike('titulo', `%${filtroTexto}%`);
        if (filtroCategoria !== 'todas') query = query.eq('id_categoria', filtroCategoria);

        if (granularidad === 'periodo') {
            if (fechaDesde) query = query.gte('fecha', fechaDesde);
            if (fechaHasta) query = query.lte('fecha', fechaHasta);
        } else {
            const { start, end } = getStartEnd(fechaNavegacion, granularidad);
            // Formatear a YYYY-MM-DD local para comparar con columna 'date'
            const startStr = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
            const endStr = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0');

            query = query.gte('fecha', startStr).lte('fecha', endStr);
        }

        query = query.order('fecha', { ascending: false }).order('creado_en', { ascending: false }).range(from, to);

        const { data, count, error } = await query;

        if (error) {
            console.error(error);
        } else if (data) {
            setGastos(prev => isNewSearch ? data : [...prev, ...data]);
            setHasMore(count ? (from + data.length < count) : false);
            setPage(nextPage);
        }
        setLoading(false);
    };

    const fetchData = () => {
        fetchCategorias();
        fetchFuentes();
        fetchGastos(true);
    };

    // Referencia para mantener la función actualizada en el closure del subscription
    const fetchGastosRef = useRef(fetchGastos);

    useEffect(() => {
        fetchGastosRef.current = fetchGastos;
    });

    useEffect(() => {
        const channel = supabase
            .channel('gastos_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, () => {
                fetchGastosRef.current(true);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchGastos(true);
        }, 300);
        return () => clearTimeout(timeout);
    }, [filtroTexto, filtroCategoria, granularidad, fechaNavegacion, fechaDesde, fechaHasta]);

    const handleMontoChange = (val: string) => {
        const numericValue = val.replace(/\D/g, '');
        const number = parseInt(numericValue) || 0;
        setMontoSencillo(number);
        setMontoDisplay(number > 0 ? new Intl.NumberFormat('es-CO').format(number) : '');
    };

    const agregarCategoria = async () => {
        if (!nuevaCategoria.trim()) return;
        const { data, error } = await supabase.from('categorias').insert([{
            nombre: nuevaCategoria,
            color: colorSeleccionado,
            usuario_id: (await supabase.auth.getUser()).data.user?.id
        }]).select();

        if (error) {
            console.error("Error al crear categoría:", error.message);
            return;
        }

        if (data) {
            setCategorias([...categorias, data[0]]);
            setCategoriaId(data[0].id);
            setNuevaCategoria('');
            setMostrarNuevaCat(false);
        }
    };

    const handleUpdateCategory = async (id: string, newName: string) => {
        const { error } = await supabase.from('categorias').update({ nombre: newName }).eq('id', id);
        if (!error) {
            setCategorias(prev => prev.map(c => c.id === id ? { ...c, nombre: newName } : c).sort((a, b) => {
                if (a.nombre === 'Otros') return 1;
                if (b.nombre === 'Otros') return -1;
                return a.nombre.localeCompare(b.nombre);
            }));
        } else {
            console.error("Error al actualizar categoría:", error.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const nuevosErrores = [];
        if (!titulo.trim()) nuevosErrores.push('titulo');
        if (!montoSencillo) nuevosErrores.push('monto');
        if (!categoriaId) nuevosErrores.push('categoria');

        if (nuevosErrores.length > 0) {
            setErrores(nuevosErrores);
            setTimeout(() => setErrores([]), 3000);
            return;
        }

        setEnviando(true);
        setErrores([]);

        const tituloLimpio = titulo.trim();
        const tituloFormateado = tituloLimpio.charAt(0).toUpperCase() + tituloLimpio.slice(1).toLowerCase();

        let url = '';
        let finalFile: any = archivo;

        if (archivo && convertirPdf && archivo.type.startsWith('image/')) {
            try {
                const { jsPDF } = await import('jspdf');
                const doc = new jsPDF();
                const img = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target?.result as string);
                    reader.readAsDataURL(archivo);
                });
                doc.addImage(img, 'JPEG', 10, 10, 190, 0);
                const blob = doc.output('blob');
                finalFile = new File([blob], archivo.name.replace(/\.[^/.]+$/, "") + ".pdf", { type: 'application/pdf' });
            } catch (err) {
                console.error("Error convirtiendo a PDF:", err);
            }
        }

        if (finalFile) {
            const name = `${Date.now()}-${finalFile.name}`;
            const { data } = await supabase.storage.from('comprobantes').upload(name, finalFile);
            if (data) url = name;
        }

        const { error } = await supabase.from('gastos').insert([{
            titulo: tituloFormateado,
            monto: montoSencillo,
            id_categoria: categoriaId || null,
            fecha,
            comprobante_url: url,
            id_usuario: (await supabase.auth.getUser()).data.user?.id,
            id_ingreso_fuente: idIngresoFuente || null
        }]);

        if (!error) {
            resetForm();
            setMensajeExitoso('¡Gasto registrado con éxito!');
            setMostrarForm(false);
            fetchData();
        } else {
            console.error(error);
            setErrorSistema('Hubo un problema al guardar el gasto. Inténtalo de nuevo.');
        }
        setEnviando(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Movimientos</h2>
                <button
                    onClick={() => {
                        if (mostrarForm) resetForm();
                        setMostrarForm(!mostrarForm);
                    }}
                    className="btn-pill btn-pill-primary"
                    style={{ padding: '0', width: '48px', height: '48px', borderRadius: '16px', border: 'none', outline: 'none' }}
                    title={mostrarForm ? "Cerrar Formulario" : "Agregar Gasto"}
                >
                    {mostrarForm ? <Plus size={24} style={{ transform: 'rotate(45deg)' }} /> : <Plus size={24} />}
                </button>
            </div>


            {
                mostrarForm && (
                    <div className="card fade-in" style={{ border: '2px solid var(--primary)', position: 'relative', marginBottom: '8px' }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Registrar Gasto</h3>

                        {errorSistema && <BannerAlerta mensaje="Error de Registro" subtitulo={errorSistema} onClose={() => setErrorSistema(null)} />}

                        {errores.length > 0 && (
                            <BannerAlerta
                                mensaje="Atención"
                                subtitulo={`Por favor, completa los campos requeridos: ${errores.map(id => nombresCampos[id]).join(', ')}.`}
                                onClose={() => setErrores([])}
                            />
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={e => { setTitulo(e.target.value); if (e.target.value) setErrores(prev => prev.filter(err => err !== 'titulo')); }}
                                    placeholder="¿Qué compraste?"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: errores.includes('titulo') ? '1.5px solid var(--danger)' : (titulo ? '1.5px solid var(--primary)' : '1.5px solid var(--border)'),
                                        backgroundColor: errores.includes('titulo') ? 'rgba(239, 68, 68, 0.02)' : 'var(--card)',
                                        color: 'var(--text)',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 150px', position: 'relative' }}>
                                    {montoSencillo > 0 && <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', pointerEvents: 'none' }}>$</span>}
                                    <input
                                        type="text"
                                        value={montoDisplay}
                                        onChange={e => { handleMontoChange(e.target.value); if (parseInt(e.target.value.replace(/\D/g, '')) > 0) setErrores(prev => prev.filter(err => err !== 'monto')); }}
                                        placeholder="Monto ($0)"
                                        style={{
                                            padding: montoSencillo > 0 ? '12px 12px 12px 24px' : '12px',
                                            borderRadius: '12px',
                                            border: errores.includes('monto') ? '1.5px solid var(--danger)' : (montoSencillo > 0 ? '1.5px solid var(--primary)' : '1.5px solid var(--border)'),
                                            backgroundColor: errores.includes('monto') ? 'rgba(239, 68, 68, 0.02)' : 'var(--card)',
                                            color: 'var(--text)',
                                            width: '100%',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: '1 1 150px', position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => setMostrarCalendario(!mostrarCalendario)}
                                        title="Seleccionar Fecha"
                                        style={{
                                            width: '100%',
                                            background: errores.includes('fecha') ? 'rgba(239, 68, 68, 0.02)' : 'var(--card)',
                                            border: errores.includes('fecha') ? '1.5px solid var(--danger)' : (fechaEditada ? '1.5px solid var(--primary)' : '1.5px solid var(--border)'),
                                            borderRadius: '12px',
                                            padding: '10px 12px',
                                            fontSize: '14px',
                                            color: 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            outline: 'none'
                                        }}
                                    >
                                        <span>{formatearFecha(fecha)}</span>
                                        <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                </div>
                            </div>

                            {mostrarCalendario && (
                                <div style={{ position: 'absolute', top: '150px', right: '0', zIndex: 100, width: '220px', boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                    <CalendarioPremium
                                        selectedDate={fecha}
                                        maxDate={hoy}
                                        onSelect={(d) => {
                                            setFecha(d);
                                            setFechaEditada(true);
                                            setMostrarCalendario(false);
                                        }}
                                        onClose={() => setMostrarCalendario(false)}
                                    />
                                </div>
                            )}

                            <SelectorCategoriaPremium
                                categorias={categorias}
                                categoryId={categoriaId}
                                onSelect={(id) => { setCategoriaId(id); setErrores(prev => prev.filter(err => err !== 'categoria')); }}
                                onAddNew={() => setMostrarNuevaCat(true)}
                                error={errores.includes('categoria')}
                                onEdit={handleUpdateCategory}
                            />

                            {fuentes.length > 0 && (
                                <SelectorPresupuestoPremium
                                    fuentes={fuentes}
                                    fuenteId={idIngresoFuente}
                                    onSelect={(id) => setIdIngresoFuente(id)}
                                />
                            )}

                            {mostrarNuevaCat && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', background: 'var(--bg)', borderRadius: '16px', border: '1.5px solid var(--border)', animation: 'fadeIn 0.2s ease-out' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            value={nuevaCategoria}
                                            onChange={e => setNuevaCategoria(e.target.value)}
                                            placeholder="Nombre de categoría"
                                            autoFocus
                                            style={{
                                                width: '100%',
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '12px',
                                                border: '1.5px solid var(--border)',
                                                outline: 'none',
                                                background: 'var(--card)',
                                                color: 'var(--text)',
                                                transition: 'border-color 0.2s',
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                                        />
                                        <button type="button" onClick={() => setMostrarNuevaCat(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px' }}>
                                        {PALETA_COLORES.map(col => (
                                            <button
                                                key={col}
                                                type="button"
                                                onClick={() => setColorSeleccionado(col)}
                                                style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    background: col,
                                                    border: colorSeleccionado === col ? '3px solid white' : 'none',
                                                    boxShadow: colorSeleccionado === col ? `0 0 0 2px ${col}` : 'none',
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s',
                                                    transform: colorSeleccionado === col ? 'scale(1.1)' : 'scale(1)'
                                                }}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={agregarCategoria}
                                        className="btn-pill btn-pill-primary"
                                        style={{ width: '100%', borderRadius: '12px', border: 'none', outline: 'none', height: '40px' }}
                                    >
                                        Guardar Categoría
                                    </button>
                                </div>
                            )}

                            <div className="custom-file-upload" style={{ position: 'relative', border: '2px dashed var(--border)', borderRadius: '12px', padding: '16px', background: 'var(--card)' }}>
                                <input type="file" onChange={e => setArchivo(e.target.files?.[0] || null)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                                    <FileText size={20} style={{ marginBottom: '4px' }} /><br />
                                    {archivo ? archivo.name : 'Subir Comprobante (Opcional)'}
                                </div>
                                {archivo && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setArchivo(null); setConvertirPdf(false); }}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: 'var(--danger)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: 'bold'
                                        }}
                                        title="Eliminar archivo"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {archivo && archivo.type.startsWith('image/') && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg)', padding: '12px', borderRadius: '12px' }}>
                                    <input
                                        type="checkbox"
                                        checked={convertirPdf}
                                        onChange={e => setConvertirPdf(e.target.checked)}
                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '14px' }}>¿Convertir imagen a PDF?</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn-pill btn-pill-primary"
                                disabled={enviando || !titulo.trim() || !montoSencillo || !categoriaId}
                                style={{ border: 'none', outline: 'none', width: '100%' }}
                            >
                                {enviando ? 'Guardando...' : 'Guardar Gasto'}
                            </button>
                        </form>
                    </div>
                )
            }


            {/* Barra de Filtros */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Buscador */}
                    <div style={{ flex: '2 1 200px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={filtroTexto}
                            onChange={e => setFiltroTexto(e.target.value)}
                            placeholder="Buscar gasto..."
                            style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '16px', border: '1.5px solid var(--border)', background: 'var(--card)', color: 'var(--text)', outline: 'none', fontSize: '14px' }}
                        />
                    </div>
                    {/* Selector de Categoría Premium */}
                    <SelectorFiltroCategoria
                        categorias={categorias}
                        value={filtroCategoria}
                        onChange={(val) => setFiltroCategoria(val)}
                    />
                </div>

                {/* Navegador de Fechas */}
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

                    {granularidad !== 'periodo' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--card)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                            <button onClick={() => navegarFecha(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)', textTransform: 'capitalize' }}>
                                {getRangoTitulo()}
                            </span>
                            <button onClick={() => navegarFecha(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', background: 'var(--card)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setMostrarCalDesde(!mostrarCalDesde)}
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
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setMostrarCalHasta(!mostrarCalHasta)}
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
                                <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', cursor: 'pointer', marginLeft: '4px', fontWeight: '600' }}>
                                    Limpiar
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                {loading && page === 0 ? <p style={{ textAlign: 'center', padding: '40px' }}>Cargando...</p> :
                    <>
                        {gastos.map(g => (
                            <div key={g.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                    <div style={{ width: '44px', height: '44px', background: 'var(--bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.categorias?.color || 'var(--primary)' }}>
                                        <Receipt size={22} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: '700', fontSize: '15px' }}>{g.titulo}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatearFecha(g.fecha)} • {g.categorias?.nombre || 'General'}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '140px', justifyContent: 'flex-end' }}>
                                    <p style={{ fontWeight: '800', fontSize: '16px', color: 'var(--danger)', textAlign: 'right' }}>
                                        -${new Intl.NumberFormat('es-CO').format(g.monto)}
                                    </p>
                                    <div style={{ width: '36px', display: 'flex', justifyContent: 'center' }}>
                                        {g.comprobante_url && (
                                            <button
                                                onClick={() => {
                                                    const fullUrl = `https://yupaibsqnxfismckuqje.supabase.co/storage/v1/object/public/comprobantes/${g.comprobante_url}`;
                                                    const isPdf = g.comprobante_url.toLowerCase().endsWith('.pdf');
                                                    setPreviewFile({ url: fullUrl, type: isPdf ? 'pdf' : 'image' });
                                                }}
                                                style={{ color: 'var(--text-muted)', padding: '8px' }}
                                                title="Ver factura"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                }
                {!loading && gastos.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No hay movimientos.</p>}

                {!loading && hasMore && gastos.length > 0 && (
                    <button
                        onClick={() => fetchGastos(false)}
                        className="btn-hover-soft"
                        style={{
                            padding: '12px',
                            background: 'var(--card)',
                            border: '1.5px solid var(--border)',
                            borderRadius: '16px',
                            color: 'var(--primary)',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        Mostrar más movimientos
                    </button>
                )}
            </div>

            {
                previewFile && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }} onClick={() => setPreviewFile(null)}>
                        <div className="fade-in" style={{ position: 'relative', width: 'auto', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                            <div style={{ position: 'absolute', top: '-50px', right: 0, display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={handleDownload}
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
                                    title="Descargar"
                                >
                                    <Download size={18} /> Descargar
                                </button>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', fontSize: '20px' }}
                                    title="Cerrar"
                                >
                                    ✕
                                </button>
                            </div>

                            {previewFile.type === 'image' ? (
                                <img src={previewFile.url} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)' }} />
                            ) : (
                                <div style={{ width: '90vw', maxWidth: '800px', height: '80vh', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)' }}>
                                    <iframe src={previewFile.url} style={{ width: '100%', height: '100%', border: 'none' }} title="Vista previa PDF" />
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
            {
                mensajeExitoso && (
                    <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 3000, width: '90%', maxWidth: '400px' }}>
                        <BannerAlerta tipo="success" mensaje="Operación Exitosa" subtitulo={mensajeExitoso} onClose={() => setMensajeExitoso(null)} />
                    </div>
                )
            }
        </div >
    );
};

export default HistoricoGastos;
