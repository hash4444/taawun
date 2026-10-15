import { createContext } from 'react';
import type { AppRole, VerificationStatus } from '@/lib/auth';
import type { Database } from '@/integrations/supabase/types';

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  full_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  role?: AppRole;
  avatarUrl?: string;
  account_initialized?: boolean;
}

export interface StudentProfile {
  user_id: string;
  university: string | null;
  degree: string | null;
  graduation_year: number | null;
  academic_status: string | null;
  city: string | null;
  skills: string[];
  preferred_job_types: string[];
  preferred_hours: string | null;
  work_eligibility: string | null;
  eligibility_confirmed: boolean;
  consent_to_matching: boolean;
  adult_consent_at: string | null;
  onboarding_completed_at: string | null;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  role: AppRole | null;
  profile?: Profile;
  needsOnboarding?: boolean;
}

export interface RegistrationResult { requiresEmailConfirmation: boolean }

export interface AuthContextType {
  user: User | null;
  profile: Profile | undefined;
  studentData: StudentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isAdmin: boolean;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  businessData: Database['public']['Tables']['businesses']['Row'] | null;
  workerData: Database['public']['Tables']['workers']['Row'] | null;
  oauthProviders: { google: boolean; microsoft: boolean };
  login: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string, phone?: string, fullName?: string) => Promise<RegistrationResult>;
  signInWithGoogle: (role?: string) => Promise<void>;
  signInWithMicrosoft: (role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
