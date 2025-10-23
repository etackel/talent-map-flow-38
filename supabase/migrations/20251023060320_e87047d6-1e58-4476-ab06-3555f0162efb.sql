-- Fix infinite recursion in managers policy
DROP POLICY IF EXISTS "Managers can view their team members" ON public.employees;

-- Simplified policy that doesn't cause recursion
CREATE POLICY "Managers can view their team members" 
ON public.employees
FOR SELECT
USING (manager_id = auth.uid());

-- Add initial skills data for testing
INSERT INTO public.skills (name, category) VALUES
  ('JavaScript', 'Programming'),
  ('TypeScript', 'Programming'),
  ('Python', 'Programming'),
  ('Java', 'Programming'),
  ('React', 'Frontend'),
  ('Angular', 'Frontend'),
  ('Vue.js', 'Frontend'),
  ('Node.js', 'Backend'),
  ('Django', 'Backend'),
  ('Spring Boot', 'Backend'),
  ('SQL', 'Database'),
  ('PostgreSQL', 'Database'),
  ('MongoDB', 'Database'),
  ('AWS', 'Cloud'),
  ('Azure', 'Cloud'),
  ('Docker', 'DevOps'),
  ('Kubernetes', 'DevOps'),
  ('Git', 'Tools'),
  ('Agile', 'Methodology'),
  ('Scrum', 'Methodology'),
  ('Project Management', 'Management'),
  ('Team Leadership', 'Management'),
  ('UI/UX Design', 'Design'),
  ('Figma', 'Design'),
  ('Communication', 'Soft Skills'),
  ('Problem Solving', 'Soft Skills')
ON CONFLICT (name) DO NOTHING;