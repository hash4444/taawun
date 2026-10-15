-- Controlled-launch schema. Test on staging before production. Legacy approvals require re-review.
CREATE SCHEMA IF NOT EXISTS taawun_private;
REVOKE ALL ON SCHEMA taawun_private FROM PUBLIC;
GRANT USAGE ON SCHEMA taawun_private TO anon,authenticated,service_role;
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'interview';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'offered';
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'placed';
ALTER TYPE public.ai_match_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TABLE public.profiles ADD COLUMN account_initialized boolean NOT NULL DEFAULT false;
ALTER TABLE public.workers ADD COLUMN verification_reviewed_at timestamptz, ADD COLUMN verification_reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE public.businesses ADD COLUMN verification_reviewed_at timestamptz, ADD COLUMN verification_reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE public.applications ADD COLUMN interview_at timestamptz, ADD COLUMN employer_message text, ADD COLUMN decision_at timestamptz;
ALTER TABLE public.jobs ADD COLUMN schedule_kind text NOT NULL DEFAULT 'unspecified' CHECK(schedule_kind IN ('fixed','flexible','unspecified')), ADD COLUMN country text NOT NULL DEFAULT 'AE', ADD COLUMN student_friendly boolean NOT NULL DEFAULT true, ADD COLUMN eligibility_requirements text;
ALTER TABLE public.jobs ALTER COLUMN currency SET DEFAULT 'AED';
ALTER TABLE public.job_preferences ALTER COLUMN salary_currency SET DEFAULT 'AED';
ALTER TABLE public.ai_agent_settings ALTER COLUMN require_user_approval SET DEFAULT true;
ALTER TABLE public.ai_agent_settings ADD COLUMN mode text NOT NULL DEFAULT 'APPROVAL' CHECK(mode IN ('RECOMMENDATIONS','APPROVAL','AUTO')), ADD COLUMN auto_apply_consented_at timestamptz;
ALTER TABLE public.ai_agent_settings ADD CONSTRAINT agent_score_range CHECK(minimum_match_score BETWEEN 0 AND 100), ADD CONSTRAINT agent_daily_limit CHECK(daily_application_limit BETWEEN 0 AND 25);
ALTER TABLE public.candidate_hunter_settings ADD CONSTRAINT candidate_score_range CHECK(minimum_match_score BETWEEN 0 AND 100), ADD CONSTRAINT candidate_daily_limit CHECK(daily_outreach_limit BETWEEN 0 AND 25);
CREATE TABLE public.student_profiles (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, university text, degree text,
 graduation_year integer CHECK(graduation_year BETWEEN 1950 AND 2150), academic_status text, city text,
 skills text[] NOT NULL DEFAULT '{}', preferred_job_types text[] NOT NULL DEFAULT '{}', preferred_hours text,
 work_eligibility text, eligibility_confirmed boolean NOT NULL DEFAULT false, adult_consent_at timestamptz,
 consent_to_matching boolean NOT NULL DEFAULT false, onboarding_completed_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.availability_preferences (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, timezone text NOT NULL DEFAULT 'Asia/Dubai',
 weekly_windows jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(weekly_windows)='array'),
 minimum_shift_minutes integer NOT NULL DEFAULT 120 CHECK(minimum_shift_minutes BETWEEN 15 AND 1440),
 travel_buffer_minutes integer NOT NULL DEFAULT 30 CHECK(travel_buffer_minutes BETWEEN 0 AND 240),
 share_with_employers boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.academic_calendar_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 source text NOT NULL CHECK(source IN ('ics','manual','google','microsoft')), external_uid text NOT NULL,
 start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,busy boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(end_at>start_at),UNIQUE(user_id,source,external_uid)
);
CREATE INDEX calendar_events_user_time ON public.academic_calendar_events(user_id,start_at,end_at);
CREATE TABLE public.calendar_connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 provider text NOT NULL CHECK(provider IN ('ics','manual','google','microsoft')),
 status text NOT NULL DEFAULT 'requires_setup' CHECK(status IN ('connected','disconnected','requires_setup')),
 last_synced_at timestamptz,UNIQUE(user_id,provider)
);
CREATE TABLE taawun_private.calendar_credentials(connection_id uuid PRIMARY KEY REFERENCES public.calendar_connections(id) ON DELETE CASCADE,encrypted_credentials bytea NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 title text NOT NULL,title_ar text,body text NOT NULL,body_ar text,link text,event_type text NOT NULL DEFAULT 'application',
 data jsonb NOT NULL DEFAULT '{}',read_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created ON public.notifications(user_id,created_at DESC);
CREATE TABLE public.application_audit_logs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,actor_id uuid NOT NULL REFERENCES auth.users(id),previous_status text,new_status text NOT NULL,note text,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE taawun_private.ai_usage(user_id uuid NOT NULL,feature text NOT NULL,window_start timestamptz NOT NULL,used integer NOT NULL DEFAULT 0,PRIMARY KEY(user_id,feature,window_start));

-- Metadata only chooses a non-privileged audience. Administrator grants are never copied from profiles.
INSERT INTO public.user_roles(user_id,role) SELECT p.user_id,CASE WHEN p.role='business' THEN 'business'::public.app_role ELSE 'worker'::public.app_role END FROM public.profiles p WHERE NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p.user_id) ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION taawun_private.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin') $$;
CREATE OR REPLACE FUNCTION taawun_private.has_role(p_user uuid,p_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_user AND role=p_role) $$;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT (_user_id=auth.uid() OR taawun_private.is_admin()) AND taawun_private.has_role(_user_id,_role) $$;
CREATE OR REPLACE FUNCTION taawun_private.verified_business(p_user uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT taawun_private.has_role(p_user,'business') AND EXISTS(SELECT 1 FROM public.businesses b JOIN public.user_roles r ON r.user_id=b.verification_reviewed_by AND r.role='admin' WHERE b.id=p_user AND b.verification_status='verified' AND b.verification_reviewed_at IS NOT NULL) $$;
CREATE OR REPLACE FUNCTION taawun_private.can_view_candidate(p_worker uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id=a.job_id WHERE a.worker_id=p_worker AND j.poster_id=auth.uid()) $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA taawun_private FROM PUBLIC;
GRANT EXECUTE ON FUNCTION taawun_private.is_admin(),taawun_private.has_role(uuid,public.app_role),taawun_private.verified_business(uuid),taawun_private.can_view_candidate(uuid) TO authenticated,anon;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE chosen public.app_role;
BEGIN
 chosen:=CASE WHEN lower(NEW.raw_user_meta_data->>'role')='business' THEN 'business'::public.app_role ELSE 'worker'::public.app_role END;
 INSERT INTO public.profiles(user_id,full_name,email,role) VALUES(NEW.id,coalesce(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'firstName',''),NEW.email,chosen);
 INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,chosen);
 IF chosen='business' THEN INSERT INTO public.businesses(id) VALUES(NEW.id); ELSE INSERT INTO public.workers(id) VALUES(NEW.id); END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.complete_account_setup(account_role text,full_name text DEFAULT NULL,phone text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();p public.profiles;chosen public.app_role;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF account_role NOT IN ('worker','business') THEN RAISE EXCEPTION 'Invalid account role' USING ERRCODE='22023'; END IF;
 SELECT * INTO p FROM public.profiles WHERE user_id=uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Profile unavailable'; END IF;
 chosen:=account_role::public.app_role;
 IF p.account_initialized OR taawun_private.has_role(uid,'admin') THEN IF p.role<>chosen THEN RAISE EXCEPTION 'Account role is already established' USING ERRCODE='42501'; END IF;RETURN;END IF;
 IF p.role<>chosen AND (EXISTS(SELECT 1 FROM public.applications WHERE worker_id=uid) OR EXISTS(SELECT 1 FROM public.jobs WHERE poster_id=uid) OR EXISTS(SELECT 1 FROM public.cv_records WHERE user_id=uid) OR EXISTS(SELECT 1 FROM public.workers WHERE id=uid AND verification_status='verified') OR EXISTS(SELECT 1 FROM public.businesses WHERE id=uid AND verification_status='verified')) THEN RAISE EXCEPTION 'Established accounts cannot change role' USING ERRCODE='42501'; END IF;
 DELETE FROM public.user_roles WHERE user_id=uid AND role IN ('worker','business');
 INSERT INTO public.user_roles(user_id,role) VALUES(uid,chosen);
 UPDATE public.profiles SET role=chosen,full_name=coalesce(complete_account_setup.full_name,profiles.full_name),phone=coalesce(complete_account_setup.phone,profiles.phone),account_initialized=true WHERE user_id=uid;
 IF chosen='business' THEN INSERT INTO public.businesses(id) VALUES(uid) ON CONFLICT DO NOTHING;
 ELSE INSERT INTO public.workers(id) VALUES(uid) ON CONFLICT DO NOTHING;INSERT INTO public.student_profiles(user_id) VALUES(uid) ON CONFLICT DO NOTHING;END IF;
END $$;

-- Remove permissive policies before installing access boundaries.
DO $$ DECLARE x record;BEGIN FOR x IN SELECT schemaname,tablename,policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('profiles','workers','businesses','jobs','applications','cv_records','kyc_documents','attendance','admin_actions','user_roles','ai_job_matches','ai_application_drafts','ai_agent_logs','candidate_matches','candidate_outreach_drafts','candidate_hunter_logs') LOOP EXECUTE format('DROP POLICY %I ON %I.%I',x.policyname,x.schemaname,x.tablename);END LOOP;END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE INSERT,UPDATE,DELETE ON public.profiles,public.workers,public.businesses,public.applications,public.user_roles,public.admin_actions,public.ai_job_matches,public.ai_application_drafts,public.ai_agent_logs,public.candidate_matches,public.candidate_outreach_drafts,public.candidate_hunter_logs FROM authenticated;
GRANT SELECT ON public.jobs TO anon,authenticated;
GRANT SELECT ON public.profiles,public.workers,public.businesses,public.applications,public.cv_records,public.kyc_documents,public.user_roles,public.admin_actions,public.ai_job_matches,public.ai_application_drafts,public.ai_agent_logs,public.candidate_matches,public.candidate_outreach_drafts,public.candidate_hunter_logs TO authenticated;
GRANT UPDATE(full_name,phone,avatar_url,city,country) ON public.profiles TO authenticated;
GRANT UPDATE(skills,bio,availability) ON public.workers TO authenticated;
GRANT UPDATE(trade_name,legal_name,sector,size,logo_url) ON public.businesses TO authenticated;
GRANT UPDATE(cover_letter,notes) ON public.ai_application_drafts TO authenticated;
GRANT UPDATE(outreach_message,notes) ON public.candidate_outreach_drafts TO authenticated;
REVOKE UPDATE,INSERT,DELETE ON public.attendance FROM authenticated;
REVOKE UPDATE,INSERT,DELETE ON public.kyc_documents FROM authenticated;
GRANT INSERT(owner_id,owner_role,doc_type,storage_path,status) ON public.kyc_documents TO authenticated;
GRANT DELETE ON public.kyc_documents TO authenticated;
REVOKE UPDATE ON public.jobs FROM authenticated;
GRANT UPDATE(title,description,location,address,job_type,payment_model,employment_type,pay_amount,salary_min,salary_max,currency,slots_total,start_time,end_time,deadline,status,sector,remote_allowed,experience_years,skills_required,category,subcategory,company_name,company_logo,schedule_kind,country,student_friendly,eligibility_requirements) ON public.jobs TO authenticated;
GRANT INSERT,DELETE ON public.jobs TO authenticated;
CREATE POLICY profile_read ON public.profiles FOR SELECT TO authenticated USING(user_id=auth.uid() OR taawun_private.is_admin() OR taawun_private.can_view_candidate(user_id));
CREATE POLICY profile_write ON public.profiles FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY worker_read ON public.workers FOR SELECT TO authenticated USING(id=auth.uid() OR taawun_private.is_admin() OR taawun_private.can_view_candidate(id));
CREATE POLICY worker_write ON public.workers FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE POLICY business_read ON public.businesses FOR SELECT TO authenticated USING(id=auth.uid() OR taawun_private.is_admin());
CREATE POLICY business_write ON public.businesses FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE POLICY job_read ON public.jobs FOR SELECT TO anon,authenticated USING((status='open' AND end_time>now() AND (deadline IS NULL OR deadline>now())) OR poster_id=auth.uid() OR taawun_private.is_admin());
CREATE POLICY job_insert ON public.jobs FOR INSERT TO authenticated WITH CHECK(poster_id=auth.uid() AND poster_role='business' AND taawun_private.verified_business(auth.uid()));
CREATE POLICY job_update ON public.jobs FOR UPDATE TO authenticated USING(poster_id=auth.uid() AND taawun_private.verified_business(auth.uid())) WITH CHECK(poster_id=auth.uid() AND poster_role='business' AND taawun_private.verified_business(auth.uid()));
CREATE POLICY job_delete ON public.jobs FOR DELETE TO authenticated USING(poster_id=auth.uid() AND status='draft');
CREATE POLICY application_read ON public.applications FOR SELECT TO authenticated USING(worker_id=auth.uid() OR taawun_private.is_admin() OR EXISTS(SELECT 1 FROM public.jobs j WHERE j.id=job_id AND j.poster_id=auth.uid()));
CREATE POLICY cv_read ON public.cv_records FOR SELECT TO authenticated USING(user_id=auth.uid() OR taawun_private.is_admin() OR EXISTS(SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id=a.job_id WHERE a.worker_id=user_id AND j.poster_id=auth.uid()));
CREATE POLICY cv_insert ON public.cv_records FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE POLICY cv_update ON public.cv_records FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY cv_delete ON public.cv_records FOR DELETE TO authenticated USING(user_id=auth.uid());
CREATE POLICY kyc_read ON public.kyc_documents FOR SELECT TO authenticated USING(owner_id=auth.uid() OR taawun_private.is_admin());
CREATE POLICY kyc_insert ON public.kyc_documents FOR INSERT TO authenticated WITH CHECK(owner_id=auth.uid() AND taawun_private.has_role(auth.uid(),owner_role) AND owner_role IN ('worker','business') AND status='submitted' AND reviewed_at IS NULL AND reviewed_by IS NULL AND rejection_reason IS NULL AND storage_path LIKE (CASE owner_role WHEN 'worker' THEN 'kyc_worker/' ELSE 'kyb_business/' END)||auth.uid()::text||'/%');
CREATE POLICY kyc_delete ON public.kyc_documents FOR DELETE TO authenticated USING(owner_id=auth.uid() AND status<>'approved');
CREATE POLICY attendance_read ON public.attendance FOR SELECT TO authenticated USING(worker_id=auth.uid() OR business_id=auth.uid() OR taawun_private.is_admin());
CREATE POLICY roles_read ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid() OR taawun_private.is_admin());
CREATE POLICY admin_actions_read ON public.admin_actions FOR SELECT TO authenticated USING(taawun_private.is_admin());
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['ai_job_matches','ai_application_drafts','ai_agent_logs'] LOOP EXECUTE format('CREATE POLICY owner_read ON public.%I FOR SELECT TO authenticated USING(user_id=auth.uid())',t);END LOOP;
 FOREACH t IN ARRAY ARRAY['candidate_matches','candidate_outreach_drafts','candidate_hunter_logs'] LOOP EXECUTE format('CREATE POLICY business_read ON public.%I FOR SELECT TO authenticated USING(business_id=auth.uid() AND taawun_private.verified_business(auth.uid()))',t);END LOOP;
 FOREACH t IN ARRAY ARRAY['student_profiles','availability_preferences','academic_calendar_events','calendar_connections'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t);EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',t);EXECUTE format('CREATE POLICY owner_all ON public.%I TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid())',t);END LOOP;
