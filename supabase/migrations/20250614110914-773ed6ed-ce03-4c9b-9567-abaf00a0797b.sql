
-- 1. Create an audits table to store individual audits linked to the auth user
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_code TEXT NOT NULL,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- 3. Policy: users can select (view) their own audits
CREATE POLICY "Users can view their own audits"
  ON public.audits
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Policy: users can insert audits only for themselves
CREATE POLICY "Users can create their own audits"
  ON public.audits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Policy: users can update or delete their own audits
CREATE POLICY "Users can update their own audits"
  ON public.audits
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audits"
  ON public.audits
  FOR DELETE
  USING (auth.uid() = user_id);
