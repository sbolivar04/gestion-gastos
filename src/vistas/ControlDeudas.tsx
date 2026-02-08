import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
    Plus,
    Eye,
    FileText,
    Calendar,
    Download,
    Trash2,
    Users,
    Wallet,
    AlertTriangle,
    X,
    Search,
    User,
} from 'lucide-react';

import CalendarioPremium from '../componentes/CalendarioPremium';
import { getHoyColombia, formatearFecha } from '../utilidades/fechas';
import { formatearNombreMostrar } from '../utilidades/formato';
import BannerAlerta from '../componentes/BannerAlerta';
import FiltroRangoFechas from '../componentes/FiltroRangoFechas';

const nombresCampos: Record<string, string> = {
    titulo: 'Título',
    monto: 'Monto'
};

const ControlDeudas = () => {
    const [deudas, setDeudas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userLogueado, setUserLogueado] = useState<any>(null);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [mostrarCalendario, setMostrarCalendario] = useState(false);

    // Form State
    const [titulo, setTitulo] = useState('');
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [fechaLimite, setFechaLimite] = useState('');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [convertirPdf, setConvertirPdf] = useState(false);
    const [errores, setErrores] = useState<string[]>([]);
    const [enviando, setEnviando] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'pdf' } | null>(null);

    // Sharing State
    const [deudaACompartir, setDeudaACompartir] = useState<any | null>(null);
    const [queryUsuario, setQueryUsuario] = useState('');
    const [usuariosSugeridos, setUsuariosSugeridos] = useState<any[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [participantes, setParticipantes] = useState<any[]>([]);
    const [agregando, setAgregando] = useState(false);
    const [deudaAEliminar, setDeudaAEliminar] = useState<any | null>(null);

    // Abonos State
    const [deudaAbonos, setDeudaAbonos] = useState<any | null>(null);
    const [abonos, setAbonos] = useState<any[]>([]);
    const [montoAbono, setMontoAbono] = useState('');
    const [montoCargos, setMontoCargos] = useState('');
    const [notasAbono, setNotasAbono] = useState('');
    const [enviandoAbono, setEnviandoAbono] = useState(false);
    const [errorSistema, setErrorSistema] = useState<string | null>(null);
    const [mensajeExitoso, setMensajeExitoso] = useState<string | null>(null);

    // Estados para filtros avanzados
    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'todas' | 'pendientes' | 'pagadas'>('todas');

    // Estado consolidado de rango de fechas
    const [rangoSeleccionado, setRangoSeleccionado] = useState<any>(null);

    // Estados para paginación
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 5;



    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getUser();
            setUserLogueado(data.user);
        };
        init();
    }, []);

    useEffect(() => {
        if (!userLogueado || !rangoSeleccionado) return;
        const delayDebounce = setTimeout(() => {
            fetchDeudas(true);
        }, filtroTexto ? 400 : 0);
        return () => clearTimeout(delayDebounce);
    }, [filtroTexto, filtroEstado, rangoSeleccionado, userLogueado]);

    useEffect(() => {
        if (errores.length > 0) {
            const timer = setTimeout(() => setErrores([]), 3000);
            return () => clearTimeout(timer);
        }
    }, [errores]);

    useEffect(() => {
        if (queryUsuario.trim().length > 2) {
            const debounce = setTimeout(() => buscarUsuarios(queryUsuario), 300);
            return () => clearTimeout(debounce);
        } else {
            setUsuariosSugeridos([]);
        }
    }, [queryUsuario]);

    const buscarUsuarios = async (q: string) => {
        setBuscando(true);
        const { data } = await supabase
            .from('perfiles')
            .select('id, nombre_usuario, nombre_completo')
            .ilike('nombre_usuario', `%${q}%`)
            .limit(5);

        const filtrados = (data || []).filter(u => u.id !== userLogueado?.id && !participantes.some(p => p.id_usuario === u.id));
        setUsuariosSugeridos(filtrados);
        setBuscando(false);
    };

    const fetchParticipantes = async (idDeuda: string) => {
        const { data } = await supabase
            .from('participantes_deuda_compartida')
            .select('*, perfiles!id_usuario(nombre_usuario, nombre_completo)')
            .eq('id_deuda', idDeuda);
        setParticipantes(data || []);
    };

    const anadirParticipante = async (idUsuario: string) => {
        if (!deudaACompartir) return;
        setAgregando(true);
        const { error } = await supabase
            .from('participantes_deuda_compartida')
            .insert([{
                id_deuda: deudaACompartir.id,
                id_usuario: idUsuario,
                nivel_permiso: 'lectura'
            }]);

        if (!error) {
            // Marcar deuda como compartida si se añadió el primer participante
            await supabase.from('deudas').update({ es_compartida: true }).eq('id', deudaACompartir.id);
            await fetchParticipantes(deudaACompartir.id);
            await fetchDeudas(true);
            setQueryUsuario('');
            setUsuariosSugeridos([]);
        }
        setAgregando(false);
    };

    const eliminarParticipante = async (idParticipante: string) => {
        const { error } = await supabase
            .from('participantes_deuda_compartida')
            .delete()
            .eq('id', idParticipante);

        if (!error && deudaACompartir) {
            await fetchParticipantes(deudaACompartir.id);
            // Si no quedan participantes, marcar como no compartida
            const { data: restantes } = await supabase.from('participantes_deuda_compartida').select('id').eq('id_deuda', deudaACompartir.id);
            if (!restantes || restantes.length === 0) {
                await supabase.from('deudas').update({ es_compartida: false }).eq('id', deudaACompartir.id);
            }
            await fetchDeudas(true);
        }
    };

    const fetchAbonos = async (idDeuda: string) => {
        const { data } = await supabase
            .from('abonos_deuda')
            .select('*, perfiles!creado_por(nombre_completo)')
            .eq('id_deuda', idDeuda)
            .order('creado_en', { ascending: false });
        if (data) setAbonos(data);
    };

    const handleRegistrarAbono = async () => {
        if (!deudaAbonos || enviandoAbono) return;

        const montoNumerico = parseFloat(montoAbono.replace(/\D/g, ''));
        if (!montoAbono || isNaN(montoNumerico) || montoNumerico <= 0) {
            alert('Por favor, ingresa un monto válido.');
            return;
        }

        if (deudaAbonos.estado === 'pagada' || (deudaAbonos.monto_pagado || 0) >= parseFloat(deudaAbonos.monto_total)) {
            alert('¡Esta deuda ya está totalmente pagada!');
            return;
        }

        if (!archivo) {
            alert('El comprobante de pago es obligatorio.');
            return;
        }

        setEnviandoAbono(true);

        try {
            let comprobantePath = null;
            let finalFile: any = archivo;

            if (archivo && convertirPdf && archivo.type.startsWith('image/')) {
                try {
                    const { jsPDF } = await import('jspdf');

                    const imageData = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (ev) => resolve(ev.target?.result as string);
                        reader.readAsDataURL(archivo);
                    });

                    const img = new Image();
                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.src = imageData;
                    });

                    const rawWidth = img.width;
                    const rawHeight = img.height;
                    const pdfWidth = 190;
                    const pdfHeight = (rawHeight * pdfWidth) / rawWidth;

                    const doc = new jsPDF({
                        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                        unit: 'mm',
                        format: [pdfWidth + 20, pdfHeight + 20]
                    });

                    doc.addImage(imageData, 'JPEG', 10, 10, pdfWidth, pdfHeight);
                    const blob = doc.output('blob');
                    finalFile = new File([blob], archivo.name.replace(/\.[^/.]+$/, "") + ".pdf", { type: 'application/pdf' });
                } catch (err) {
                    console.error("Error convirtiendo a PDF:", err);
                }
            }

            if (finalFile) {
                const fileName = `abonos/${Date.now()}-${finalFile.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('comprobantes')
                    .upload(fileName, finalFile);

                if (uploadError) throw uploadError;
                comprobantePath = fileName;
            }

            if (!userLogueado) throw new Error("No hay un usuario logueado");

            const montoTotal = parseFloat(montoAbono.replace(/\D/g, '')) || 0;
            const cargos = parseFloat(montoCargos.replace(/\D/g, '')) || 0;
            const abonoNeto = montoTotal - cargos;

            if (abonoNeto <= 0) {
                throw new Error("El cargo no puede ser mayor o igual al pago total.");
            }

            const { error } = await supabase.from('abonos_deuda').insert([{
                id_deuda: deudaAbonos.id,
                creado_por: userLogueado.id,
                monto_abonado: abonoNeto,
                monto_total_pago: montoTotal,
                monto_cargos: cargos,
                comprobante_url: comprobantePath,
                notas: notasAbono || null,
                fecha_pago: getHoyColombia()
            }]);

            if (error) throw error;

            // Verificar si la deuda se completó con este abono
            // Actualizar el monto pagado y verificar si se completó
            const nuevoTotalPagado = (deudaAbonos.monto_pagado || 0) + abonoNeto;
            const nuevoEstado = nuevoTotalPagado >= Number(deudaAbonos.monto_total) ? 'pagada' : 'pendiente';

            await supabase.from('deudas').update({
                monto_pagado: nuevoTotalPagado,
                estado: nuevoEstado
            }).eq('id', deudaAbonos.id);

            resetAbonosForm();
            setMensajeExitoso('¡Abono registrado con éxito!');
            fetchAbonos(deudaAbonos.id);
            fetchDeudas(true); // Fetch all deudas again to update the list
        } catch (e: any) {
            console.error(e);
            setErrorSistema(e.message || 'Error al registrar abono');
        } finally {
            setEnviandoAbono(false);
        }
    };

    const resetForm = () => {
        setTitulo('');
        setMonto('');
        setDescripcion('');
        setFechaLimite('');
        setArchivo(null);
        setConvertirPdf(false);
        setErrores([]);
        setErrorSistema(null);
    };

    const resetAbonosForm = () => {
        setMontoAbono('');
        setMontoCargos('');
        setNotasAbono('');
        setArchivo(null);
        setConvertirPdf(false);
        setErrorSistema(null);
    };

    const fetchDeudas = async (isNewSearch = false) => {
        setLoading(true);
        const nextPage = isNewSearch ? 0 : page + 1;
        const from = nextPage * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
            .from('deudas')
            .select('*, abonos_deuda(monto_abonado), perfiles!id_propietario(nombre_completo)', { count: 'exact' })
            .order('creado_en', { ascending: false })
            .range(from, to);

        // Filtros en DB
        if (filtroTexto) query = query.ilike('titulo', `%${filtroTexto}%`);
        if (filtroEstado === 'pagadas') query = query.eq('estado', 'pagada');
        if (filtroEstado === 'pendientes') query = query.neq('estado', 'pagada');

        const { start, end } = rangoSeleccionado;
        query = query.gte('creado_en', start.toISOString()).lte('creado_en', end.toISOString());

        const { data, count, error } = await query;

        if (error) {
            console.error('Error fetching deudas:', error);
        } else if (data) {
            setDeudas(prev => isNewSearch ? data : [...prev, ...data]);
            setHasMore(count ? (from + data.length < count) : false);
            setPage(nextPage);

            // Actualizar datos del modal si está abierto para reflejar saldos nuevos
            if (deudaAbonos) {
                const actualizada = data.find(d => d.id === deudaAbonos.id);
                if (actualizada) setDeudaAbonos(actualizada);
            }
        }
        setLoading(false);
    };

    // Referencia para mantener la función actualizada en el closure del subscription
    const fetchDeudasRef = useRef(fetchDeudas);

    useEffect(() => {
        fetchDeudasRef.current = fetchDeudas;
    });

    useEffect(() => {
        const channel = supabase
            .channel('deudas_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deudas' }, () => {
                fetchDeudasRef.current(true);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'abonos_deuda' }, () => {
                fetchDeudasRef.current(true);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        if (enviando) return;

        const nuevosErrores: string[] = [];
        if (!titulo.trim()) nuevosErrores.push('titulo');
        const montoNum = parseInt(monto.replace(/\D/g, ''));
        if (!monto || isNaN(montoNum) || montoNum === 0) nuevosErrores.push('monto');

        if (nuevosErrores.length > 0) {
            setErrores(nuevosErrores);
            return;
        }

        setEnviando(true);
        const user = (await supabase.auth.getUser()).data.user;

        let url = '';
        let finalFile: any = archivo;

        if (archivo && convertirPdf && archivo.type.startsWith('image/')) {
            try {
                const { jsPDF } = await import('jspdf');

                // Obtener datos de la imagen y sus dimensiones reales
                const imageData = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target?.result as string);
                    reader.readAsDataURL(archivo);
                });

                const img = new Image();
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.src = imageData;
                });

                const rawWidth = img.width;
                const rawHeight = img.height;

                // Definimos un ancho estándar en mm (por ejemplo, el ancho de un A4 menos márgenes)
                const pdfWidth = 190;
                // Calculamos el alto proporcional en mm
                const pdfHeight = (rawHeight * pdfWidth) / rawWidth;

                // Creamos el PDF con el tamaño exacto necesario para la imagen (más márgenes de 10mm por lado)
                const doc = new jsPDF({
                    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: [pdfWidth + 20, pdfHeight + 20]
                });

                doc.addImage(imageData, 'JPEG', 10, 10, pdfWidth, pdfHeight);
                const blob = doc.output('blob');
                finalFile = new File([blob], archivo.name.replace(/\.[^/.]+$/, "") + ".pdf", { type: 'application/pdf' });
            } catch (err) {
                console.error("Error convirtiendo a PDF:", err);
            }
        }

        if (finalFile) {
            const name = `deudas/${Date.now()}-${finalFile.name}`;
            const { data } = await supabase.storage.from('comprobantes').upload(name, finalFile);
            if (data) url = name;
        }

        const tituloLimpio = titulo.trim();
        const tituloFormateado = tituloLimpio.charAt(0).toUpperCase() + tituloLimpio.slice(1).toLowerCase();

        const { error } = await supabase.from('deudas').insert([{
            titulo: tituloFormateado,
            monto_total: montoNum,
            descripcion,
            fecha_limite: fechaLimite || null,
            comprobante_url: url,
            id_propietario: user?.id
        }]);

        if (!error) {
            resetForm();
            setMensajeExitoso('¡Deuda creada con éxito!');
            setMostrarForm(false);
            fetchDeudas(true);
        } else {
            console.error(error);
            setErrorSistema('No se pudo guardar la deuda. Por favor verifica los datos.');
        }
        setEnviando(false);
    };

    const handleEliminar = async () => {
        if (!deudaAEliminar) return;

        try {
            const archivosAEliminar: string[] = [];

            if (deudaAEliminar.comprobante_url) {
                archivosAEliminar.push(deudaAEliminar.comprobante_url);
            }

            const { data: abonosData } = await supabase
                .from('abonos_deuda')
                .select('comprobante_url')
                .eq('id_deuda', deudaAEliminar.id);

            if (abonosData) {
                abonosData.forEach(a => {
                    if (a.comprobante_url) archivosAEliminar.push(a.comprobante_url);
                });
            }

            if (archivosAEliminar.length > 0) {
                await supabase.storage
                    .from('comprobantes')
                    .remove(archivosAEliminar);
            }

            const { error } = await supabase.from('deudas').delete().eq('id', deudaAEliminar.id);

            if (!error) {
                fetchDeudas(true);
                setDeudaAEliminar(null);
            } else {
                setErrorSistema("No se pudo eliminar la deuda por un error en la base de datos.");
            }
        } catch (error: any) {
            console.error("Error al eliminar:", error);
            setErrorSistema("Ocurrió un error inesperado.");
        }
    };

    const handleDownload = async (url: string, isPdfStr: boolean) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `comprobante-${Date.now()}.${isPdfStr ? 'pdf' : 'jpg'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Error downloading:", e);
            window.open(url, '_blank');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Deudas</h2>

                <button onClick={() => {
                    if (mostrarForm) resetForm();
                    setMostrarForm(!mostrarForm);
                }} className="btn-pill btn-pill-primary" style={{ padding: '0', width: '40px', height: '40px', borderRadius: '12px', border: 'none', outline: 'none', flexShrink: 0 }}>
                    {mostrarForm ? <Plus size={20} style={{ transform: 'rotate(45deg)' }} /> : <Plus size={20} />}
                </button>
            </div>


            {mostrarForm && (
                <div className="card fade-in" style={{ border: '2px solid var(--primary)', position: 'relative' }}>
                    <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Nueva Deuda</h3>

                    {errorSistema && <BannerAlerta mensaje="Error del Sistema" subtitulo={errorSistema} onClose={() => setErrorSistema(null)} />}

                    {errores.length > 0 && (
                        <BannerAlerta
                            mensaje="Atención"
                            subtitulo={`Por favor, completa los campos requeridos: ${errores.map(id => nombresCampos[id]).join(', ')}.`}
                            onClose={() => setErrores([])}
                        />
                    )}

                    <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input
                            type="text"
                            value={titulo}
                            onChange={e => { setTitulo(e.target.value); if (e.target.value) setErrores(prev => prev.filter(err => err !== 'titulo')); }}
                            placeholder="Título (ej: Préstamo a Juan)"
                            style={{
                                padding: '12px',
                                borderRadius: '12px',
                                border: errores.includes('titulo') ? '1.5px solid var(--danger)' : (titulo ? '1.5px solid var(--primary)' : '1.5px solid var(--border)'),
                                background: errores.includes('titulo') ? 'rgba(239, 68, 68, 0.02)' : 'var(--card)',
                                color: 'var(--text)',
                                outline: 'none'
                            }}
                            autoFocus
                        />

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 150px', position: 'relative' }}>
                                {monto && <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', pointerEvents: 'none' }}>$</span>}
                                <input
                                    type="text"
                                    value={monto}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setMonto(val ? new Intl.NumberFormat('es-CO').format(parseInt(val)) : '');
                                        if (parseInt(val) > 0) setErrores(prev => prev.filter(err => err !== 'monto'));
                                    }}
                                    placeholder="Monto ($0)"
                                    style={{
                                        padding: monto ? '12px 12px 12px 24px' : '12px',
                                        borderRadius: '12px',
                                        border: errores.includes('monto') ? '1.5px solid var(--danger)' : (monto ? '1.5px solid var(--primary)' : '1.5px solid var(--border)'),
                                        background: errores.includes('monto') ? 'rgba(239, 68, 68, 0.02)' : 'var(--card)',
                                        color: 'var(--text)',
                                        outline: 'none',
                                        width: '100%'
                                    }}
                                />
                            </div>

                            <div style={{ flex: '1 1 150px', position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => setMostrarCalendario(!mostrarCalendario)}
                                    title="Seleccionar Fecha Límite"
                                    style={{
                                        width: '100%',
                                        background: 'var(--card)',
                                        border: fechaLimite ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                                        borderRadius: '12px',
                                        padding: '10px 12px',
                                        fontSize: '14px',
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span>{fechaLimite ? formatearFecha(fechaLimite) : 'Fecha límite (opcional)'}</span>
                                    <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                                </button>
                                {mostrarCalendario && (
                                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100 }}>
                                        <CalendarioPremium
                                            selectedDate={fechaLimite || getHoyColombia()}
                                            onSelect={(date) => { setFechaLimite(date); setMostrarCalendario(false); }}
                                            maxDate="2099-12-31"
                                            onClose={() => setMostrarCalendario(false)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <textarea
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            placeholder="Notas adicionales..."
                            style={{
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1.5px solid var(--border)',
                                background: 'var(--card)',
                                color: 'var(--text)',
                                minHeight: '80px',
                                fontFamily: 'inherit',
                                outline: 'none'
                            }}
                        />

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
                            disabled={enviando || !titulo.trim() || !monto || parseInt(monto.replace(/\D/g, '')) === 0}
                            style={{ borderRadius: '12px', border: 'none', width: '100%', outline: 'none' }}
                        >
                            {enviando ? 'Guardando...' : 'Guardar Deuda'}
                        </button>
                    </form>
                </div>
            )}

            {/* Barra de Filtros (Buscador y Estados)  */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Buscador */}
                    <div style={{ position: 'relative', flex: '2 1 200px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar deuda..."
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 48px',
                                borderRadius: '16px',
                                border: '1.5px solid var(--border)',
                                background: 'var(--card)',
                                color: 'var(--text)',
                                outline: 'none',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>

                    {/* Filtro Estado */}
                    <div style={{ flex: '1 1 250px', display: 'flex', gap: '6px', background: 'var(--card)', padding: '4px', borderRadius: '16px', border: '1.5px solid var(--border)', userSelect: 'none' }}>
                        {(['todas', 'pendientes', 'pagadas'] as const).map((estado) => (
                            <button
                                key={estado}
                                onClick={() => setFiltroEstado(estado)}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: filtroEstado === estado ? 'var(--primary)' : 'transparent',
                                    color: filtroEstado === estado ? 'white' : 'var(--text-muted)',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {estado}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navegador de Rango de Fecha Centralizado */}
                <FiltroRangoFechas onChange={setRangoSeleccionado} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading ? <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</p> :
                    deudas.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '24px' }}>
                            <div style={{ width: '64px', height: '64px', background: 'var(--bg)', borderRadius: '20px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                <Wallet size={32} />
                            </div>
                            <p style={{ color: 'var(--text-muted)' }}>No tienes deudas registradas.</p>
                        </div>
                    ) : (
                        deudas.map(d => (
                            <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', gap: '16px' }}>
                                {(() => {
                                    const porcentaje = Math.round((d.monto_pagado / d.monto_total) * 100) || 0;
                                    let colorProgreso = 'var(--danger)';
                                    if (porcentaje >= 67) colorProgreso = 'var(--primary)';
                                    else if (porcentaje >= 34) colorProgreso = 'var(--warning)';

                                    return (
                                        <div style={{ position: 'relative', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <svg width="48" height="48" viewBox="0 0 48 48">
                                                <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border)" strokeWidth="4" />
                                                <circle
                                                    cx="24" cy="24" r="20" fill="none"
                                                    stroke={colorProgreso} strokeWidth="4"
                                                    strokeDasharray="125.6"
                                                    strokeDashoffset={125.6 - (125.6 * Math.min((d.monto_pagado / d.monto_total) || 0, 1))}
                                                    strokeLinecap="round"
                                                    transform="rotate(-90 24 24)"
                                                    style={{ transition: 'all 0.5s ease' }}
                                                />
                                            </svg>
                                            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '10px', fontWeight: '900', color: colorProgreso }}>
                                                    {porcentaje}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <p style={{
                                            fontWeight: '700',
                                            fontSize: '15px',
                                            color: 'var(--text)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%'
                                        }}>
                                            {d.titulo}
                                        </p>
                                        {d.es_compartida && (
                                            <span style={{ fontSize: '9px', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '1px 6px', borderRadius: '8px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                                Compartida
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {d.id_propietario !== userLogueado?.id && d.perfiles?.nombre_completo
                                            ? `Dueño: ${d.perfiles.nombre_completo}`
                                            : (d.descripcion || 'Sin descripción')}
                                        {d.fecha_limite && ` • Vence: ${formatearFecha(d.fecha_limite)}`}
                                    </p>
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 'fit-content' }}>
                                    <p style={{ fontWeight: '800', fontSize: '16px', color: 'var(--danger)' }}>${new Intl.NumberFormat('es-CO').format(d.monto_total)}</p>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                        {d.comprobante_url && (
                                            <button
                                                onClick={() => {
                                                    const fullUrl = `https://yupaibsqnxfismckuqje.supabase.co/storage/v1/object/public/comprobantes/${d.comprobante_url}`;
                                                    const isPdf = d.comprobante_url.toLowerCase().endsWith('.pdf');
                                                    setPreviewFile({ url: fullUrl, type: isPdf ? 'pdf' : 'image' });
                                                }}
                                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px' }}
                                                title="Ver factura"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        )}
                                        {d.id_propietario === userLogueado?.id && (
                                            <>
                                                <button
                                                    onClick={() => { setDeudaACompartir(d); fetchParticipantes(d.id); }}
                                                    style={{ background: 'rgba(139, 92, 246, 0.1)', border: 'none', color: '#8B5CF6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px' }}
                                                    title="Compartir"
                                                >
                                                    <Users size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeudaAEliminar(d)}
                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px' }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => { setDeudaAbonos(d); fetchAbonos(d.id); }}
                                            style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px' }}
                                            title="Gestionar Abonos"
                                        >
                                            <Wallet size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                {!loading && hasMore && deudas.length > 0 && (
                    <button
                        onClick={() => fetchDeudas(false)}
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
                        Mostrar más deudas
                    </button>
                )}
            </div>

            {/* PREVIEW MODAL */}
            {previewFile && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setPreviewFile(null)}
                >
                    <div
                        className="fade-in"
                        style={{
                            position: 'relative',
                            width: 'auto',
                            maxWidth: '100%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ position: 'absolute', top: '-50px', right: 0, display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => previewFile && handleDownload(previewFile.url, previewFile.type === 'pdf')}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '10px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                }}
                                title="Descargar"
                            >
                                <Download size={18} /> Descargar
                            </button>
                            <button
                                onClick={() => setPreviewFile(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Cerrar"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        {previewFile.type === 'pdf' ? (
                            <div style={{ width: '90vw', maxWidth: '800px', height: '80vh', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)' }}>
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.url)}&embedded=true`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                    title="Vista Previa PDF"
                                />
                            </div>
                        ) : (
                            <img
                                src={previewFile.url}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                                }}
                                alt="Comprobante"
                            />
                        )}
                    </div>
                </div>
            )}

            {deudaACompartir && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }} onClick={() => setDeudaACompartir(null)}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: '450px', position: 'relative', border: '2px solid var(--primary)', padding: '24px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px' }}>Compartir: {deudaACompartir.titulo}</h3>
                            <button onClick={() => setDeudaACompartir(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={20} /></button>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Añadir participante por nombre de usuario:</p>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={queryUsuario}
                                    onChange={e => setQueryUsuario(e.target.value)}
                                    placeholder="ej: sbolivar"
                                    style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)', width: '100%', outline: 'none', background: 'var(--bg)', color: 'var(--text)' }}
                                />
                                {buscando && <div style={{ position: 'absolute', right: '12px', top: '12px' }}><div className="loading-spinner" style={{ width: '20px', height: '20px', borderTopColor: 'var(--primary)' }}></div></div>}

                                {usuariosSugeridos.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                                        marginTop: '8px', padding: '8px', background: 'var(--card)',
                                        borderRadius: '16px', border: '1.5px solid var(--border)',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                        backdropFilter: 'blur(20px)'
                                    }}>
                                        {usuariosSugeridos.map(u => (
                                            <button
                                                key={u.id}
                                                onClick={() => anadirParticipante(u.id)}
                                                className="btn-hover-soft"
                                                disabled={agregando}
                                                style={{
                                                    width: '100%', textAlign: 'left', padding: '10px 12px',
                                                    borderRadius: '10px', border: 'none', background: 'none',
                                                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                                                    alignItems: 'center', color: 'var(--text)', transition: 'all 0.2s'
                                                }}
                                            >
                                                <div>
                                                    <p style={{ fontWeight: '600', fontSize: '14px' }}>@{u.nombre_usuario}</p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.nombre_completo}</p>
                                                </div>
                                                <Plus size={16} color="var(--primary)" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Participantes actuales:</p>
                            {participantes.length === 0 ? (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No hay participantes añadidos.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {participantes.map(p => (
                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '12px', background: 'var(--bg)' }}>
                                            <div>
                                                <p style={{ fontWeight: '600', fontSize: '14px' }}>@{p.perfiles?.nombre_usuario}</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.nivel_permiso === 'lectura' ? 'Solo lectura' : 'Edición'}</p>
                                            </div>
                                            <button onClick={() => eliminarParticipante(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deudaAEliminar && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }} onClick={() => setDeudaAEliminar(null)}>
                    <div className="fade-in" style={{ background: 'var(--card)', width: '100%', maxWidth: '400px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '24px', display: 'flex', gap: '16px' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={20} color="var(--danger)" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>Eliminar Deuda</h3>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                    ¿Estás seguro de que deseas eliminar <strong>"{deudaAEliminar.titulo}"</strong>? Esta acción no se puede deshacer.
                                </p>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', background: 'var(--card)', borderTop: '1.5px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setDeudaAEliminar(null)}
                                style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', outline: 'none' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEliminar}
                                style={{ background: 'var(--danger)', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', color: 'white', cursor: 'pointer', outline: 'none' }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deudaAbonos && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }} onClick={() => { resetAbonosForm(); setDeudaAbonos(null); }}>
                    <div className="card-modal fade-in custom-scroll" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', border: '2px solid var(--primary)', padding: '24px 20px 24px 24px' }} onClick={e => e.stopPropagation()}>
                        {errorSistema && <BannerAlerta mensaje="Error al registrar pago" subtitulo={errorSistema} onClose={() => setErrorSistema(null)} />}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Gestión de Abonos</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{deudaAbonos.titulo}</p>
                            </div>
                            <button onClick={() => { resetAbonosForm(); setDeudaAbonos(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={20} /></button>
                        </div>

                        <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saldo Pendiente</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--danger)' }}>${new Intl.NumberFormat('es-CO').format(deudaAbonos.monto_total - deudaAbonos.monto_pagado)}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Pagado</p>
                                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>${new Intl.NumberFormat('es-CO').format(deudaAbonos.monto_pagado)}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1.5px solid var(--border)' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Registrar Nuevo Pago</h4>

                            {(deudaAbonos.estado === 'pagada' || (deudaAbonos.monto_pagado || 0) >= parseFloat(deudaAbonos.monto_total)) ? (
                                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid var(--primary)', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '15px' }}>🎉 ¡Deuda Totalmente Pagada! 🎉</p>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>No es necesario registrar más abonos.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            {montoAbono && (
                                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px', pointerEvents: 'none' }}>$</span>
                                            )}
                                            <input
                                                type="text"
                                                value={montoAbono}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setMontoAbono(val ? new Intl.NumberFormat('es-CO').format(parseInt(val)) : '');
                                                }}
                                                placeholder="Total Pagado"
                                                style={{ padding: `12px 12px 12px ${montoAbono ? '24px' : '12px'}`, borderRadius: '12px', border: '1.5px solid var(--border)', width: '100%', outline: 'none', background: 'var(--card)', color: 'var(--text)', fontSize: '14px' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            {montoCargos && (
                                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--danger)', fontWeight: '600', fontSize: '14px', pointerEvents: 'none' }}>$</span>
                                            )}
                                            <input
                                                type="text"
                                                value={montoCargos}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setMontoCargos(val ? new Intl.NumberFormat('es-CO').format(parseInt(val)) : '');
                                                }}
                                                placeholder="Seguro/Cargos"
                                                style={{ padding: `12px 12px 12px ${montoCargos ? '24px' : '12px'}`, borderRadius: '12px', border: '1.5px solid var(--border)', width: '100%', outline: 'none', background: 'var(--card)', color: 'var(--danger)', fontSize: '14px' }}
                                            />
                                        </div>
                                    </div>

                                    {(montoAbono || montoCargos) && (
                                        <div style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px dashed var(--primary)40' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Abono neto a capital:</span>
                                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)' }}>
                                                ${new Intl.NumberFormat('es-CO').format((parseInt(montoAbono.replace(/\D/g, '')) || 0) - (parseInt(montoCargos.replace(/\D/g, '')) || 0))}
                                            </span>
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        value={notasAbono}
                                        onChange={e => setNotasAbono(e.target.value)}
                                        placeholder="Notas (ej: Enero 2024)"
                                        style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid var(--border)', width: '100%', outline: 'none', background: 'var(--card)', color: 'var(--text)' }}
                                    />

                                    <div style={{ position: 'relative', border: '2px dashed var(--border)', borderRadius: '12px', padding: '12px', background: 'var(--card)', textAlign: 'center' }}>
                                        <input type="file" onChange={e => setArchivo(e.target.files?.[0] || null)} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                                        <p style={{ fontSize: '13px', color: archivo ? 'var(--primary)' : 'var(--text-muted)', fontWeight: archivo ? '700' : '400' }}>
                                            <Download size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                            {(archivo as any)?.name || 'Subir Comprobante (Obligatorio)'}
                                        </p>
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
                                        onClick={handleRegistrarAbono}
                                        disabled={enviandoAbono || !montoAbono || !archivo}
                                        className="btn-pill btn-pill-primary"
                                        style={{ width: '100%', height: '46px', marginTop: '4px', border: 'none', outline: 'none' }}
                                    >
                                        {enviandoAbono ? 'Registrando...' : 'Confirmar Pago'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Histórico de Pagos</h4>
                            {abonos.length === 0 ? (
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No hay abonos registrados.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {abonos.map(a => (
                                        <div key={a.id} style={{ padding: '12px', borderRadius: '14px', background: 'var(--bg)', border: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                                    <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--primary)' }}>
                                                        ${new Intl.NumberFormat('es-CO').format(a.monto_abonado)}
                                                    </span>
                                                    {(a.monto_cargos > 0) && (
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                            (de ${new Intl.NumberFormat('es-CO').format(a.monto_total_pago || a.monto_abonado)})
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                                    <span>{formatearFecha(a.fecha_pago)}</span>
                                                    <span>•</span>
                                                    <span style={{ color: 'var(--text)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        <User size={10} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                                                        {formatearNombreMostrar(a.perfiles?.nombre_completo)}
                                                    </span>
                                                    {a.notas && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{a.notas}</span>
                                                        </>
                                                    )}
                                                    {a.monto_cargos > 0 && <span style={{ color: 'var(--danger)' }}> • Seguro: ${new Intl.NumberFormat('es-CO').format(a.monto_cargos)}</span>}
                                                </p>
                                            </div>
                                            {a.comprobante_url && (
                                                <button
                                                    onClick={() => {
                                                        const fullUrl = `https://yupaibsqnxfismckuqje.supabase.co/storage/v1/object/public/comprobantes/${a.comprobante_url}`;
                                                        const isPdf = a.comprobante_url.toLowerCase().endsWith('.pdf');
                                                        setPreviewFile({ url: fullUrl, type: isPdf ? 'pdf' : 'image' });
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '6px', cursor: 'pointer', outline: 'none' }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {mensajeExitoso && (
                <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 3000, width: '90%', maxWidth: '400px' }}>
                    <BannerAlerta tipo="success" mensaje="Operación Exitosa" subtitulo={mensajeExitoso || undefined} onClose={() => setMensajeExitoso(null)} />
                </div>
            )}
        </div>
    );
};

export default ControlDeudas;
