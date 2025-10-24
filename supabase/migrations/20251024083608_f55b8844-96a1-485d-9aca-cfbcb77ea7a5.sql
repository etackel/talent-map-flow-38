-- Create PostgreSQL function to find employees matching ALL required skills
CREATE OR REPLACE FUNCTION public.find_matching_employees(skill_ids_array INT[])
RETURNS TABLE (
  employee_id UUID,
  full_name TEXT,
  email TEXT,
  role_title TEXT,
  department TEXT,
  matched_skills_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS employee_id,
    e.full_name,
    e.email,
    e.role_title,
    e.department,
    COUNT(DISTINCT es.skill_id)::INT AS matched_skills_count
  FROM employees e
  INNER JOIN employee_skills es ON e.id = es.employee_id
  WHERE es.skill_id = ANY(skill_ids_array)
  GROUP BY e.id, e.full_name, e.email, e.role_title, e.department
  HAVING COUNT(DISTINCT es.skill_id) = array_length(skill_ids_array, 1);
END;
$$;