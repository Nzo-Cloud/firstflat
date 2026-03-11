-- ============================================================
-- FirstFlat: Budget Tracker for People Living Alone
-- Schema — run this first in Supabase SQL Editor
-- ============================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'USD',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('essential', 'non-essential')),
  color         TEXT NOT NULL DEFAULT '#6366f1',
  icon          TEXT NOT NULL DEFAULT 'tag',
  monthly_limit NUMERIC(12, 2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bills
CREATE TABLE IF NOT EXISTS public.bills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL,
  due_day     INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  is_paid     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auto-create profile + default categories on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_user_id UUID := NEW.id;
BEGIN
  INSERT INTO public.profiles (id, username, monthly_income, currency, onboarding_completed)
  VALUES (
    new_user_id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    0,
    'USD',
    FALSE
  );

  -- Default categories
  INSERT INTO public.categories (user_id, name, type, color, icon, monthly_limit) VALUES
    (new_user_id, 'Rent',          'essential',     '#ef4444', 'home',          NULL),
    (new_user_id, 'Food',          'essential',     '#f97316', 'utensils',      NULL),
    (new_user_id, 'Transport',     'essential',     '#3b82f6', 'bus',           NULL),
    (new_user_id, 'Utilities',     'essential',     '#8b5cf6', 'zap',           NULL),
    (new_user_id, 'Internet',      'essential',     '#06b6d4', 'wifi',          NULL),
    (new_user_id, 'Health',        'essential',     '#10b981', 'heart-pulse',   NULL),
    (new_user_id, 'Entertainment', 'non-essential', '#f59e0b', 'tv',            NULL),
    (new_user_id, 'Savings',       'non-essential', '#6366f1', 'piggy-bank',    NULL),
    (new_user_id, 'Other',         'non-essential', '#6b7280', 'circle-ellipsis', NULL);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
