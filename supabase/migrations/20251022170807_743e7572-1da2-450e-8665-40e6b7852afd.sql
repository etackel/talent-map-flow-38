-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('employee', 'manager', 'hr', 'executive');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role_title TEXT,
  manager_id UUID REFERENCES public.employees(id),
  department TEXT,
  utilization_percent INT CHECK (utilization_percent >= 0 AND utilization_percent <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Employees policies
CREATE POLICY "Users can view their own employee record"
  ON public.employees FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Managers can view their team members"
  ON public.employees FOR SELECT
  USING (
    manager_id IN (SELECT id FROM public.employees WHERE id = auth.uid())
  );

CREATE POLICY "HR and Executives can view all employees"
  ON public.employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('hr', 'executive')
    )
  );

-- Skills table
CREATE TABLE public.skills (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Skills policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can view skills"
  ON public.skills FOR SELECT
  TO authenticated
  USING (true);

-- Employee skills junction table
CREATE TABLE public.employee_skills (
  id SERIAL PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  skill_id INT REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  proficiency_level INT CHECK (proficiency_level >= 1 AND proficiency_level <= 5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employee_id, skill_id)
);

ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;

-- Employee skills policies
CREATE POLICY "Users can view their own skills"
  ON public.employee_skills FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Users can insert their own skills"
  ON public.employee_skills FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update their own skills"
  ON public.employee_skills FOR UPDATE
  USING (employee_id = auth.uid());

CREATE POLICY "Users can delete their own skills"
  ON public.employee_skills FOR DELETE
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view team member skills"
  ON public.employee_skills FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees 
      WHERE manager_id = auth.uid()
    )
  );

-- Process requisitions table
CREATE TABLE public.process_requisitions (
  id SERIAL PRIMARY KEY,
  manager_id UUID REFERENCES public.employees(id) NOT NULL,
  status TEXT DEFAULT 'PENDING_SCAN' CHECK (status IN ('PENDING_SCAN', 'PENDING_INTERNAL_REVIEW', 'APPROVED', 'REJECTED')),
  role_title TEXT NOT NULL,
  department TEXT,
  required_skills_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.process_requisitions ENABLE ROW LEVEL SECURITY;

-- Process requisitions policies
CREATE POLICY "Managers can view their own requisitions"
  ON public.process_requisitions FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Managers can create requisitions"
  ON public.process_requisitions FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Employees can view open internal positions"
  ON public.process_requisitions FOR SELECT
  USING (status = 'PENDING_INTERNAL_REVIEW');

CREATE POLICY "HR can view all requisitions"
  ON public.process_requisitions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('hr', 'executive')
    )
  );

-- Process transfers table
CREATE TABLE public.process_transfers (
  id SERIAL PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  new_role_title TEXT NOT NULL,
  new_department TEXT,
  current_manager_id UUID REFERENCES public.employees(id),
  new_manager_id UUID REFERENCES public.employees(id),
  status TEXT DEFAULT 'PENDING_APPROVALS' CHECK (status IN ('PENDING_APPROVALS', 'APPROVED', 'REJECTED', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.process_transfers ENABLE ROW LEVEL SECURITY;

-- Process transfers policies
CREATE POLICY "Employees can view their own transfers"
  ON public.process_transfers FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "Managers can view transfers involving their team"
  ON public.process_transfers FOR SELECT
  USING (
    current_manager_id = auth.uid() OR new_manager_id = auth.uid()
  );

CREATE POLICY "HR can view all transfers"
  ON public.process_transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('hr', 'executive')
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'employee'
  );
  
  INSERT INTO public.employees (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_skills_updated_at
  BEFORE UPDATE ON public.employee_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_process_requisitions_updated_at
  BEFORE UPDATE ON public.process_requisitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_process_transfers_updated_at
  BEFORE UPDATE ON public.process_transfers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default skills
INSERT INTO public.skills (name, category) VALUES
  ('JavaScript', 'Programming'),
  ('TypeScript', 'Programming'),
  ('Python', 'Programming'),
  ('React', 'Frontend'),
  ('Node.js', 'Backend'),
  ('SQL', 'Database'),
  ('Project Management', 'Management'),
  ('Team Leadership', 'Management'),
  ('Data Analysis', 'Analytics'),
  ('Communication', 'Soft Skills');