END $$;
CREATE POLICY draft_edit ON public.ai_application_drafts FOR UPDATE TO authenticated USING(user_id=auth.uid() AND NOT submitted) WITH CHECK(user_id=auth.uid() AND NOT submitted);
CREATE POLICY outreach_edit ON public.candidate_outreach_drafts FOR UPDATE TO authenticated USING(business_id=auth.uid() AND NOT sent AND taawun_private.verified_business(auth.uid())) WITH CHECK(business_id=auth.uid() AND NOT sent);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications,public.application_audit_logs FROM anon,authenticated;
GRANT SELECT ON public.notifications,public.application_audit_logs TO authenticated;
GRANT UPDATE(read_at) ON public.notifications TO authenticated;
CREATE POLICY notification_read ON public.notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY notification_mark_read ON public.notifications FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY application_audit_read ON public.application_audit_logs FOR SELECT TO authenticated USING(taawun_private.is_admin() OR EXISTS(SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id=a.job_id WHERE a.id=application_id AND (a.worker_id=auth.uid() OR j.poster_id=auth.uid())));
CREATE TRIGGER student_profiles_updated BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER availability_updated BEFORE UPDATE ON public.availability_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
UPDATE storage.buckets SET public=false,file_size_limit=15728640,allowed_mime_types=ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png'] WHERE id='cv_files';
UPDATE storage.buckets SET file_size_limit=15728640,allowed_mime_types=ARRAY['application/pdf','image/jpeg','image/png','image/webp','image/heic'] WHERE id IN ('kyc_worker','kyb_business');
CREATE POLICY candidate_cv_file_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='cv_files' AND EXISTS(SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id=a.job_id WHERE a.worker_id::text=(storage.foldername(name))[1] AND j.poster_id=auth.uid()));
CREATE POLICY owner_kyc_file_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id IN ('kyc_worker','kyb_business') AND (storage.foldername(name))[1]=auth.uid()::text AND NOT EXISTS(SELECT 1 FROM public.kyc_documents d WHERE d.storage_path=bucket_id||'/'||name AND d.status='approved'));

