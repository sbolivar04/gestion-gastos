/**
 * Formatea el nombre completo según las reglas:
 * 1. Si tiene 4 o más nombres/apellidos, toma el 1º y el 3º.
 * 2. Si tiene menos de 4, toma el 1º y el 2º.
 */
export const formatearNombreMostrar = (nombreCompleto: string | undefined | null): string => {
    if (!nombreCompleto) return '';

    // Normalizar: todo a minúsculas, separar por espacios y capitalizar cada palabra
    const partes = nombreCompleto.trim().toLowerCase().split(/\s+/).map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    );

    if (partes.length >= 4) {
        return `${partes[0]} ${partes[2]}`;
    } else if (partes.length >= 2) {
        return `${partes[0]} ${partes[1]}`;
    }

    return partes[0] || '';
};
