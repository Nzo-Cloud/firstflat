-- ============================================================
-- FirstFlat: Row Level Security
-- Run AFTER schema.sql
-- ============================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills       ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles: own row" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Categories
CREATE POLICY "categories: own rows" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "transactions: own rows" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Bills
CREATE POLICY "bills: own rows" ON public.bills
  FOR ALL USING (auth.uid() = user_id);