CREATE OR REPLACE FUNCTION taawun_private.guard_job() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.end_time<=now() AND NEW.status='open' THEN RAISE EXCEPTION 'Open jobs must have a future end time';END IF;
 IF NEW.start_time IS NOT NULL AND NEW.end_time<=NEW.start_time THEN RAISE EXCEPTION 'Job end must follow start';END IF;
 IF NEW.deadline IS NOT NULL AND NEW.deadline>NEW.end_time THEN RAISE EXCEPTION 'Deadline must be before expiry';END IF;
 IF NEW.pay_amount<0 OR NEW.salary_min<0 OR NEW.salary_max<0 OR NEW.salary_max<NEW.salary_min THEN RAISE EXCEPTION 'Invalid pay range';END IF;
 IF NEW.slots_total<1 OR NEW.slots_total<NEW.slots_filled THEN RAISE EXCEPTION 'Invalid number of places';END IF;
 IF TG_OP='UPDATE' AND OLD.slots_filled>0 AND ROW(NEW.start_time,NEW.end_time,NEW.pay_amount,NEW.salary_min,NEW.salary_max,NEW.currency,NEW.location,NEW.address,NEW.remote_allowed,NEW.schedule_kind,NEW.skills_required,NEW.experience_years,NEW.eligibility_requirements) IS DISTINCT FROM ROW(OLD.start_time,OLD.end_time,OLD.pay_amount,OLD.salary_min,OLD.salary_max,OLD.currency,OLD.location,OLD.address,OLD.remote_allowed,OLD.schedule_kind,OLD.skills_required,OLD.experience_years,OLD.eligibility_requirements) THEN RAISE EXCEPTION 'Agreed job terms cannot change after a student accepts';END IF;
 IF TG_OP='UPDATE' AND NEW.status='draft' AND OLD.status<>'draft' AND EXISTS(SELECT 1 FROM public.applications WHERE job_id=OLD.id) THEN RAISE EXCEPTION 'A job with applications cannot return to draft';END IF;
 IF TG_OP='INSERT' AND auth.uid() IS NOT NULL THEN
  IF NEW.slots_filled<>0 OR NEW.poster_id<>auth.uid() OR NEW.poster_role<>'business' OR (NEW.business_id IS NOT NULL AND NEW.business_id<>auth.uid()) THEN RAISE EXCEPTION 'Invalid job owner or filled slots' USING ERRCODE='42501';END IF;
  NEW.business_id:=auth.uid();
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER secure_job BEFORE INSERT OR UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION taawun_private.guard_job();
REVOKE ALL ON FUNCTION taawun_private.guard_job() FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.request_verification() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();r public.app_role;required text[];
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 SELECT role INTO r FROM public.profiles WHERE user_id=uid;
 required:=CASE r WHEN 'business' THEN ARRAY['commercial_reg','license','rep_id'] ELSE ARRAY['id_front','id_back','selfie'] END;
 IF EXISTS(SELECT 1 FROM unnest(required) d WHERE NOT EXISTS(SELECT 1 FROM public.kyc_documents k WHERE k.owner_id=uid AND k.doc_type::text=d AND k.status IN ('submitted','approved'))) THEN RAISE EXCEPTION 'Upload all required verification documents first';END IF;
 IF r='business' THEN UPDATE public.businesses SET verification_status='pending_review' WHERE id=uid AND verification_status<>'verified';ELSE UPDATE public.workers SET verification_status='pending_review' WHERE id=uid AND verification_status<>'verified';END IF;
