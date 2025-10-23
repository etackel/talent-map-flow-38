-- Allow users to update (and insert) their own role for local testing/development
-- THIS POLICY SHOULD **NOT** BE ENABLED IN PRODUCTION WITHOUT PROPER REVIEW

-- Allow updates when the row belongs to the authenticated user
CREATE POLICY IF NOT EXISTS "Users can update their own roles"
ON public.user_roles
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow inserts provided the user inserts a row for themselves only
CREATE POLICY IF NOT EXISTS "Users can insert their own roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);
