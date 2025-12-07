-- Create cases table for cloud storage
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  case_info JSONB NOT NULL DEFAULT '{}',
  earnings_params JSONB NOT NULL DEFAULT '{}',
  hh_services JSONB NOT NULL DEFAULT '{}',
  lcp_items JSONB NOT NULL DEFAULT '[]',
  past_actuals JSONB NOT NULL DEFAULT '{}',
  is_union_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- RLS policies for cases
CREATE POLICY "Users can view their own cases"
ON public.cases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cases"
ON public.cases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
ON public.cases FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases"
ON public.cases FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster user queries
CREATE INDEX idx_cases_user_id ON public.cases(user_id);

-- Trigger for updating timestamps
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();