END $$;
CREATE OR REPLACE FUNCTION public.review_verification_document(p_document_id uuid,p_status text,p_reason text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d public.kyc_documents;
BEGIN
 IF NOT taawun_private.is_admin() THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501';END IF;
 IF p_status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid review status';END IF;
 UPDATE public.kyc_documents SET status=p_status::public.doc_status,reviewed_at=now(),reviewed_by=auth.uid(),rejection_reason=CASE WHEN p_status='rejected' THEN left(p_reason,2000) END WHERE id=p_document_id RETURNING * INTO d;
 IF NOT FOUND THEN RAISE EXCEPTION 'Document not found';END IF;
 IF p_status='rejected' THEN
  IF d.owner_role='business' THEN UPDATE public.businesses SET verification_status='rejected',verification_reviewed_at=now(),verification_reviewed_by=auth.uid() WHERE id=d.owner_id;
  ELSIF d.owner_role='worker' THEN UPDATE public.workers SET verification_status='rejected',verification_reviewed_at=now(),verification_reviewed_by=auth.uid() WHERE id=d.owner_id;END IF;
 END IF;
 INSERT INTO public.admin_actions(admin_id,target_type,target_id,action,notes) VALUES(auth.uid(),'document',p_document_id::text,'document_'||p_status,left(p_reason,2000));
 INSERT INTO public.notifications(user_id,title,body,link,event_type) VALUES(d.owner_id,'Verification document reviewed','Your document was '||p_status||'.','/'||CASE d.owner_role WHEN 'business' THEN 'business' ELSE 'worker' END||'/verification','verification');
END $$;
CREATE OR REPLACE FUNCTION public.review_verification(p_user_id uuid,p_role text,p_status text,p_notes text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE required text[];
BEGIN
 IF NOT taawun_private.is_admin() THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501';END IF;
 IF p_role NOT IN ('worker','business') OR p_status NOT IN ('verified','rejected') THEN RAISE EXCEPTION 'Invalid verification decision';END IF;
 IF NOT taawun_private.has_role(p_user_id,p_role::public.app_role) THEN RAISE EXCEPTION 'Account role mismatch';END IF;
 required:=CASE p_role WHEN 'business' THEN ARRAY['commercial_reg','license','rep_id'] ELSE ARRAY['id_front','id_back','selfie'] END;
 IF p_status='verified' AND EXISTS(SELECT 1 FROM unnest(required) d WHERE NOT EXISTS(SELECT 1 FROM public.kyc_documents k WHERE k.owner_id=p_user_id AND k.doc_type::text=d AND k.status='approved' AND k.reviewed_by IS NOT NULL)) THEN RAISE EXCEPTION 'Approve all required documents first';END IF;
 IF p_role='business' THEN UPDATE public.businesses SET verification_status=p_status,verification_reviewed_at=now(),verification_reviewed_by=auth.uid() WHERE id=p_user_id;ELSE UPDATE public.workers SET verification_status=p_status,verification_reviewed_at=now(),verification_reviewed_by=auth.uid() WHERE id=p_user_id;END IF;
 INSERT INTO public.admin_actions(admin_id,target_type,target_id,action,notes) VALUES(auth.uid(),p_role,p_user_id::text,'verification_'||p_status,left(p_notes,2000));
 INSERT INTO public.notifications(user_id,title,body,link,event_type) VALUES(p_user_id,'Verification updated','Your account verification is '||p_status||'.','/'||CASE p_role WHEN 'business' THEN 'business' ELSE 'worker' END||'/verification','verification');
END $$;
-- Fixed shifts need explicit willingness plus no academic conflicts. Other schedules require employer agreement.
CREATE OR REPLACE FUNCTION taawun_private.local_to_instant(p_wall timestamp,p_zone text) RETURNS timestamptz LANGUAGE plpgsql STABLE SET search_path='' AS $$
DECLARE candidate timestamptz:=p_wall AT TIME ZONE p_zone;earlier timestamptz;minutes integer;
BEGIN
 IF candidate AT TIME ZONE p_zone<>p_wall THEN RAISE EXCEPTION 'Preferred hours include a nonexistent daylight-saving time';END IF;
 -- For repeated wall times, use the earliest instant, matching the shared browser/Edge rules.
 FOREACH minutes IN ARRAY ARRAY[120,90,60,30] LOOP earlier:=candidate-make_interval(mins=>minutes);IF earlier AT TIME ZONE p_zone=p_wall THEN candidate:=earlier;END IF;END LOOP;
 RETURN candidate;
END $$;
REVOKE ALL ON FUNCTION taawun_private.local_to_instant(timestamp,text) FROM PUBLIC;
CREATE OR REPLACE FUNCTION taawun_private.assert_application_eligible(p_user uuid,p_job public.jobs,p_existing_offer boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.student_profiles;prefs public.availability_preferences;local_start timestamp;local_end timestamp;covered_until timestamptz;preferred_window record;calendar_sync timestamptz;
BEGIN
 SELECT * INTO s FROM public.student_profiles WHERE user_id=p_user;
 IF NOT taawun_private.verified_business(p_job.poster_id) THEN RAISE EXCEPTION 'Employer verification is unavailable';END IF;
 IF s.adult_consent_at IS NULL OR NOT s.eligibility_confirmed OR nullif(trim(s.work_eligibility),'') IS NULL THEN RAISE EXCEPTION 'Complete the 18+ and work eligibility declarations before applying';END IF;
 IF (NOT p_existing_offer AND p_job.status<>'open') OR (p_existing_offer AND p_job.status NOT IN ('open','in_progress')) OR p_job.end_time<=now() OR (NOT p_existing_offer AND p_job.deadline IS NOT NULL AND p_job.deadline<=now()) OR p_job.slots_filled>=p_job.slots_total THEN RAISE EXCEPTION 'This job is closed, expired, or full';END IF;
 IF p_job.poster_id=p_user THEN RAISE EXCEPTION 'You cannot apply to your own job';END IF;
 IF p_job.schedule_kind='fixed' THEN
  IF p_job.start_time IS NULL OR p_job.start_time<=now() THEN RAISE EXCEPTION 'This job is missing a future fixed schedule';END IF;
  SELECT * INTO prefs FROM public.availability_preferences WHERE user_id=p_user;
  IF NOT FOUND OR jsonb_array_length(prefs.weekly_windows)=0 THEN RAISE EXCEPTION 'Set preferred working hours before applying to a fixed shift';END IF;
  IF EXISTS(SELECT 1 FROM public.calendar_connections WHERE user_id=p_user AND provider='ics' AND status='connected') THEN
   SELECT last_synced_at INTO calendar_sync FROM public.calendar_connections WHERE user_id=p_user AND provider='ics' AND status='connected';
   IF calendar_sync IS NULL OR p_job.end_time+make_interval(mins=>prefs.travel_buffer_minutes)>calendar_sync+interval '120 days' THEN RAISE EXCEPTION 'This shift is beyond the imported 120-day calendar coverage; re-import a current timetable before applying';END IF;
  END IF;
  IF extract(epoch FROM p_job.end_time-p_job.start_time)/60<prefs.minimum_shift_minutes THEN RAISE EXCEPTION 'Shift is shorter than your minimum preferred duration';END IF;
  IF EXISTS(SELECT 1 FROM public.academic_calendar_events e WHERE e.user_id=p_user AND e.busy AND e.start_at<p_job.end_time+make_interval(mins=>prefs.travel_buffer_minutes) AND e.end_at>p_job.start_time-make_interval(mins=>prefs.travel_buffer_minutes)) THEN RAISE EXCEPTION 'This shift conflicts with your academic calendar or travel buffer';END IF;
  local_start:=p_job.start_time AT TIME ZONE prefs.timezone;local_end:=p_job.end_time AT TIME ZONE prefs.timezone;
  IF local_end-local_start>interval '7 days' THEN RAISE EXCEPTION 'Fixed shifts must be shorter than seven days';END IF;
  covered_until:=p_job.start_time;
  FOR preferred_window IN SELECT taawun_private.local_to_instant(d::date+(w->>'start')::time,prefs.timezone) AS a,taawun_private.local_to_instant(d::date+(w->>'end')::time,prefs.timezone) AS b
   FROM generate_series(date_trunc('day',local_start)-interval '1 day',date_trunc('day',local_end)+interval '1 day',interval '1 day') d
   CROSS JOIN jsonb_array_elements(prefs.weekly_windows) w WHERE (w->>'weekday')::integer=extract(dow FROM d)::integer ORDER BY a LOOP
   IF preferred_window.a<=covered_until AND preferred_window.b>covered_until THEN covered_until:=preferred_window.b;END IF;
  END LOOP;
  IF covered_until<p_job.end_time THEN RAISE EXCEPTION 'This shift is outside your preferred working hours';END IF;
 END IF;
END $$;
REVOKE ALL ON FUNCTION taawun_private.assert_application_eligible(uuid,public.jobs,boolean) FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.submit_application(p_job_id uuid,p_cover_letter text DEFAULT NULL,p_ai_draft_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();j public.jobs;d public.ai_application_drafts;aid uuid;letter text:=p_cover_letter;agent public.ai_agent_settings;preferences public.job_preferences;student public.student_profiles;cv public.cv_records;score integer;used_today integer;required_skill text;
BEGIN
 IF uid IS NULL OR NOT taawun_private.has_role(uid,'worker') THEN RAISE EXCEPTION 'Student account required' USING ERRCODE='42501';END IF;
 SELECT * INTO j FROM public.jobs WHERE id=p_job_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Job unavailable';END IF;
 PERFORM taawun_private.assert_application_eligible(uid,j);
 IF EXISTS(SELECT 1 FROM public.applications WHERE job_id=j.id AND worker_id=uid) THEN RAISE EXCEPTION 'You have already applied to this job' USING ERRCODE='23505';END IF;
 IF p_ai_draft_id IS NOT NULL THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,2));
  SELECT * INTO d FROM public.ai_application_drafts WHERE id=p_ai_draft_id AND user_id=uid AND job_id=j.id FOR UPDATE;
  IF NOT FOUND OR d.submitted THEN RAISE EXCEPTION 'Application draft unavailable';END IF;
  SELECT * INTO agent FROM public.ai_agent_settings WHERE user_id=uid;
  SELECT * INTO student FROM public.student_profiles WHERE user_id=uid;
  SELECT * INTO preferences FROM public.job_preferences WHERE user_id=uid;
  SELECT * INTO cv FROM public.cv_records WHERE user_id=uid ORDER BY updated_at DESC LIMIT 1;
  IF coalesce(agent.paused,false) OR NOT student.consent_to_matching THEN RAISE EXCEPTION 'Matching is paused or profile consent has been withdrawn';END IF;
  IF coalesce(agent.mode,'APPROVAL')='RECOMMENDATIONS' THEN RAISE EXCEPTION 'Choose approval mode before submitting a prepared application';END IF;
  SELECT count(*) INTO used_today FROM public.applications WHERE worker_id=uid AND cover_letter_ai AND created_at>=date_trunc('day',now() AT TIME ZONE 'Asia/Dubai') AT TIME ZONE 'Asia/Dubai';
  IF used_today>=least(coalesce(agent.daily_application_limit,10),25) THEN RAISE EXCEPTION 'Daily prepared application limit reached';END IF;
  SELECT m.score INTO score FROM public.ai_job_matches m WHERE m.id=d.match_id AND m.user_id=uid AND m.job_id=j.id;
  IF coalesce(score,0)<coalesce(agent.minimum_match_score,80) THEN RAISE EXCEPTION 'Match no longer meets your minimum score';END IF;
  IF 80+(CASE WHEN cardinality(coalesce(preferences.job_types,'{}'))>0 THEN CASE WHEN j.job_type::text=ANY(preferences.job_types) THEN 20 ELSE 0 END ELSE CASE WHEN cardinality(coalesce(student.preferred_job_types,'{}'))=0 OR j.job_type::text=ANY(student.preferred_job_types) THEN 20 ELSE 0 END END)<coalesce(agent.minimum_match_score,80) THEN RAISE EXCEPTION 'Current opportunity preferences no longer meet your minimum score';END IF;
  IF EXISTS(SELECT 1 FROM unnest(coalesce(agent.excluded_companies,'{}')) c WHERE lower(coalesce(j.company_name,'')) LIKE '%'||lower(c)||'%') OR EXISTS(SELECT 1 FROM unnest(coalesce(agent.excluded_keywords,'{}')) k WHERE lower(j.title||' '||coalesce(j.description,'')) LIKE '%'||lower(k)||'%') THEN RAISE EXCEPTION 'Job is excluded by your current settings';END IF;
  IF cardinality(coalesce(preferences.locations,'{}'))>0 AND NOT j.remote_allowed AND NOT EXISTS(SELECT 1 FROM unnest(preferences.locations) l WHERE lower(coalesce(j.location,'')) LIKE '%'||lower(l)||'%') THEN RAISE EXCEPTION 'Job does not meet your current location preferences';END IF;
  IF coalesce(preferences.salary_min,0)>0 THEN
   IF j.payment_model<>'monthly' OR coalesce(j.currency,'')<>coalesce(preferences.salary_currency,'AED') THEN RAISE EXCEPTION 'Pay period or currency needs manual review before applying';END IF;
   IF coalesce(j.salary_max,j.salary_min,j.pay_amount,0)<preferences.salary_min THEN RAISE EXCEPTION 'Job does not meet your minimum monthly pay';END IF;
  END IF;
  FOREACH required_skill IN ARRAY coalesce(j.skills_required,'{}') LOOP
   IF NOT EXISTS(SELECT 1 FROM unnest(coalesce(student.skills,'{}')||coalesce(cv.skills,'{}')) recorded WHERE lower(trim(recorded))=lower(trim(required_skill))) THEN RAISE EXCEPTION 'A required skill is not recorded in your profile';END IF;
  END LOOP;
  IF coalesce(j.experience_years,0)>taawun_private.cv_experience_years(cv.experience) THEN RAISE EXCEPTION 'Recorded experience does not meet the job requirement';END IF;
  letter:=d.cover_letter;
 END IF;
 IF length(letter)>10000 THEN RAISE EXCEPTION 'Cover letter is too long';END IF;
 INSERT INTO public.applications(job_id,worker_id,cover_letter,cover_letter_ai,is_auto_applied,status) VALUES(j.id,uid,letter,p_ai_draft_id IS NOT NULL,false,'applied') RETURNING id INTO aid;
 IF p_ai_draft_id IS NOT NULL THEN UPDATE public.ai_application_drafts SET submitted=true WHERE id=d.id;UPDATE public.ai_job_matches SET status='submitted' WHERE id=d.match_id;INSERT INTO public.ai_agent_logs(user_id,job_id,action,reason) VALUES(uid,j.id,'approved_application','Student explicitly approved and submitted the prepared application');END IF;
 INSERT INTO public.application_audit_logs(application_id,actor_id,new_status) VALUES(aid,uid,'applied');
 INSERT INTO public.notifications(user_id,title,title_ar,body,body_ar,link) VALUES(j.poster_id,'New application','طلب جديد','A student applied to '||j.title,'تم تقديم طلب جديد','/business/job/'||j.id);
 INSERT INTO public.notifications(user_id,title,title_ar,body,body_ar,link) VALUES(uid,'Application submitted','تم إرسال الطلب','Your application for '||j.title||' was submitted.','تم إرسال طلبك بنجاح','/worker/applications');
 RETURN aid;
END $$;
CREATE OR REPLACE FUNCTION public.update_application_status(p_application_id uuid,p_status text,p_interview_at timestamptz DEFAULT NULL,p_message text DEFAULT NULL) RETURNS public.applications LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();a public.applications;j public.jobs;old_status text;permitted boolean:=false;recipient uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 SELECT j0.* INTO j FROM public.jobs j0 JOIN public.applications a0 ON a0.job_id=j0.id WHERE a0.id=p_application_id FOR UPDATE OF j0;
 SELECT * INTO a FROM public.applications WHERE id=p_application_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Application unavailable';END IF;
 old_status:=a.status::text;
 IF uid=j.poster_id AND taawun_private.verified_business(uid) THEN
  permitted:=(old_status='applied' AND p_status IN ('shortlisted','interview','offered','rejected')) OR (old_status='shortlisted' AND p_status IN ('interview','offered','rejected')) OR (old_status='interview' AND p_status IN ('offered','rejected')) OR (old_status='accepted' AND p_status='placed') OR (old_status='placed' AND p_status='completed');recipient:=a.worker_id;
 ELSIF uid=a.worker_id THEN
  permitted:=(old_status='offered' AND p_status IN ('accepted','rejected')) OR (old_status IN ('applied','shortlisted','interview','offered') AND p_status='cancelled');recipient:=j.poster_id;
 END IF;
 IF NOT permitted THEN RAISE EXCEPTION 'You cannot make this application decision' USING ERRCODE='42501';END IF;
 IF p_status='interview' AND (p_interview_at IS NULL OR p_interview_at<=now()) THEN RAISE EXCEPTION 'Choose a future interview time';END IF;
 IF p_status IN ('offered','accepted') AND (j.status NOT IN ('open','in_progress') OR j.end_time<=now()) THEN RAISE EXCEPTION 'The job is no longer available';END IF;
 IF p_status='accepted' THEN PERFORM taawun_private.assert_application_eligible(uid,j,true);IF j.slots_filled>=j.slots_total THEN RAISE EXCEPTION 'All places have been filled';END IF;UPDATE public.jobs SET slots_filled=slots_filled+1 WHERE id=j.id;END IF;
 UPDATE public.applications SET status=p_status::public.application_status,interview_at=CASE WHEN p_status='interview' THEN p_interview_at ELSE interview_at END,employer_message=CASE WHEN uid=j.poster_id THEN left(p_message,4000) ELSE employer_message END,decision_at=now() WHERE id=a.id RETURNING * INTO a;
 INSERT INTO public.application_audit_logs(application_id,actor_id,previous_status,new_status,note) VALUES(a.id,uid,old_status,p_status,left(p_message,4000));
 INSERT INTO public.notifications(user_id,title,title_ar,body,body_ar,link) VALUES(recipient,'Application update','تحديث الطلب','The application for '||j.title||' is now '||p_status||'.','تم تحديث حالة الطلب',CASE WHEN recipient=j.poster_id THEN '/business/job/'||j.id ELSE '/worker/applications' END);
 RETURN a;
END $$;
-- Durable counters: callers cannot select another account or raise their quota.
CREATE OR REPLACE FUNCTION public.consume_ai_budget(p_feature text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid();cap integer;bucket timestamptz:=date_trunc('day',now() AT TIME ZONE 'Asia/Dubai') AT TIME ZONE 'Asia/Dubai';amount integer;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 cap:=CASE p_feature WHEN 'chat' THEN 20 WHEN 'job_hunter' THEN 5 WHEN 'candidate_hunter' THEN 5 ELSE 0 END;
 IF cap=0 THEN RAISE EXCEPTION 'Unknown AI feature';END IF;
 INSERT INTO taawun_private.ai_usage(user_id,feature,window_start,used) VALUES(uid,p_feature,bucket,1) ON CONFLICT(user_id,feature,window_start) DO UPDATE SET used=ai_usage.used+1 WHERE ai_usage.used<cap RETURNING used INTO amount;
 IF amount IS NULL THEN RETURN false;END IF;
 IF p_feature='chat' THEN
  amount:=NULL;
  INSERT INTO taawun_private.ai_usage(user_id,feature,window_start,used) VALUES(uid,'chat:minute',date_trunc('minute',now()),1) ON CONFLICT(user_id,feature,window_start) DO UPDATE SET used=ai_usage.used+1 WHERE ai_usage.used<5 RETURNING used INTO amount;
  IF amount IS NULL THEN RETURN false;END IF;
  amount:=NULL;
  INSERT INTO taawun_private.ai_usage(user_id,feature,window_start,used) VALUES('00000000-0000-0000-0000-000000000000','chat:global',bucket,1) ON CONFLICT(user_id,feature,window_start) DO UPDATE SET used=ai_usage.used+1 WHERE ai_usage.used<100 RETURNING used INTO amount;
 END IF;
 RETURN amount IS NOT NULL;
END $$;
CREATE OR REPLACE FUNCTION public.disconnect_calendar(p_provider text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 DELETE FROM public.academic_calendar_events WHERE user_id=auth.uid() AND source=p_provider;
 DELETE FROM public.calendar_connections WHERE user_id=auth.uid() AND provider=p_provider;
END $$;
DO $$ DECLARE x record;BEGIN
 FOR x IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('complete_account_setup','request_verification','review_verification_document','review_verification','submit_application','update_application_status','consume_ai_budget','disconnect_calendar') LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',x.signature);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',x.signature);END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA taawun_private FROM PUBLIC,anon,authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA taawun_private TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.cv_records,public.chat_sessions,public.job_preferences,public.ai_agent_settings,public.candidate_hunter_settings TO authenticated;
-- NOT VALID preserves orphaned legacy records while enforcing references for all new writes.
ALTER TABLE public.ai_job_matches ADD CONSTRAINT ai_job_matches_job_id_fkey FOREIGN KEY(job_id) REFERENCES public.jobs(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.ai_application_drafts ADD CONSTRAINT ai_application_drafts_job_id_fkey FOREIGN KEY(job_id) REFERENCES public.jobs(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.candidate_matches ADD CONSTRAINT candidate_matches_job_id_fkey FOREIGN KEY(job_id) REFERENCES public.jobs(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.candidate_outreach_drafts ADD CONSTRAINT candidate_outreach_drafts_job_id_fkey FOREIGN KEY(job_id) REFERENCES public.jobs(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.notifications ADD COLUMN dedupe_key text UNIQUE;
CREATE OR REPLACE FUNCTION public.replace_calendar_import(p_events jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e jsonb;total integer;
BEGIN
 IF auth.uid() IS NULL OR NOT taawun_private.has_role(auth.uid(),'worker') THEN RAISE EXCEPTION 'Student account required' USING ERRCODE='42501';END IF;
 IF p_events IS NULL OR jsonb_typeof(p_events)<>'array' OR jsonb_array_length(p_events)>2000 THEN RAISE EXCEPTION 'Calendar import must contain at most 2000 events';END IF;
 FOR e IN SELECT * FROM jsonb_array_elements(p_events) LOOP
  IF nullif(e->>'external_uid','') IS NULL OR length(e->>'external_uid')>1000 OR (e->>'start_at')::timestamptz IS NULL OR (e->>'end_at')::timestamptz IS NULL OR (e->>'end_at')::timestamptz<=(e->>'start_at')::timestamptz THEN RAISE EXCEPTION 'Invalid calendar event';END IF;
 END LOOP;
 -- Serializes two imports from the same student without touching another account.
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 DELETE FROM public.academic_calendar_events WHERE user_id=auth.uid() AND source='ics';
 INSERT INTO public.academic_calendar_events(user_id,source,external_uid,start_at,end_at,busy) SELECT auth.uid(),'ics',input_event.value->>'external_uid',(input_event.value->>'start_at')::timestamptz,(input_event.value->>'end_at')::timestamptz,coalesce((input_event.value->>'busy')::boolean,true) FROM jsonb_array_elements(p_events) AS input_event(value);
 GET DIAGNOSTICS total=ROW_COUNT;
 INSERT INTO public.calendar_connections(user_id,provider,status,last_synced_at) VALUES(auth.uid(),'ics','connected',now()) ON CONFLICT(user_id,provider) DO UPDATE SET status='connected',last_synced_at=now();
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.replace_calendar_import(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.replace_calendar_import(jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION taawun_private.validate_availability() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE w jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=NEW.timezone) THEN RAISE EXCEPTION 'Invalid IANA timezone';END IF;
 IF jsonb_array_length(NEW.weekly_windows)>28 THEN RAISE EXCEPTION 'Too many preferred windows';END IF;
 FOR w IN SELECT * FROM jsonb_array_elements(NEW.weekly_windows) LOOP
  IF (w->>'weekday')::integer NOT BETWEEN 0 AND 6 OR (w->>'start') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR (w->>'end') !~ '^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$' OR (w->>'start')::time>=(w->>'end')::time THEN RAISE EXCEPTION 'Invalid preferred hours; split overnight windows at midnight';END IF;
  IF w->>'weekday' IS NULL OR w->>'start' IS NULL OR w->>'end' IS NULL THEN RAISE EXCEPTION 'Incomplete preferred hours';END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_availability BEFORE INSERT OR UPDATE ON public.availability_preferences FOR EACH ROW EXECUTE FUNCTION taawun_private.validate_availability();
REVOKE ALL ON FUNCTION taawun_private.validate_availability() FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.consume_ai_budget_for_user(p_user_id uuid,p_feature text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cap integer;bucket timestamptz:=date_trunc('day',now() AT TIME ZONE 'Asia/Dubai') AT TIME ZONE 'Asia/Dubai';amount integer;
BEGIN
 cap:=CASE p_feature WHEN 'job_hunter' THEN 5 WHEN 'candidate_hunter' THEN 5 ELSE 0 END;
 IF cap=0 THEN RAISE EXCEPTION 'Unknown scheduled feature';END IF;
 INSERT INTO taawun_private.ai_usage(user_id,feature,window_start,used) VALUES(p_user_id,p_feature,bucket,1) ON CONFLICT(user_id,feature,window_start) DO UPDATE SET used=ai_usage.used+1 WHERE ai_usage.used<cap RETURNING used INTO amount;
 RETURN amount IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.consume_ai_budget_for_user(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_budget_for_user(uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.send_candidate_outreach(p_draft_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d public.candidate_outreach_drafts;j public.jobs;s public.candidate_hunter_settings;sent_today integer;
BEGIN
 IF auth.uid() IS NULL OR NOT taawun_private.verified_business(auth.uid()) THEN RAISE EXCEPTION 'Verified employer required' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,1));
 SELECT * INTO d FROM public.candidate_outreach_drafts WHERE id=p_draft_id AND business_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Outreach draft unavailable';END IF;
 IF d.sent THEN RETURN;END IF;
 IF NOT EXISTS(SELECT 1 FROM public.student_profiles WHERE user_id=d.worker_id AND consent_to_matching AND adult_consent_at IS NOT NULL) THEN RAISE EXCEPTION 'Student has not consented to employer recommendations';END IF;
 SELECT * INTO j FROM public.jobs WHERE id=d.job_id AND poster_id=auth.uid() AND status='open' AND end_time>now() AND (deadline IS NULL OR deadline>now());
 IF NOT FOUND THEN RAISE EXCEPTION 'Job is no longer available';END IF;
 SELECT * INTO s FROM public.candidate_hunter_settings WHERE business_id=auth.uid();
 SELECT count(*) INTO sent_today FROM public.candidate_outreach_drafts WHERE business_id=auth.uid() AND sent AND updated_at>=date_trunc('day',now() AT TIME ZONE 'Asia/Dubai') AT TIME ZONE 'Asia/Dubai';
 IF sent_today>=least(coalesce(s.daily_outreach_limit,10),25) THEN RAISE EXCEPTION 'Daily outreach limit reached';END IF;
 INSERT INTO public.notifications(user_id,title,body,link,event_type,dedupe_key) VALUES(d.worker_id,'An employer invites you to apply',d.outreach_message,'/worker/job/'||j.id,'candidate_invitation','outreach:'||d.id) ON CONFLICT(dedupe_key) DO NOTHING;
 UPDATE public.candidate_outreach_drafts SET sent=true WHERE id=d.id;
 UPDATE public.candidate_matches SET status='outreached' WHERE id=d.match_id;
 INSERT INTO public.candidate_hunter_logs(business_id,worker_id,job_id,action,reason) VALUES(auth.uid(),d.worker_id,d.job_id,'outreached','Delivered as an in-app invitation after employer approval');
END $$;
REVOKE ALL ON FUNCTION public.send_candidate_outreach(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.send_candidate_outreach(uuid) TO authenticated;
ALTER TABLE public.ai_agent_settings ADD COLUMN paused boolean NOT NULL DEFAULT false;
ALTER TABLE public.candidate_hunter_settings ADD COLUMN paused boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION taawun_private.has_application(p_job uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.applications WHERE job_id=p_job AND worker_id=auth.uid()) $$;
CREATE OR REPLACE FUNCTION taawun_private.job_has_applications(p_job uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.applications WHERE job_id=p_job) $$;
REVOKE ALL ON FUNCTION taawun_private.has_application(uuid),taawun_private.job_has_applications(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION taawun_private.has_application(uuid),taawun_private.job_has_applications(uuid) TO anon,authenticated;
DROP POLICY job_read ON public.jobs;
CREATE POLICY job_read ON public.jobs FOR SELECT TO anon,authenticated USING((status='open' AND end_time>now() AND (deadline IS NULL OR deadline>now()) AND taawun_private.verified_business(poster_id)) OR poster_id=auth.uid() OR taawun_private.is_admin() OR taawun_private.has_application(id));
DROP POLICY job_delete ON public.jobs;
CREATE POLICY job_delete ON public.jobs FOR DELETE TO authenticated USING(poster_id=auth.uid() AND status='draft' AND NOT taawun_private.job_has_applications(id));
CREATE OR REPLACE FUNCTION taawun_private.cv_experience_years(p_experience jsonb) RETURNS numeric LANGUAGE plpgsql STABLE SET search_path='' AS $$
DECLARE years numeric;
BEGIN
 WITH spans AS(SELECT (e->>'startDate'||'-01')::date AS a,CASE WHEN (e->>'current')::boolean THEN current_date ELSE (e->>'endDate'||'-01')::date END AS b FROM jsonb_array_elements(coalesce(p_experience,'[]')) e WHERE e->>'startDate' ~ '^[0-9]{4}-[0-9]{2}$' AND ((e->>'current')::boolean OR e->>'endDate' ~ '^[0-9]{4}-[0-9]{2}$')),
 merged AS(SELECT range_agg(daterange(a,least(b,current_date),'[)')) AS ranges FROM spans WHERE b>a AND a<current_date)
 SELECT coalesce(sum(upper(r)-lower(r)),0)/365.25 INTO years FROM merged,unnest(ranges) r;
 RETURN years;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END $$;
REVOKE ALL ON FUNCTION taawun_private.cv_experience_years(jsonb) FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.get_public_businesses(p_ids uuid[]) RETURNS TABLE(id uuid,trade_name text,sector text,logo_url text,rating_avg numeric,rating_count integer) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_ids IS NULL OR cardinality(p_ids)>50 THEN RAISE EXCEPTION 'Provide at most 50 employer IDs';END IF;
 RETURN QUERY SELECT b.id,b.trade_name,b.sector,b.logo_url,b.rating_avg,b.rating_count FROM public.businesses b WHERE b.id=ANY(p_ids) AND taawun_private.verified_business(b.id);
END $$;
REVOKE ALL ON FUNCTION public.get_public_businesses(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_businesses(uuid[]) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.get_candidate_summaries(p_ids uuid[]) RETURNS TABLE(user_id uuid,full_name text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT taawun_private.verified_business(auth.uid()) THEN RAISE EXCEPTION 'Verified employer required' USING ERRCODE='42501';END IF;
 IF p_ids IS NULL OR cardinality(p_ids)>50 THEN RAISE EXCEPTION 'Provide at most 50 candidate IDs';END IF;
 RETURN QUERY SELECT p.user_id,p.full_name FROM public.profiles p WHERE p.user_id=ANY(p_ids) AND (taawun_private.can_view_candidate(p.user_id) OR EXISTS(SELECT 1 FROM public.candidate_matches m JOIN public.student_profiles s ON s.user_id=m.worker_id WHERE m.worker_id=p.user_id AND m.business_id=auth.uid() AND s.consent_to_matching AND s.adult_consent_at IS NOT NULL));
END $$;
REVOKE ALL ON FUNCTION public.get_candidate_summaries(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_candidate_summaries(uuid[]) TO authenticated;
-- Edge matching only reads these new inputs; all hiring/notification writes use bounded RPCs.
GRANT SELECT ON public.student_profiles,public.availability_preferences,public.academic_calendar_events,public.calendar_connections TO service_role;
-- Only import/disconnect RPCs and future authorized provider backends may author sync coverage metadata.
REVOKE INSERT,UPDATE,DELETE ON public.calendar_connections FROM authenticated;
