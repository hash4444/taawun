-- Enums
CREATE TYPE public.app_role AS ENUM ('worker', 'business', 'admin');
CREATE TYPE public.job_type AS ENUM ('shift', 'full_time', 'part_time', 'freelance', 'digital_service', 'internship');
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'closed', 'cancelled');
CREATE TYPE public.payment_model AS ENUM ('hourly', 'fixed', 'monthly', 'milestone');
CREATE TYPE public.service_direction AS ENUM ('business_offers', 'worker_offers');
CREATE TYPE public.employment_type AS ENUM ('permanent', 'temporary', 'contract');
CREATE TYPE public.application_status AS ENUM ('applied', 'shortlisted', 'accepted', 'rejected', 'cancelled', 'completed');
CREATE TYPE public.doc_type AS ENUM ('id_front', 'id_back', 'selfie', 'commercial_reg', 'license', 'rep_id');
CREATE TYPE public.doc_status AS ENUM ('submitted', 'approved', 'rejected');
CREATE TYPE public.dispute_status AS ENUM ('open', 'review', 'resolved', 'rejected');
CREATE TYPE public.attendance_method AS ENUM ('qr', 'gps', 'manual');
CREATE TYPE public.wallet_entry_type AS ENUM ('earning', 'payout', 'bonus', 'deduction');
CREATE TYPE public.wallet_entry_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'worker',
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Workers table
CREATE TABLE public.workers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'not_started',
  skills TEXT[] DEFAULT '{}',
  bio TEXT,
  availability TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers viewable by all" ON public.workers FOR SELECT USING (true);
CREATE POLICY "Workers can update own" ON public.workers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Workers can insert own" ON public.workers FOR INSERT WITH CHECK (auth.uid() = id);

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_name TEXT,
  legal_name TEXT,
  sector TEXT,
  size TEXT,
  logo_url TEXT,
  rating_avg NUMERIC DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses viewable by all" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Business can update own" ON public.businesses FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Business can insert own" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = id);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poster_role app_role NOT NULL DEFAULT 'business',
  business_id UUID REFERENCES public.businesses(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  address TEXT,
  job_type job_type NOT NULL DEFAULT 'shift',
  payment_model payment_model DEFAULT 'hourly',
  service_direction service_direction DEFAULT 'business_offers',
  employment_type employment_type DEFAULT 'temporary',
  pay_amount NUMERIC,
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency TEXT DEFAULT 'SAR',
  slots_total INTEGER DEFAULT 1,
  slots_filled INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ,
  status job_status NOT NULL DEFAULT 'open',
  sector TEXT,
  remote_allowed BOOLEAN DEFAULT false,
  experience_years INTEGER DEFAULT 0,
  skills_required TEXT[] DEFAULT '{}',
  category TEXT,
  subcategory TEXT,
  company_name TEXT,
  company_logo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs viewable by all" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Poster can insert jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = poster_id);
CREATE POLICY "Poster can update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = poster_id);
CREATE POLICY "Poster can delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = poster_id);

-- Applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'applied',
  cover_letter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, worker_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own applications" ON public.applications FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Job posters can view applications" ON public.applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.poster_id = auth.uid())
);
CREATE POLICY "Workers can apply" ON public.applications FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Workers can update own applications" ON public.applications FOR UPDATE USING (auth.uid() = worker_id);
CREATE POLICY "Job posters can update applications" ON public.applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.poster_id = auth.uid())
);

-- CV Records table
CREATE TABLE public.cv_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My CV',
  personal_info JSONB DEFAULT '{}',
  education JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  skills TEXT[] DEFAULT '{}',
  languages JSONB DEFAULT '[]',
  summary TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cv_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CVs" ON public.cv_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own CVs" ON public.cv_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CVs" ON public.cv_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CVs" ON public.cv_records FOR DELETE USING (auth.uid() = user_id);

-- Chat Sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  messages JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- KYC Documents table
CREATE TABLE public.kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_role app_role NOT NULL,
  doc_type doc_type NOT NULL,
  storage_path TEXT NOT NULL,
  status doc_status NOT NULL DEFAULT 'submitted',
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC docs" ON public.kyc_documents FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own KYC docs" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can delete own KYC docs" ON public.kyc_documents FOR DELETE USING (auth.uid() = owner_id);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES auth.users(id),
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  method attendance_method DEFAULT 'qr',
  approved_by_business BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own attendance" ON public.attendance FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Business can view job attendance" ON public.attendance FOR SELECT USING (auth.uid() = business_id);
CREATE POLICY "Workers can insert attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "Workers can update own attendance" ON public.attendance FOR UPDATE USING (auth.uid() = worker_id);
CREATE POLICY "Business can update attendance" ON public.attendance FOR UPDATE USING (auth.uid() = business_id);

-- Ratings table
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  from_role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, from_user_id, to_user_id)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings viewable by all" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Bank Accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  iban TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts" ON public.bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- Wallet Ledger table
CREATE TABLE public.wallet_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES auth.users(id),
  job_id UUID REFERENCES public.jobs(id),
  type wallet_entry_type NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status wallet_entry_status NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can view own wallet" ON public.wallet_ledger FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "Business can view own wallet" ON public.wallet_ledger FOR SELECT USING (auth.uid() = business_id);

-- Disputes table
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id),
  opened_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_by_role app_role NOT NULL,
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disputes" ON public.disputes FOR SELECT USING (auth.uid() = opened_by);
CREATE POLICY "Users can insert disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = opened_by);

-- Admin Actions table
CREATE TABLE public.admin_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert actions" ON public.admin_actions FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admins can view actions" ON public.admin_actions FOR SELECT USING (auth.uid() = admin_id);

-- User Roles table (for admin access)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for KYC and disputes
CREATE POLICY "Admins can view all KYC docs" ON public.kyc_documents FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update KYC docs" ON public.kyc_documents FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all disputes" ON public.disputes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update disputes" ON public.disputes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all admin actions" ON public.admin_actions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Storage buckets for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc_worker', 'kyc_worker', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('kyb_business', 'kyb_business', false);

CREATE POLICY "Users can upload own KYC files" ON storage.objects FOR INSERT WITH CHECK (
  (bucket_id = 'kyc_worker' OR bucket_id = 'kyb_business') AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own KYC files" ON storage.objects FOR SELECT USING (
  (bucket_id = 'kyc_worker' OR bucket_id = 'kyb_business') AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Admins can view all KYC files" ON storage.objects FOR SELECT USING (
  (bucket_id = 'kyc_worker' OR bucket_id = 'kyb_business') AND public.has_role(auth.uid(), 'admin')
);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'firstName', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'worker')
  );
  
  -- Also create worker or business record based on role
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'worker') = 'worker' THEN
    INSERT INTO public.workers (id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'business' THEN
    INSERT INTO public.businesses (id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cv_records_updated_at BEFORE UPDATE ON public.cv_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallet_ledger_updated_at BEFORE UPDATE ON public.wallet_ledger FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();