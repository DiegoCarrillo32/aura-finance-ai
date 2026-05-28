CREATE TABLE IF NOT EXISTS public.installments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  monthly_amount numeric NOT NULL,
  total_amount numeric,
  total_installments integer NOT NULL,
  installments_paid integer DEFAULT 0 NOT NULL,
  start_date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage only their own installments
CREATE POLICY "Users can manage their own installments"
  ON public.installments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
