-- Allow users to update (and insert) their own role for local testing/development
-- THIS POLICY SHOULD **NOT** BE ENABLED IN PRODUCTION WITHOUT PROPER REVIEW

-- Enable Row Level Security on the user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop the update policy if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own roles' AND tablename = 'user_roles') THEN
        DROP POLICY "Users can update their own roles" ON public.user_roles;
    END IF;
END $$;

-- Allow updates when the row belongs to the authenticated user
CREATE POLICY "Users can update their own roles"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id);

-- Drop the insert policy if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own roles' AND tablename = 'user_roles') THEN
        DROP POLICY "Users can insert their own roles" ON public.user_roles;
    END IF;
END $$;

-- Allow inserts provided the user inserts a row for themselves only
CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
