-- CRITICAL SECURITY FIX: Move roles to separate table to prevent privilege escalation

-- Create user_roles table with proper security
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create helper function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Drop existing policies that depend on profiles.role
DROP POLICY IF EXISTS "HR and Executives can view all employees" ON public.employees;
DROP POLICY IF EXISTS "HR can view all requisitions" ON public.process_requisitions;
DROP POLICY IF EXISTS "HR can view all transfers" ON public.process_transfers;

-- Now safe to drop the role column from profiles
ALTER TABLE public.profiles DROP COLUMN role;

-- Recreate policies using the new has_role function
CREATE POLICY "HR and Executives can view all employees"
ON public.employees
FOR SELECT
USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'executive'));

CREATE POLICY "HR can view all requisitions"
ON public.process_requisitions
FOR SELECT
USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'executive'));

CREATE POLICY "HR can view all transfers"
ON public.process_transfers
FOR SELECT
USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'executive'));

-- Update handle_new_user function to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles without role
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Insert default employee role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  -- Insert into employees
  INSERT INTO public.employees (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  RETURN NEW;
END;
$$;