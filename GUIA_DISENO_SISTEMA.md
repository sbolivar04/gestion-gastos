# 📒 Guía de Sistema de Diseño - Confecciones

Este documento sirve como referencia oficial para mantener la consistencia visual en todas las interfaces de la aplicación. Cualquier nuevo componente, botón o vista debe seguir estas reglas de tipografía, color y estilo.

---

## 🎨 Paleta de Colores (CSS Variables)

Utilizamos un sistema de variables CSS definido en `index.css` que soporta **Modo Claro y Oscuro**.

### Colores de marca y estado
- **Principal (Primary):** `var(--primary)` (#10b981)
  - Uso: Botones primarios, bordes de validación positiva, iconos activos.
- **Peligro (Danger):** `var(--danger)` (#EF4444)
  - Uso: Estados de error, botones de eliminar, resaltado de campos faltantes y **visualización de montos de gastos** (con signo negativo).
- **Textos:**
  - `var(--text)`: Color base para lectura.
  - `var(--text-muted)`: Gris sutil para placeholders, iconos secundarios, signos decorativos (`$`) e **iconos de lectura en contextos minimalistas**.

### Superficies (Fondos)
- **Fondo General (`var(--bg)`):** Estructura base de la página.
- **Tarjetas/Inputs (`var(--card)`): Color de superficie para elementos interactivos. **IMPORTANTE:** Todos los inputs, selectores y zonas de carga deben usar `var(--card)` para mantener la profundidad.

---

## ✍️ Tipografía y Estilos de Texto

| Estilo | CSS / Variable | Uso |
| :--- | :--- | :--- |
| **Título Principal** | `font-bold text-xl` | Títulos en Dashboard o cabeceras de sección. |
| **Título de Tarjeta** | `font-bold (16px)` | Nombres de deudas o gastos en la lista. |
| **Labels / Muted** | `var(--text-muted)` | Textos informativos secundarios, fechas de vencimiento. |
| **Monto Resaltado** | `font-extrabold` | Visualización de precios y montos totales. |

---

## 🔘 Botones Premium

### 1. Botón de Acción Principal (Pill)
- **Estilo:** Fondo `var(--primary)`, texto blanco, esquinas totalmente redondeadas (`12px` o `9999px`).
- **Comportamiento Crítico:** **NUNCA** deben tener bordes negros (`border: none`) ni el anillo de enfoque predeterminado del navegador (`outline: none`). Usar sombreados sutiles o cambios de escala para feedback.

### 2. Botón Secundario (Pill)
- **Estilo:** Fondo `var(--card)`, borde `1.5px solid var(--border)`, texto `var(--text)`.
- **Uso:** Acciones alternativas o de cancelación. Al hacer hover, cambia el borde y el texto al color principal (`var(--primary)`).

### 3. Botones de Icono (Variaciones de "Ver")
- **Acción en Listas (Deudas):** Fondo azul suave (`rgba(59, 130, 246, 0.1)`), icono azul (`#3B82F6`), tamaño `30x30px` y borde redondeado `8px`.
- **Lectura Minimalista (Gastos/Abonos):** Color `var(--text-muted)` sin fondo, padding ligero. Se usa para previsualizaciones rápidas que no requieren destacar sobre otras acciones.

---

## 🏷️ Estados y Badges (Píldoras)

Todos los estados usan el formato "Pill" (`rounded-full`) con texto pequeño.

- **Completado:** `bg-green-100 text-green-800`
- **Retrasado:** `bg-red-100 text-red-800`
- **En Proceso/General:** `bg-blue-100 text-blue-800`
- **Prioridad Alta:** `bg-red-100 text-red-800` (Igual a error pero contexto de prioridad).

---

## 🗂️ Estructura y Contenedores

- **Tarjetas (Cards):** 
  - `background: var(--card); rounded-2xl shadow-sm border dark:border-gray-700`
  - Las esquinas redondeadas deben ser generosas (`rounded-xl` o `rounded-2xl`).
  - **Importante:** Si la tarjeta contiene componentes flotantes (como calendarios o dropdowns), debe usar `overflow: visible` para evitar recortes. Los sub-elementos internos que toquen los bordes de la tarjeta deben heredar el redondeado (`border-radius`) correspondiente para mantener la estética pildorada.
- **Modales con Scroll (`card-modal`):**
  - Clase dedicada para formularios largos.
  - **Scrollbar Estético:** El `scrollbar-track` debe tener un margen vertical (`margin: 12px 0`) para evitar que la barra de desplazamiento toque los bordes redondeados del contenedor.
  - **Distribución:** Padding de `24px` para asegurar que el contenido respire.
- **Tablas:**
  - Encabezados: `text-gray-500 text-sm font-medium uppercase tracking-wider` (opcional).
  - Filas: `border-b hover:bg-gray-50 transition-colors`.

---

## 📏 Espaciado
- **Padding General de Páginas:** `p-6`.
- **Gaps en Grids de Filtros:** `gap-4`.
- **Margen entre secciones:** `mt-4` o `mt-6`.

---

## 💡 Documentación de Secciones Contraíbles (Nuevo Estándar)
Si usas secciones que se expanden (como en Detalles de Pedido):
- **Botón de Toggle:** `w-full flex justify-between items-center text-left`.
- **Separador:** Línea horizontal de borde a borde usando `-mx-6` (negativo) para tocar los laterales del contenedor.
- **Icono:** `ChevronDownIcon` con `transition-transform` y rotación de 180 grados al expandir.

---

## 📑 Selector de Pestañas (Tab Switcher)
Para navegar entre sub-vistas (como en Administración):
- **Contenedor:** Fondo gris muy claro (`bg-gray-200/50`) con esquinas `rounded-xl`.
- **Botón Activo:** Fondo blanco con sombra ligera y texto del color principal (`blue-600`).
- **Botón Inactivo:** Texto gris, sin fondo, con efecto hover suave.
- **Interacción:** Las transiciones deben ser instantáneas o con un fundido muy sutil.

---

## 🗓️ Componente de Calendario Premium
Para la selección de fechas en formularios de gastos:
- **Diseño Ultra-Compacto**: Ancho fijo de `220px` y visualización de **exactamente 5 filas** (35 días).
- **Posicionamiento**: Se alinea al **lado derecho** del selector de fecha para mayor ergonomía.
- **Controles de Cierre**: Botón `✕` en esquina superior y cierre automático al hacer clic fuera.
- **Iconografía**: Selector de fecha con icono de calendario negro (`#000`), sin emojis.
- **Acentuación**: Día seleccionado en color principal (verde esmeralda) con fondo suave (`emerald-500/10`).
- **Restricciones**: Deshabilitación visual de fechas futuras.

---

## 🏷️ Selector de Categorías Premium
Sustituye al select nativo para una experiencia más limpia y minimalista:
- **Diseño**: Sin etiqueta superior (label) para reducir el ruido visual.
- **Visualización**: Muestra el nombre de la categoría seleccionada o el placeholder **"Seleccionar Categoría"**.
- **Estética**: Se eliminan los indicadores de color circulares para un look más sobrio y premium.
- **Validación Visual**: El borde cambia a **verde esmeralda** (`var(--primary)`) automáticamente cuando se selecciona una categoría.
- **Menú desplegable**:
  - Lista de categorías con efecto de hover suave.
  - Resaltada de la selección actual en verde esmeralda con fondo sutil (`bg-emerald-500/10`).
  - Botón fijo al final para **"+ Agregar nueva categoría..."** con estilo destacado en negrita.
- **Interacción**: Cierre automático al seleccionar o al hacer clic fuera del componente.

### 4. Ciclo de Vida y Auto-Reset
- **Limpieza Automática:** Todos los formularios deben disparar una función `resetForm()` al cerrarse (ya sea por cancelar, hacer clic fuera o éxito al guardar).
- **Estado Inicial:** Al reabrir un formulario, este debe estar siempre vacío, sin archivos temporales ni datos de sesiones anteriores.

---

## 🔢 Formatos de Datos Uniformes

Para evitar confusión visual y mantener el orden profesional:

### 1. Fechas (DD/MM/AAAA)
- **Estándar:** Siempre usar dos dígitos para día y mes (`padStart(2, '0')`).
- **Inclusión del Año:** Para evitar ambigüedad, todos los rangos de navegación (Día, Semana, Mes) deben incluir siempre el año completo.
- **Ejemplo:** `Lunes, 02 de Febrero de 2026` o `01 de Enero - 07 de Enero de 2026`.
- **Uso:** Listado de gastos, histórico de abonos y vistas de deudas.

### 2. Montos Financieros
- **Gastos:** Se muestran en Rojo (`var(--danger)`) con un signo negativo prefijado: `-$50.000`.
- **Ingresos/Abonos:** Se muestran en color base o verde según el contexto, sin signo negativo.
- **Separadores:** Usar siempre puntos para miles (`es-CO`).

---

## ✅ Estándares de Formulario y Validación

### 1. Campos de Entrada (Inputs)
- **Fondo Unificado**: Todos los inputs y textareas deben usar `background: var(--card)`.
- **Bordes Dinámicos**:
  - Vacío/Inactivo: `1.5px solid var(--border)`.
  - Con Valor Válido: `1.5px solid var(--primary)`.
  - Error/Faltante: `1.5px solid var(--danger)`.

### 2. Input de Monto (Lógica Especial)
- **Signo de Pesos ($)**:
  - Invisible si el campo está vacío.
  - Aparece automáticamente al digitar el primer número.
  - **Color**: `var(--text-muted)` (Gris sutil) para no distraer.
  - **Alineación**: Posicionado de forma absoluta a la izquierda con padding compensado en el input.
- **Formato**: Separador de miles (punto) automático mientras se digita.

### 3. Layout y Botones de Guardado
- **Distribución**: Los campos de "Monto" y "Fecha" deben ir en la **misma fila** (`flex gap: 12px`) para optimizar espacio.
- **Validación de Botón**: 
  - El botón de envío debe estar **deshabilitado** (`disabled`) mientras falten campos obligatorios.
  - **Estado Visual Deshabilitado:** `opacity: 0.5`, `grayscale(0.2)` y cursor de bloqueo.
- **Limpieza de Datos**: Los títulos de gastos y deudas se guardan automáticamente con la **primera letra en mayúscula y el resto en minúscula**.

---

## 🚨 Banner de Alerta (Atención Premium)

Se utiliza para mostrar validaciones de campos y errores inesperados del sistema:
- **Contenedor**: 
  - Fondo: `var(--card)` (Blanco en modo claro para máxima legibilidad / Oscuro en modo dark).
  - Borde: `1.5px solid var(--danger)` o `var(--primary)`.
  - Animación: `fade-in` con desenfoque de fondo (`blur(12px)`).
- **Textos de Advertencia**:
  - Título: Color sólido de acción (Rojo/Verde) en Negrita/800.
  - Descripción: Color suavizado (peso 500) para legibilidad.
- **Auto-cierre**: Se programa para desaparecer tras **5 segundos** automáticamente o mediante la `X`.

---

## 📂 Gestión de Archivos y Comprobantes

### 1. Zona de Carga (Dropzone)
- **Estilo**: Bordes punteados (`2px dashed var(--border)`), fondo `var(--card)`.
- **Limpieza**: Si hay un archivo seleccionado, aparece un botón **"X" (Rojo)** en la esquina superior derecha para quitarlo antes de subirlo.
- **Feedback**: Muestra el nombre del archivo seleccionado de forma prominente.

### 2. Previsualización de Facturas (Modal Fullscreen)
- **Fondo**: Backdrop oscuro intenso (`rgba(0,0,0,0.85)`) con efecto **Blur** (`5px`).
- **Botones de Acción**:
  - **Descargar**: Botón flotante superior con icono `Download`.
  - **Cerrar**: Botón `✕` con atajo visual claro.
- **Contenido**: Imagen o PDF embebido que ocupa el máximo espacio disponible sin perder proporción.

---

## 👥 Colaboración y Compartir

### 1. Gestión de Participantes
- **Modal de Compartir**: Conectado por el icono de `Users` en cada deuda.
- **Búsqueda**: Input de búsqueda de usuarios con indicador de carga (*Spinner*) para feedback visual.
- **Lista de Participantes**: Cada usuario añadido muestra su `@username` y nombre completo, con opción de eliminar mediante icono de basura (`Trash2`) en color rojo.
- **Seguridad**: Las deudas compartidas son visibles para los participantes pero solo el dueño original puede gestionar quién tiene acceso.

---

## ⚠️ Modales de Confirmación Crítica

Para acciones irreversibles como eliminar registros:
- **Iconografía**: Círculo con fondo rojo sutil (`rgba(239, 68, 68, 0.1)`) y el icono `AlertTriangle` en color `var(--danger)`.
- **Textos**:
  - Título directo y claro (ej: "Eliminar Deuda").
  - Descripción que mencione el nombre del objeto a eliminar entre comillas y advierta que la acción no se puede deshacer.
- **Acciones**:
  - **Cancelar (Izquierda)**: Botón con borde y fondo neutro.
  - **Confirmar (Derecha)**: Botón con fondo rojo sólido (`var(--danger)`).
- **Estética**: El fondo es uniforme (`var(--card)`) en todo el modal, con una línea divisoria sutil (`border-top`) para separar las acciones del mensaje.
- **Interacción**: El modal debe cerrarse al hacer clic en el backdrop (Blur de 4px) o en el botón de cancelar.

---

## 🔍 Filtros y Búsqueda Avanzada

Para mantener la consistencia en las vistas de listados (Deudas, Gastos):

### 1. Barra de Herramientas
- **Contenedor**: Flexbox con `gap: 12px`.
- **Responsive**: En móvil se apilan verticalmente, en escritorio horizontal.
- **Scroll Horizontal**: Para selectores de filtros rápidos (chips) si hay muchos.

### 2. Buscador Principal
- **Estilo**: Input con icono de lupa (`Search`) a la izquierda.
- **Padding**: `12px 12px 12px 40px` (para dejar espacio al icono).
- **Fondo**: `var(--card)`.
- **Borde**: Igual a inputs estándar (`var(--border)`).
- **Placeholder**: Color `var(--text-muted)`.

### 3. Filtros Dropdown Prominentes
- **Concepto**: Botones que despliegan opciones, similares al selector de fechas.
- **Estilo Base**: Botón con borde suave, fondo `var(--card)`.
- **Estado Activo**: Borde `var(--primary)` y texto `var(--primary)` cuando hay un filtro aplicado diferente al default.

### 4. Chips de Estado (Filtro Rápido)
- **Uso**: Para estados binarios o ternarios (ej: Todas, Pendientes, Pagadas).
- **Seleccionado**: Fondo `var(--primary)` (o color semántico), texto blanco.
- **No seleccionado**: Fondo transparente, borde `1.5px solid var(--border)`, texto `var(--text-muted)`.
- **Forma**: `rounded-full` (Pildora).

---

## 🗓️ Sistema de Navegación Cronológica (Rango de Fechas)

Para asegurar que el usuario siempre sepa qué datos está visualizando:

### 1. Granularidad (Día, Semana, Mes, Año)
- **Cómputo de Semana**: El rango debe ser estrictamente de 7 días. El fin de semana debe calcularse sumando 6 días a la fecha de inicio para evitar errores en cambios de mes o año.
- **Visualización**: El encabezado de navegación debe mostrar el rango completo formateado en español.

### 2. Filtro por Periodo (Rango Personalizado)
- **Interfaz**: Sustituye las flechas de navegación por dos selectores de fecha (**"Desde"** y **"Hasta"**).
- **Z-Index**: Los calendarios desplegados en este modo deben usar `z-index: 2000` para flotar sobre cualquier otro elemento de la interfaz.
- **Limpieza**: Debe incluirse siempre un botón de **"Limpiar"** en color `var(--danger)` para resetear el rango rápidamente.

---

## 🔡 Codificación y Caracteres Especiales

Para mantener una interfaz profesional en español:

- **UTF-8 estricto**: Todo el código fuente debe guardarse en codificación UTF-8 para evitar errores de visualización (*mojibake*).
- **Caracteres Correctos**: Queda prohibido el uso de secuencias corruptas como `Ã­` o `â€¢`. Se deben usar los caracteres literales correspondientes:
  - Tildes y Ñs: `á`, `é`, `í`, `ó`, `ú`, `ñ`.
  - Signos de apertura: `¡`, `¿`.
  - Elementos visuales: `•` (Bullet point real).
- **Validación**: Antes de cada commit, verificar que no existan caracteres extraños en los labels y botones.

---

## 🔄 Paginación y Filtrado Server-Side (Estándar)

Para mejorar el rendimiento y evitar problemas con listas largas, usamos paginación controlada desde el servidor:

### 1. Variables de Estado
- `const [page, setPage] = useState(0);`: Controla el offset actual.
- `const [hasMore, setHasMore] = useState(true);`: Determina si mostrar el botón de cargar más.
- `const PAGE_SIZE = 12;`: Cantidad de elementos por petición.

### 2. Lógica de Consulta (fetch)
- **Siempre** usar filtros en la consulta Supabase, no en el cliente (`.filter()` de JS está prohibido para listas principales).
- Calcular el rango usando `page`:
  ```typescript
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);
  ```
- **Nueva Búsqueda vs. Paginación:**
  - Si cambian los filtros, resetear `page` a 0 y reemplazar la lista.
  - Si es "Mostrar más", incrementar `page` y concatenar (`[...prev, ...data]`).

### 3. Botón "Mostrar más"
- Se muestra solo sí `{!loading && hasMore}`.
- Estilo estándar: `btn-hover-soft` con borde visual y texto centrado.