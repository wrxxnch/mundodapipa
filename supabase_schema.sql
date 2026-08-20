-- =======================================================
-- MUNDO DA PIPA - SUPABASE DATABASE SCHEMA MIGRATION
-- Copie e cole este script no Editor SQL do seu Supabase
-- =======================================================

-- 1. Tabela de Produtos (Catálogo Completo)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    image TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    video_url TEXT,
    videos JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    specs JSONB DEFAULT '[]'::jsonb,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    shopee_url TEXT,
    badge TEXT,
    rating NUMERIC DEFAULT 5.0,
    sales_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Publicações & Posts da Comunidade
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Mundo da Pipa',
    author_id TEXT,
    image_url TEXT,
    video_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Conteúdo Institucional (História, Sobre, Avisos)
CREATE TABLE IF NOT EXISTS public.site_content (
    id TEXT PRIMARY KEY,
    badge TEXT,
    title TEXT,
    paragraph1 TEXT,
    paragraph2 TEXT,
    stat1_value TEXT,
    stat1_label TEXT,
    stat2_value TEXT,
    stat2_label TEXT,
    value1_title TEXT,
    value1_desc TEXT,
    value2_title TEXT,
    value2_desc TEXT,
    value3_title TEXT,
    value3_desc TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Avaliações / Depoimentos de Clientes
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    rating NUMERIC DEFAULT 5.0,
    comment TEXT NOT NULL,
    product_name TEXT,
    verified BOOLEAN DEFAULT true,
    date TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Carrinhos de Compras
CREATE TABLE IF NOT EXISTS public.carts (
    user_id TEXT PRIMARY KEY,
    items JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Usuários / Perfis (Perfis de Clientes e Admins)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'customer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =======================================================
-- HABILITAR SEGURANÇA EM NÍVEL DE LINHA (RLS) E POLÍTICAS
-- Permite leitura e escrita públicas para o catálogo e app
-- =======================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para Products
CREATE POLICY "Permitir leitura pública de produtos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de produtos" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de produtos" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de produtos" ON public.products FOR DELETE USING (true);

-- Políticas para Posts
CREATE POLICY "Permitir leitura pública de posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de posts" ON public.posts FOR DELETE USING (true);

-- Políticas para Site Content
CREATE POLICY "Permitir leitura de site_content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Permitir modificação de site_content" ON public.site_content FOR ALL USING (true);

-- Políticas para Reviews
CREATE POLICY "Permitir leitura de reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Permitir modificação de reviews" ON public.reviews FOR ALL USING (true);

-- Políticas para Carts
CREATE POLICY "Permitir acesso a carts" ON public.carts FOR ALL USING (true);

-- Políticas para Users
CREATE POLICY "Permitir leitura de perfis de users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e atualização de users" ON public.users FOR ALL USING (true);

-- Habilitar Realtime nas tabelas para atualizações instantâneas
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
