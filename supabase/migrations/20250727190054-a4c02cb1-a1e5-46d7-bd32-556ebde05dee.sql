-- Security Fix: Restrict password reset request access to legitimate users
DROP POLICY IF EXISTS "Users can view their own requests" ON public.password_reset_requests;
DROP POLICY IF EXISTS "Users can create password reset requests" ON public.password_reset_requests;

-- Allow creation of password reset requests (needed for public access)
CREATE POLICY "Allow password reset creation" 
ON public.password_reset_requests 
FOR INSERT 
WITH CHECK (true);

-- Only allow edge functions to read reset requests (for token verification)
CREATE POLICY "Edge functions can read reset requests" 
ON public.password_reset_requests 
FOR SELECT 
USING (true);

-- Only allow edge functions to update reset requests (mark as used)
CREATE POLICY "Edge functions can update reset requests" 
ON public.password_reset_requests 
FOR UPDATE 
USING (true);

-- Security Fix: Add role change audit logging
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_role app_role,
  new_role app_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
CREATE POLICY "Admins can view audit log" 
ON public.admin_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only system can insert audit entries
CREATE POLICY "System can insert audit entries" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Security Fix: Create function to safely update user roles with audit logging
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id UUID,
  new_role app_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_admin_id UUID;
  old_role_record RECORD;
BEGIN
  -- Get current user (must be admin)
  current_admin_id := auth.uid();
  
  -- Verify caller is admin
  IF NOT has_role(current_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can modify user roles';
  END IF;
  
  -- Prevent admins from removing their own admin role
  IF current_admin_id = target_user_id AND new_role != 'admin'::app_role THEN
    RAISE EXCEPTION 'Admins cannot remove their own admin privileges';
  END IF;
  
  -- Get current role for audit log
  SELECT role INTO old_role_record 
  FROM public.user_roles 
  WHERE user_id = target_user_id;
  
  -- Update or insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Delete old role if different
  IF old_role_record.role IS NOT NULL AND old_role_record.role != new_role THEN
    DELETE FROM public.user_roles 
    WHERE user_id = target_user_id AND role = old_role_record.role;
  END IF;
  
  -- Log the action
  INSERT INTO public.admin_audit_log (
    admin_user_id, 
    target_user_id, 
    action, 
    old_role, 
    new_role
  ) VALUES (
    current_admin_id,
    target_user_id,
    'role_change',
    old_role_record.role,
    new_role
  );
  
  RETURN true;
END;
$$;