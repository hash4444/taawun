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
    PostgrestVersion: "14.1"
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
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_allowlist: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_allowlist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string
          created_at: string
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_shift_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
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
            foreignKeyName: "attendance_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_shift_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
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
          is_default: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          bank_name: string
          created_at?: string
          iban: string
          id?: string
          is_default?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          bank_name?: string
          created_at?: string
          iban?: string
          id?: string
          is_default?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_locations: {
        Row: {
          address: string
          business_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          lat: number | null
          lng: number | null
        }
        Insert: {
          address: string
          business_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          lat?: number | null
          lng?: number | null
        }
        Update: {
          address?: string
          business_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          lat?: number | null
          lng?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          legal_name: string | null
          rating_avg: number | null
          rating_count: number | null
          rep_name: string | null
          rep_phone: string | null
          rep_title: string | null
          sector: string | null
          trade_name: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          id: string
          legal_name?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          rep_name?: string | null
          rep_phone?: string | null
          rep_title?: string | null
          sector?: string | null
          trade_name?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          id?: string
          legal_name?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          rep_name?: string | null
          rep_phone?: string | null
          rep_title?: string | null
          sector?: string | null
          trade_name?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "businesses_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          messages: Json
          metadata: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          messages?: Json
          metadata?: Json | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          messages?: Json
          metadata?: Json | null
          title?: string
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
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_shift_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string | null
          business_id: string | null
          created_at: string
          currency: string | null
          deadline: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          end_time: string
          experience_years: number | null
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          lat: number | null
          lng: number | null
          milestones: Json | null
          pay_amount: number
          payment_model: Database["public"]["Enums"]["payment_model"]
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
          slots_total: number
          start_time: string
          status: Database["public"]["Enums"]["shift_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id?: string | null
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
          lat?: number | null
          lng?: number | null
          milestones?: Json | null
          pay_amount: number
          payment_model?: Database["public"]["Enums"]["payment_model"]
          poster_id: string
          poster_role: Database["public"]["Enums"]["app_role"]
          remote_allowed?: boolean | null
          salary_max?: number | null
          salary_min?: number | null
          sector?: string | null
          service_direction?:
            | Database["public"]["Enums"]["service_direction"]
            | null
          skills_required?: string[] | null
          slots_filled?: number | null
          slots_total?: number
          start_time: string
          status?: Database["public"]["Enums"]["shift_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string | null
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
          lat?: number | null
          lng?: number | null
          milestones?: Json | null
          pay_amount?: number
          payment_model?: Database["public"]["Enums"]["payment_model"]
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
          slots_total?: number
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_business_id_fkey"
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
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          from_role: string
          from_user_id: string
          id: string
          job_id: string
          rating: number
          to_user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          from_role: string
          from_user_id: string
          id?: string
          job_id: string
          rating: number
          to_user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          from_role?: string
          from_user_id?: string
          id?: string
          job_id?: string
          rating?: number
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_shift_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
          id: string
          job_id: string | null
          notes: string | null
          status: Database["public"]["Enums"]["ledger_status"]
          type: Database["public"]["Enums"]["ledger_type"]
          worker_id: string | null
        }
        Insert: {
          amount: number
          business_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["ledger_status"]
          type: Database["public"]["Enums"]["ledger_type"]
          worker_id?: string | null
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["ledger_status"]
          type?: Database["public"]["Enums"]["ledger_type"]
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_ledger_shift_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_ledger_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          area: string | null
          cancel_count: number | null
          city: string | null
          created_at: string
          dob: string | null
          id: string
          no_show_count: number | null
          rating_avg: number | null
          rating_count: number | null
          skills: string[] | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          area?: string | null
          cancel_count?: number | null
          city?: string | null
          created_at?: string
          dob?: string | null
          id: string
          no_show_count?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          skills?: string[] | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          area?: string | null
          cancel_count?: number | null
          city?: string | null
          created_at?: string
          dob?: string | null
          id?: string
          no_show_count?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          skills?: string[] | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "workers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_role: { Args: { _email: string }; Returns: string }
      get_application_business_id: {
        Args: { _application_id: string }
        Returns: string
      }
      get_job_poster_id: { Args: { _job_id: string }; Returns: string }
      get_shift_business_id: { Args: { _shift_id: string }; Returns: string }
      is_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_admin_allowlisted: { Args: { _email: string }; Returns: boolean }
      is_job_open: { Args: { _job_id: string }; Returns: boolean }
      is_shift_open: { Args: { _shift_id: string }; Returns: boolean }
      is_verified_business: { Args: { _user_id: string }; Returns: boolean }
      is_verified_worker: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "worker" | "business" | "admin"
      application_status:
        | "applied"
        | "accepted"
        | "rejected"
        | "cancelled"
        | "no_show"
        | "completed"
      attendance_method: "qr" | "manual"
      dispute_status: "open" | "review" | "resolved" | "rejected"
      doc_status: "submitted" | "approved" | "rejected"
      doc_type:
        | "id_front"
        | "id_back"
        | "selfie"
        | "commercial_reg"
        | "license"
        | "rep_id"
      employment_type: "contract" | "permanent" | "temporary"
      job_type:
        | "shift"
        | "full_time"
        | "part_time"
        | "freelance"
        | "digital_service"
        | "internship"
      ledger_status: "pending" | "approved" | "paid" | "rejected"
      ledger_type: "earning" | "adjustment" | "payout"
      pay_type: "hourly" | "fixed"
      payment_model: "hourly" | "fixed" | "monthly" | "milestone"
      service_direction: "business_offers" | "worker_offers"
      shift_status:
        | "draft"
        | "open"
        | "filled"
        | "in_progress"
        | "completed"
        | "cancelled"
      verification_status:
        | "not_started"
        | "pending_review"
        | "verified"
        | "rejected"
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
      app_role: ["worker", "business", "admin"],
      application_status: [
        "applied",
        "accepted",
        "rejected",
        "cancelled",
        "no_show",
        "completed",
      ],
      attendance_method: ["qr", "manual"],
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
      employment_type: ["contract", "permanent", "temporary"],
      job_type: [
        "shift",
        "full_time",
        "part_time",
        "freelance",
        "digital_service",
        "internship",
      ],
      ledger_status: ["pending", "approved", "paid", "rejected"],
      ledger_type: ["earning", "adjustment", "payout"],
      pay_type: ["hourly", "fixed"],
      payment_model: ["hourly", "fixed", "monthly", "milestone"],
      service_direction: ["business_offers", "worker_offers"],
      shift_status: [
        "draft",
        "open",
        "filled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      verification_status: [
        "not_started",
        "pending_review",
        "verified",
        "rejected",
      ],
    },
  },
} as const
