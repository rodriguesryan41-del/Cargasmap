-- Create tables for Cargo Control

-- Vehicles (Frota)
CREATE TABLE IF NOT EXISTS public.frota (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prefix TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    capacity DECIMAL NOT NULL,
    status TEXT DEFAULT 'Disponível',
    updated_by UUID REFERENCES auth.users(id),
    last_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials (Materiais)
CREATE TABLE IF NOT EXISTS public.materiais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    density DECIMAL NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sectors (Setores)
CREATE TABLE IF NOT EXISTS public.setores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Carga' or 'Descarga'
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips (Viagens)
CREATE TABLE IF NOT EXISTS public.viagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id TEXT NOT NULL, -- Using prefix
    material_id TEXT NOT NULL, -- Using name or code
    origin_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    km_initial DECIMAL,
    km_final DECIMAL,
    volume DECIMAL DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.frota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viagens ENABLE ROW LEVEL SECURITY;

-- Create Policies (Authenticated users can do everything for now, can be hardened later)
CREATE POLICY "Allow all for authenticated users" ON public.frota FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.materiais FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.setores FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.viagens FOR ALL TO authenticated USING (true);
