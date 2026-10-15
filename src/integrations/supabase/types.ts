export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      student_profiles: {
        Row: {
          user_id: string
          university: string | null
          degree: string | null
          graduation_year: number | null
          academic_status: string | null
          city: string | null
          skills: string[]
          preferred_job_types: string[]
          preferred_hours: string | null
          work_eligibility: string | null
          eligibility_confirmed: boolean
          adult_consent_at: string | null
          consent_to_matching: boolean
          onboarding_completed_at: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          university?: string | null
          degree?: string | null
          graduation_year?: number | null
          academic_status?: string | null
          city?: string | null
          skills?: string[]
          preferred_job_types?: string[]
          preferred_hours?: string | null
          work_eligibility?: string | null
          eligibility_confirmed?: boolean
          adult_consent_at?: string | null
          consent_to_matching?: boolean
          onboarding_completed_at?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          university?: string | null
          degree?: string | null
          graduation_year?: number | null
          academic_status?: string | null
          city?: string | null
          skills?: string[]
          preferred_job_types?: string[]
          preferred_hours?: string | null
          work_eligibility?: string | null
          eligibility_confirmed?: boolean
          adult_consent_at?: string | null
          consent_to_matching?: boolean
          onboarding_completed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      availability_preferences: {
        Row: {
          user_id: string
          timezone: string
          weekly_windows: Json
          minimum_shift_minutes: number
          travel_buffer_minutes: number
          share_with_employers: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          timezone?: string
          weekly_windows?: Json
          minimum_shift_minutes?: number
          travel_buffer_minutes?: number
          share_with_employers?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          timezone?: string
          weekly_windows?: Json
          minimum_shift_minutes?: number
          travel_buffer_minutes?: number
          share_with_employers?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      academic_calendar_events: {
        Row: {
          id: string
          user_id: string
          source: string
          external_uid: string
          start_at: string
          end_at: string
          busy: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          source: string
          external_uid: string
          start_at: string
          end_at: string
          busy?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          source?: string
          external_uid?: string
          start_at?: string
          end_at?: string
          busy?: boolean
          created_at?: string
        }
        Relationships: []
      }
      calendar_connections: {
        Row: {
          id: string
          user_id: string
          provider: string
          status: string
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          status?: string
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          status?: string
          last_synced_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          title_ar: string | null
          body: string
          body_ar: string | null
          link: string | null
          event_type: string
          data: Json
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          title_ar?: string | null
          body: string
          body_ar?: string | null
          link?: string | null
          event_type?: string
          data?: Json
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          title_ar?: string | null
          body?: string
          body_ar?: string | null
          link?: string | null
          event_type?: string
          data?: Json
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      application_audit_logs: {
        Row: {
          id: string
          application_id: string
          actor_id: string
          previous_status: string | null
          new_status: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          actor_id: string
          previous_status?: string | null
          new_status: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          actor_id?: string
          previous_status?: string | null
          new_status?: string
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          notes: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          notes?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      ai_agent_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          job_id: string | null
          metadata: Json | null
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_agent_settings: {
        Row: {
          paused: boolean
          mode: string
          auto_apply_consented_at: string | null
          auto_apply_enabled: boolean
          created_at: string
          daily_application_limit: number
          excluded_companies: string[]
          excluded_keywords: string[]
          id: string
          last_run_at: string | null
          minimum_match_score: number
          require_user_approval: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          paused?: boolean
          mode?: string
          auto_apply_consented_at?: string | null
          auto_apply_enabled?: boolean
          created_at?: string
          daily_application_limit?: number
          excluded_companies?: string[]
          excluded_keywords?: string[]
          id?: string
          last_run_at?: string | null
          minimum_match_score?: number
          require_user_approval?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          paused?: boolean
          mode?: string
          auto_apply_consented_at?: string | null
          auto_apply_enabled?: boolean
          created_at?: string
          daily_application_limit?: number
          excluded_companies?: string[]
          excluded_keywords?: string[]
          id?: string
          last_run_at?: string | null
          minimum_match_score?: number
          require_user_approval?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_application_drafts: {
        Row: {
          cover_letter: string
          created_at: string
          id: string
          job_id: string
          match_id: string | null
          notes: string | null
          submitted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_letter: string
          created_at?: string
          id?: string
          job_id: string
          match_id?: string | null
          notes?: string | null
          submitted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_letter?: string
          created_at?: string
          id?: string
          job_id?: string
          match_id?: string | null
          notes?: string | null
          submitted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_application_drafts_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "ai_job_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_job_matches: {
        Row: {
          created_at: string
          explanation: string | null
          gaps: string[]
          id: string
          job_id: string
          score: number
          status: Database["public"]["Enums"]["ai_match_status"]
          strengths: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          gaps?: string[]
          id?: string
          job_id: string
          score: number
          status?: Database["public"]["Enums"]["ai_match_status"]
          strengths?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          gaps?: string[]
          id?: string
          job_id?: string
          score?: number
          status?: Database["public"]["Enums"]["ai_match_status"]
          strengths?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          interview_at: string | null
          employer_message: string | null
          decision_at: string | null
          cover_letter: string | null
          cover_letter_ai: boolean
          created_at: string
          id: string
          is_auto_applied: boolean
          job_id: string
          match_score: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          interview_at?: string | null
          employer_message?: string | null
          decision_at?: string | null
          cover_letter?: string | null
          cover_letter_ai?: boolean
          created_at?: string
          id?: string
          is_auto_applied?: boolean
          job_id: string
          match_score?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          interview_at?: string | null
          employer_message?: string | null
          decision_at?: string | null
          cover_letter?: string | null
          cover_letter_ai?: boolean
          created_at?: string
          id?: string
          is_auto_applied?: boolean
          job_id?: string
          match_score?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          approved_at: string | null
          approved_by_business: boolean | null
          business_id: string
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          id: string
          job_id: string
          method: Database["public"]["Enums"]["attendance_method"] | null
          worker_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_business?: boolean | null
          business_id: string
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          id?: string
          job_id: string
          method?: Database["public"]["Enums"]["attendance_method"] | null
          worker_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by_business?: boolean | null
          business_id?: string
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          id?: string
          job_id?: string
          method?: Database["public"]["Enums"]["attendance_method"] | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_holder_name: string
          bank_name: string
          created_at: string
          iban: string
          id: string
          is_default: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          bank_name: string
          created_at?: string
          iban: string
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          bank_name?: string
          created_at?: string
          iban?: string
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          verification_reviewed_at: string | null
          verification_reviewed_by: string | null
          created_at: string
          id: string
          legal_name: string | null
          logo_url: string | null
          rating_avg: number | null
          rating_count: number | null
          sector: string | null
          size: string | null
          trade_name: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          created_at?: string
          id: string
          legal_name?: string | null
          logo_url?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          sector?: string | null
          size?: string | null
          trade_name?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          sector?: string | null
          size?: string | null
          trade_name?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
      candidate_hunter_logs: {
        Row: {
          action: string
          business_id: string
          created_at: string
          id: string
          job_id: string | null
          metadata: Json | null
          reason: string | null
          worker_id: string | null
        }
        Insert: {
          action: string
          business_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          reason?: string | null
          worker_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          reason?: string | null
          worker_id?: string | null
        }
        Relationships: []
      }
      candidate_hunter_settings: {
        Row: {
          paused: boolean
          business_id: string
          created_at: string
          daily_outreach_limit: number
          excluded_keywords: string[]
          id: string
          last_run_at: string | null
          locations: string[]
          minimum_match_score: number
          mode: string
          target_roles: string[]
          updated_at: string
        }
        Insert: {
          paused?: boolean
          business_id: string
          created_at?: string
          daily_outreach_limit?: number
          excluded_keywords?: string[]
          id?: string
          last_run_at?: string | null
          locations?: string[]
          minimum_match_score?: number
          mode?: string
          target_roles?: string[]
          updated_at?: string
        }
        Update: {
          paused?: boolean
          business_id?: string
          created_at?: string
          daily_outreach_limit?: number
          excluded_keywords?: string[]
          id?: string
          last_run_at?: string | null
          locations?: string[]
          minimum_match_score?: number
          mode?: string
          target_roles?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      candidate_matches: {
        Row: {
          business_id: string
          created_at: string
          explanation: string | null
          gaps: string[]
          id: string
          job_id: string
          score: number
          status: Database["public"]["Enums"]["candidate_match_status"]
          strengths: string[]
          updated_at: string
          worker_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          explanation?: string | null
          gaps?: string[]
          id?: string
          job_id: string
          score: number
          status?: Database["public"]["Enums"]["candidate_match_status"]
          strengths?: string[]
          updated_at?: string
          worker_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          explanation?: string | null
          gaps?: string[]
          id?: string
          job_id?: string
          score?: number
          status?: Database["public"]["Enums"]["candidate_match_status"]
          strengths?: string[]
          updated_at?: string
          worker_id?: string
        }
        Relationships: []
      }
      candidate_outreach_drafts: {
        Row: {
          business_id: string
          created_at: string
          id: string
          job_id: string
          match_id: string | null
          notes: string | null
          outreach_message: string
          sent: boolean
          updated_at: string
          worker_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          job_id: string
          match_id?: string | null
          notes?: string | null
          outreach_message: string
          sent?: boolean
          updated_at?: string
          worker_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          job_id?: string
          match_id?: string | null
          notes?: string | null
          outreach_message?: string
          sent?: boolean
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_outreach_drafts_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "candidate_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          messages: Json | null
          metadata: Json | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          messages?: Json | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          messages?: Json | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cv_records: {
        Row: {
          created_at: string
          education: Json | null
          experience: Json | null
          file_url: string | null
          id: string
          is_ai_generated: boolean | null
          languages: Json | null
          personal_info: Json | null
          skills: string[] | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education?: Json | null
          experience?: Json | null
          file_url?: string | null
          id?: string
          is_ai_generated?: boolean | null
          languages?: Json | null
          personal_info?: Json | null
          skills?: string[] | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          education?: Json | null
          experience?: Json | null
          file_url?: string | null
          id?: string
          is_ai_generated?: boolean | null
          languages?: Json | null
          personal_info?: Json | null
          skills?: string[] | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          opened_by: string
          opened_by_role: Database["public"]["Enums"]["app_role"]
          reason: string
          resolution_notes: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          opened_by: string
          opened_by_role: Database["public"]["Enums"]["app_role"]
          reason: string
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          opened_by?: string
          opened_by_role?: Database["public"]["Enums"]["app_role"]
          reason?: string
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_preferences: {
        Row: {
          availability: string | null
          career_goal: string | null
          created_at: string
          id: string
          industries: string[]
          job_types: string[]
          languages: string[]
          locations: string[]
          salary_currency: string | null
          salary_min: number | null
          skills: string[]
          updated_at: string
          user_id: string
          work_modes: string[]
        }
        Insert: {
          availability?: string | null
          career_goal?: string | null
          created_at?: string
          id?: string
          industries?: string[]
          job_types?: string[]
          languages?: string[]
          locations?: string[]
          salary_currency?: string | null
          salary_min?: number | null
          skills?: string[]
          updated_at?: string
          user_id: string
          work_modes?: string[]
        }
        Update: {
          availability?: string | null
          career_goal?: string | null
          created_at?: string
          id?: string
          industries?: string[]
          job_types?: string[]
          languages?: string[]
          locations?: string[]
          salary_currency?: string | null
          salary_min?: number | null
          skills?: string[]
          updated_at?: string
          user_id?: string
          work_modes?: string[]
        }
        Relationships: []
      }
      jobs: {
        Row: {
          schedule_kind: string
          country: string
          student_friendly: boolean
          eligibility_requirements: string | null
          address: string | null
          business_id: string | null
          category: string | null
          company_logo: string | null
          company_name: string | null
          created_at: string
          currency: string | null
          deadline: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          end_time: string
          experience_years: number | null
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          location: string | null
          pay_amount: number | null
          payment_model: Database["public"]["Enums"]["payment_model"] | null
          poster_id: string
          poster_role: Database["public"]["Enums"]["app_role"]
          remote_allowed: boolean | null
          salary_max: number | null
          salary_min: number | null
          sector: string | null
          service_direction:
            | Database["public"]["Enums"]["service_direction"]
            | null
          skills_required: string[] | null
          slots_filled: number | null
          slots_total: number | null
          start_time: string | null
          status: Database["public"]["Enums"]["job_status"]
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          schedule_kind?: string
          country?: string
          student_friendly?: boolean
          eligibility_requirements?: string | null
          address?: string | null
          business_id?: string | null
          category?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          end_time: string
          experience_years?: number | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string | null
          pay_amount?: number | null
          payment_model?: Database["public"]["Enums"]["payment_model"] | null
          poster_id: string
          poster_role?: Database["public"]["Enums"]["app_role"]
          remote_allowed?: boolean | null
          salary_max?: number | null
          salary_min?: number | null
          sector?: string | null
          service_direction?:
            | Database["public"]["Enums"]["service_direction"]
            | null
          skills_required?: string[] | null
          slots_filled?: number | null
          slots_total?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          schedule_kind?: string
          country?: string
          student_friendly?: boolean
          eligibility_requirements?: string | null
          address?: string | null
          business_id?: string | null
          category?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          deadline?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          end_time?: string
          experience_years?: number | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string | null
          pay_amount?: number | null
          payment_model?: Database["public"]["Enums"]["payment_model"] | null
          poster_id?: string
          poster_role?: Database["public"]["Enums"]["app_role"]
          remote_allowed?: boolean | null
          salary_max?: number | null
          salary_min?: number | null
          sector?: string | null
          service_direction?:
            | Database["public"]["Enums"]["service_direction"]
            | null
          skills_required?: string[] | null
          slots_filled?: number | null
          slots_total?: number | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id: string
          owner_id: string
          owner_role: Database["public"]["Enums"]["app_role"]
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["doc_status"]
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          id?: string
          owner_id: string
          owner_role: Database["public"]["Enums"]["app_role"]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          id?: string
          owner_id?: string
          owner_role?: Database["public"]["Enums"]["app_role"]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_initialized: boolean
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_initialized?: boolean
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_initialized?: boolean
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          from_role: Database["public"]["Enums"]["app_role"]
          from_user_id: string
          id: string
          job_id: string
          rating: number
          to_user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          from_role: Database["public"]["Enums"]["app_role"]
          from_user_id: string
          id?: string
          job_id: string
          rating: number
          to_user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          from_role?: Database["public"]["Enums"]["app_role"]
          from_user_id?: string
          id?: string
          job_id?: string
          rating?: number
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string
          description: string | null
          id: string
          job_id: string | null
          status: Database["public"]["Enums"]["wallet_entry_status"]
          type: Database["public"]["Enums"]["wallet_entry_type"]
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          amount?: number
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          status?: Database["public"]["Enums"]["wallet_entry_status"]
          type: Database["public"]["Enums"]["wallet_entry_type"]
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_id?: string | null
          status?: Database["public"]["Enums"]["wallet_entry_status"]
          type?: Database["public"]["Enums"]["wallet_entry_type"]
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          verification_reviewed_at: string | null
          verification_reviewed_by: string | null
          availability: string | null
          bio: string | null
          created_at: string
          id: string
          skills: string[] | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          availability?: string | null
          bio?: string | null
          created_at?: string
          id: string
          skills?: string[] | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          availability?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          skills?: string[] | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_candidate_summaries: { Args: { p_ids: string[] }; Returns: { user_id: string; full_name: string | null }[] }
      get_public_businesses: { Args: { p_ids: string[] }; Returns: { id: string; trade_name: string | null; sector: string | null; logo_url: string | null; rating_avg: number | null; rating_count: number | null }[] }
      consume_ai_budget_for_user: { Args: { p_user_id: string; p_feature: string }; Returns: boolean }
      send_candidate_outreach: { Args: { p_draft_id: string }; Returns: undefined }
      complete_account_setup: { Args: { account_role: string; full_name?: string; phone?: string }; Returns: undefined }
      request_verification: { Args: Record<string, never>; Returns: undefined }
      review_verification_document: { Args: { p_document_id: string; p_status: string; p_reason?: string }; Returns: undefined }
      review_verification: { Args: { p_user_id: string; p_role: string; p_status: string; p_notes?: string }; Returns: undefined }
      submit_application: { Args: { p_job_id: string; p_cover_letter?: string; p_ai_draft_id?: string }; Returns: string }
      update_application_status: { Args: { p_application_id: string; p_status: string; p_interview_at?: string; p_message?: string }; Returns: Database["public"]["Tables"]["applications"]["Row"] }
      consume_ai_budget: { Args: { p_feature: string }; Returns: boolean }
      disconnect_calendar: { Args: { p_provider: string }; Returns: undefined }
      replace_calendar_import: { Args: { p_events: Json }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_match_status:
        | "matched"
        | "drafted"
        | "auto_applied"
        | "submitted"
        | "needs_review"
        | "skipped"
        | "rejected"
      app_role: "worker" | "business" | "admin"
      application_status:
        | "applied"
        | "shortlisted"
        | "accepted"
        | "rejected"
        | "cancelled"
        | "completed"
        | "interview"
        | "offered"
        | "placed"
      attendance_method: "qr" | "gps" | "manual"
      candidate_match_status:
        | "matched"
        | "drafted"
        | "outreached"
        | "needs_review"
        | "skipped"
        | "rejected"
      dispute_status: "open" | "review" | "resolved" | "rejected"
      doc_status: "submitted" | "approved" | "rejected"
      doc_type:
        | "id_front"
        | "id_back"
        | "selfie"
        | "commercial_reg"
        | "license"
        | "rep_id"
      employment_type: "permanent" | "temporary" | "contract"
      job_status:
        | "draft"
        | "open"
        | "in_progress"
        | "completed"
        | "interview"
        | "offered"
        | "placed"
        | "closed"
        | "cancelled"
      job_type:
        | "shift"
        | "full_time"
        | "part_time"
        | "freelance"
        | "digital_service"
        | "internship"
      payment_model: "hourly" | "fixed" | "monthly" | "milestone"
      service_direction: "business_offers" | "worker_offers"
      wallet_entry_status: "pending" | "approved" | "paid" | "rejected"
      wallet_entry_type: "earning" | "payout" | "bonus" | "deduction"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_match_status: [
        "matched",
        "drafted",
        "auto_applied",
        "submitted",
        "needs_review",
        "skipped",
        "rejected",
      ],
      app_role: ["worker", "business", "admin"],
      application_status: [
        "interview",
        "offered",
        "placed",
        "applied",
        "shortlisted",
        "accepted",
        "rejected",
        "cancelled",
        "completed",
      ],
      attendance_method: ["qr", "gps", "manual"],
      candidate_match_status: [
        "matched",
        "drafted",
        "outreached",
        "needs_review",
        "skipped",
        "rejected",
      ],
      dispute_status: ["open", "review", "resolved", "rejected"],
      doc_status: ["submitted", "approved", "rejected"],
      doc_type: [
        "id_front",
        "id_back",
        "selfie",
        "commercial_reg",
        "license",
        "rep_id",
      ],
      employment_type: ["permanent", "temporary", "contract"],
      job_status: [
        "draft",
        "open",
        "in_progress",
        "completed",
        "closed",
        "cancelled",
      ],
      job_type: [
        "shift",
        "full_time",
        "part_time",
        "freelance",
        "digital_service",
        "internship",
      ],
      payment_model: ["hourly", "fixed", "monthly", "milestone"],
      service_direction: ["business_offers", "worker_offers"],
      wallet_entry_status: ["pending", "approved", "paid", "rejected"],
      wallet_entry_type: ["earning", "payout", "bonus", "deduction"],
    },
  },
} as const
