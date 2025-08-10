-- Assign admin role to the first user (testuser@gmail.com)
INSERT INTO public.user_roles (user_id, role)
VALUES ('0a0e5a4a-6a97-44f5-bbba-f00a7416c9e6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also create a default user role for any user who doesn't have one
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;