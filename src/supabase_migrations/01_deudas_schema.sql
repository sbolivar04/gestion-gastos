-- Asegurar que la tabla de deudas tenga la columna de descripción
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='deudas' and column_name='descripcion') then
    alter table public.deudas add column descripcion text;
  end if;
end $$;

-- Asegurar que RLS esté habilitado
alter table public.deudas enable row level security;

-- Eliminar TODAS las políticas antiguas para evitar conflictos y recursión
DROP POLICY IF EXISTS "Dueño tiene control total de sus deudas" ON public.deudas;
DROP POLICY IF EXISTS "Participantes pueden ver deudas compartidas" ON public.deudas;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias deudas" ON public.deudas;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias deudas" ON public.deudas;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias deudas" ON public.deudas;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias deudas" ON public.deudas;
DROP POLICY IF EXISTS "select_own_deudas" ON public.deudas;
DROP POLICY IF EXISTS "insert_own_deudas" ON public.deudas;
DROP POLICY IF EXISTS "update_own_deudas" ON public.deudas;
DROP POLICY IF EXISTS "delete_own_deudas" ON public.deudas;

-- Crear políticas simples y sin conflictos
CREATE POLICY "select_own_deudas" ON public.deudas
  FOR SELECT USING (auth.uid() = id_propietario);

CREATE POLICY "insert_own_deudas" ON public.deudas
  FOR INSERT WITH CHECK (auth.uid() = id_propietario);

CREATE POLICY "update_own_deudas" ON public.deudas
  FOR UPDATE USING (auth.uid() = id_propietario);

CREATE POLICY "delete_own_deudas" ON public.deudas
  FOR DELETE USING (auth.uid() = id_propietario);
