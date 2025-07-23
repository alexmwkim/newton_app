-- Newton App Database Schema
-- This file contains all the SQL statements to set up the Newton app database

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- 1. profiles (사용자 프로파일)
-- ===========================
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_username_length CHECK (char_length(username) >= 3)
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- ===========================
-- 2. notes (노트 데이터)
-- ===========================
CREATE TABLE public.notes (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    is_public BOOLEAN DEFAULT false,
    slug TEXT,
    fork_count INTEGER DEFAULT 0,
    star_count INTEGER DEFAULT 0,
    forked_from UUID REFERENCES public.notes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT notes_pkey PRIMARY KEY (id),
    CONSTRAINT notes_title_length CHECK (char_length(title) >= 1)
);

-- RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Public notes are viewable by everyone."
ON public.notes FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can view their own notes."
ON public.notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes."
ON public.notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes."
ON public.notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes."
ON public.notes FOR DELETE
USING (auth.uid() = user_id);

-- ===========================
-- 3. stars (좋아요/즐겨찾기)
-- ===========================
CREATE TABLE public.stars (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT stars_pkey PRIMARY KEY (id),
    CONSTRAINT stars_user_note_unique UNIQUE (user_id, note_id)
);

-- RLS for stars
ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;

-- Stars policies
CREATE POLICY "Users can view their own stars."
ON public.stars FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can star notes."
ON public.stars FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar notes."
ON public.stars FOR DELETE
USING (auth.uid() = user_id);

-- ===========================
-- 4. user_pinned_notes (사용자 핀된 노트)
-- ===========================
CREATE TABLE public.user_pinned_notes (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT user_pinned_notes_pkey PRIMARY KEY (id),
    CONSTRAINT user_pinned_notes_user_note_unique UNIQUE (user_id, note_id)
);

-- RLS for user_pinned_notes
ALTER TABLE public.user_pinned_notes ENABLE ROW LEVEL SECURITY;

-- User pinned notes policies
CREATE POLICY "Users can manage their own pinned notes."
ON public.user_pinned_notes FOR ALL
USING (auth.uid() = user_id);

-- ===========================
-- 5. forks (포크 기록)
-- ===========================
CREATE TABLE public.forks (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    original_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    forked_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT forks_pkey PRIMARY KEY (id),
    CONSTRAINT forks_user_original_unique UNIQUE (user_id, original_note_id)
);

-- RLS for forks
ALTER TABLE public.forks ENABLE ROW LEVEL SECURITY;

-- Forks policies
CREATE POLICY "Users can view all forks."
ON public.forks FOR SELECT
USING (true);

CREATE POLICY "Users can fork notes."
ON public.forks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ===========================
-- 5. FUNCTIONS AND TRIGGERS
-- ===========================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger for notes updated_at
CREATE TRIGGER notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update star count
CREATE OR REPLACE FUNCTION public.update_note_star_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.notes 
        SET star_count = star_count + 1 
        WHERE id = NEW.note_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.notes 
        SET star_count = star_count - 1 
        WHERE id = OLD.note_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql' security definer;

-- Trigger for star count updates
CREATE TRIGGER stars_count_trigger
    AFTER INSERT OR DELETE ON public.stars
    FOR EACH ROW EXECUTE PROCEDURE public.update_note_star_count();

-- Function to create note (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_user_note(
    p_title TEXT,
    p_content TEXT DEFAULT '',
    p_is_public BOOLEAN DEFAULT false,
    p_slug TEXT DEFAULT NULL,
    p_user_id UUID
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    content TEXT,
    is_public BOOLEAN,
    slug TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify that the user_id corresponds to a valid profile
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = p_user_id) THEN
        RAISE EXCEPTION 'Invalid user profile ID';
    END IF;
    
    -- Insert the note and return the result
    RETURN QUERY
    INSERT INTO public.notes (title, content, is_public, slug, user_id)
    VALUES (p_title, p_content, p_is_public, COALESCE(p_slug, p_title), p_user_id)
    RETURNING 
        public.notes.id,
        public.notes.title,
        public.notes.content,
        public.notes.is_public,
        public.notes.slug,
        public.notes.user_id,
        public.notes.created_at,
        public.notes.updated_at;
END;
$$;

-- Function to update fork count
CREATE OR REPLACE FUNCTION public.update_note_fork_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.notes 
        SET fork_count = fork_count + 1 
        WHERE id = NEW.original_note_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.notes 
        SET fork_count = fork_count - 1 
        WHERE id = OLD.original_note_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql' security definer;

-- Trigger for fork count updates  
CREATE TRIGGER forks_count_trigger
    AFTER INSERT OR DELETE ON public.forks
    FOR EACH ROW EXECUTE PROCEDURE public.update_note_fork_count();

-- ===========================
-- 6. INDEXES for Performance
-- ===========================

-- Index for notes queries
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_is_public ON public.notes(is_public);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX idx_notes_star_count ON public.notes(star_count DESC);

-- Index for stars queries
CREATE INDEX idx_stars_user_id ON public.stars(user_id);
CREATE INDEX idx_stars_note_id ON public.stars(note_id);

-- Index for user_pinned_notes queries
CREATE INDEX idx_user_pinned_notes_user_id ON public.user_pinned_notes(user_id);
CREATE INDEX idx_user_pinned_notes_note_id ON public.user_pinned_notes(note_id);
CREATE INDEX idx_user_pinned_notes_created_at ON public.user_pinned_notes(created_at);

-- Index for forks queries
CREATE INDEX idx_forks_user_id ON public.forks(user_id);
CREATE INDEX idx_forks_original_note_id ON public.forks(original_note_id);

-- Index for profiles queries
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- ===========================
-- 7. SAMPLE DATA (Optional - for development)
-- ===========================

-- Sample public notes (run after creating real users)
-- INSERT INTO public.notes (user_id, title, content, is_public) VALUES
-- (uuid_generate_v4(), 'Welcome to Newton', 'This is your first note!', true),
-- (uuid_generate_v4(), 'Getting Started', 'Learn how to use Newton for your daily notes.', true);