// Utilidad para obtener la fecha de hoy en Colombia (GMT-5)
export const getHoyColombia = () => {
    const options: Intl.DateTimeFormatOptions = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA devuelve AAAA-MM-DD
    return formatter.format(new Date());
};

// Formatea AAAA-MM-DD a DD/MM/AAAA asegurando el 0 inicial
export const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};
// Formatea un objeto Date a AAAA-MM-DD en hora local (evita desfases de UTC)
export const getISODateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Obtiene el rango de fechas (inicio del día UTC, fin del día UTC) para una fecha dada y granularidad
export const getStartEnd = (fecha: Date, granularidad: 'dia' | 'semana' | 'mes' | 'año') => {
    const start = new Date(fecha);
    const end = new Date(fecha);

    if (granularidad === 'dia') {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    } else if (granularidad === 'semana') {
        const day = start.getDay(); // 0 (Domingo) - 6 (Sábado)
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Ajustar al Lunes
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    } else if (granularidad === 'mes') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
    } else if (granularidad === 'año') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(start.getFullYear() + 1);
        end.setMonth(0, 0); // Último día del año anterior (Diciembre 31)
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
};

// Formatea el rango de fechas para mostrar en la interfaz
export const formatRango = (fecha: Date, granularidad: 'dia' | 'semana' | 'mes' | 'año') => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    if (granularidad === 'dia') {
        return fecha.toLocaleDateString('es-CO', options);
    } else if (granularidad === 'semana') {
        const { start, end } = getStartEnd(fecha, 'semana');
        return `${start.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (granularidad === 'mes') {
        return fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    } else if (granularidad === 'año') {
        return fecha.getFullYear().toString();
    }
    return '';
};
