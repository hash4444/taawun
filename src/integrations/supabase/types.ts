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
          availability: string | null
          bio: string | null
          created_at: string
          id: string
          skills: string[] | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          created_at?: string
          id: string
          skills?: string[] | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
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
        "needs_review",
        "skipped",
        "rejected",
      ],
      app_role: ["worker", "business", "admin"],
      application_status: [
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
