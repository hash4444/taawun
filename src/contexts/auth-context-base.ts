import { createContext } from 'react';

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  profile?: Profile;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  verificationStatus: 'verified' | 'pending' | 'pending_review' | 'rejected' | 'not_started';
  businessData: Record<string, unknown> | null;
  workerData: Record<string, unknown> | null;
  login: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string, phone?: string) => Promise<void>;
  signInWithGoogle: (role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSessionFromToken: (token: string) => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
