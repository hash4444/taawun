-- The original trigger cast raw_user_meta_data->>'role' directly to the
-- app_role enum, but AuthContext.register() sends uppercase role values
-- ('WORKER' / 'BUSINESS') while the enum only accepts lowercase
-- ('worker' / 'business' / 'admin'). This crashed every signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  normalized_role public.app_role;
BEGIN
  normalized_role := COALESCE(lower(NEW.raw_user_meta_data->>'role'), 'worker')::public.app_role;

  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'firstName', ''),
    NEW.email,
    normalized_role
  );

  IF normalized_role = 'worker' THEN
    INSERT INTO public.workers (id) VALUES (NEW.id);
  ELSIF normalized_role = 'business' THEN
    INSERT INTO public.businesses (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
