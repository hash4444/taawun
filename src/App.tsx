import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RequireRole } from '@/components/auth/RequireRole';
import { isAdminDomain } from '@/hooks/useAdminDomain';
import { useApp } from '@/hooks/useApp';
import { features } from '@/lib/features';

const Index = lazy(() => import('./pages/Index'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Welcome = lazy(() => import('./pages/onboarding/Welcome'));
const RoleSelection = lazy(() => import('./pages/onboarding/RoleSelection'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const Login = lazy(() => import('./pages/auth/Login'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const VerifyPhone = lazy(() => import('./pages/auth/VerifyPhone'));
const OAuthCallback = lazy(() => import('./pages/auth/OAuthCallback'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const WorkerHome = lazy(() => import('./pages/worker/WorkerHome'));
const WorkerJobs = lazy(() => import('./pages/worker/WorkerJobs'));
const WorkerApplications = lazy(() => import('./pages/worker/WorkerApplications'));
const WorkerProfile = lazy(() => import('./pages/worker/WorkerProfile'));
const WorkerPersonalInfo = lazy(() => import('./pages/worker/WorkerPersonalInfo'));
const WorkerJobDetail = lazy(() => import('./pages/worker/WorkerJobDetail'));
const WorkerVerification = lazy(() => import('./pages/worker/WorkerVerification'));
const WorkerNotifications = lazy(() => import('./pages/worker/WorkerNotifications'));
const SmartAvailability = lazy(() => import('./pages/worker/SmartAvailability'));
const CVCenter = lazy(() => import('./pages/worker/CVCenter'));
const CVBuilder = lazy(() => import('./pages/worker/CVBuilder'));
const CVPreview = lazy(() => import('./pages/worker/CVPreview'));
const CareerAssistant = lazy(() => import('./pages/worker/CareerAssistant'));
const JobHunterDashboard = lazy(() => import('./pages/worker/JobHunterDashboard'));
const BusinessDashboard = lazy(() => import('./pages/business/BusinessDashboard'));
const PostJob = lazy(() => import('./pages/business/PostJob'));
const BusinessProfile = lazy(() => import('./pages/business/BusinessProfile'));
const BusinessInfo = lazy(() => import('./pages/business/BusinessInfo'));
const BusinessVerification = lazy(() => import('./pages/business/BusinessVerification'));
const BusinessWorkers = lazy(() => import('./pages/business/BusinessWorkers'));
const BusinessJobDetail = lazy(() => import('./pages/business/BusinessJobDetail'));
const CandidateHunterDashboard = lazy(() => import('./pages/business/CandidateHunterDashboard'));
const HelpSupport = lazy(() => import('./pages/shared/HelpSupport'));
const Settings = lazy(() => import('./pages/shared/Settings'));
const DeferredModule = lazy(() => import('./pages/shared/DeferredModule'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminVerificationQueue = lazy(() => import('./pages/admin/AdminVerificationQueue'));
const AdminVerificationDetail = lazy(() => import('./pages/admin/AdminVerificationDetail'));
const AdminDisputesQueue = lazy(() => import('./pages/admin/AdminDisputesQueue'));
// Preserved behind an explicit flag. These chunks are never fetched by the default marketplace.
const WorkerWallet = lazy(() => import('./pages/worker/WorkerWallet'));
const WorkerPaymentMethods = lazy(() => import('./pages/worker/WorkerPaymentMethods'));
const WorkerRatings = lazy(() => import('./pages/worker/WorkerRatings'));
const WorkerEvents = lazy(() => import('./pages/worker/WorkerEvents'));
const WorkerCareerIntelligence = lazy(() => import('./pages/worker/WorkerCareerIntelligence'));
const FreelanceMarketplace = lazy(() => import('./pages/worker/FreelanceMarketplace'));
const BusinessWallet = lazy(() => import('./pages/business/BusinessWallet'));
const BusinessPaymentMethods = lazy(() => import('./pages/business/BusinessPaymentMethods'));
const BusinessRatings = lazy(() => import('./pages/business/BusinessRatings'));
const BusinessCareerIntelligence = lazy(() => import('./pages/business/BusinessCareerIntelligence'));
const BusinessAssistant = lazy(() => import('./pages/business/BusinessAssistant'));
const WorkerAttendance = lazy(() => import('./pages/legacy/WorkerAttendance'));
const BusinessAttendance = lazy(() => import('./pages/legacy/BusinessAttendance'));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false } } });
function Deferred({ children }: { children: ReactNode }) { return features.legacyModules ? <>{children}</> : <DeferredModule />; }
function LegacyJobLink() {
  const { slug } = useParams();
  return <Navigate replace to={['full_time','part_time','internship','freelance','shift','digital_service'].includes(slug || '') ? `/worker/explore?type=${slug}` : `/worker/job/${slug}`} />;
}
function Loading() { const { isRTL } = useApp(); return <div className="min-h-screen grid place-items-center" role="status">{isRTL ? 'جاري تحميل تعاون…' : 'Loading Taawun…'}</div>; }
function AppRoutes() {
  return <Suspense fallback={<Loading />}><Routes>
    <Route path="/" element={isAdminDomain() ? <Navigate to="/admin" replace /> : <Index />} />
    <Route path="/onboarding/welcome" element={<Welcome />} />
    <Route path="/onboarding/role" element={<RoleSelection />} />
    <Route path="/auth/signup" element={<Signup />} />
    <Route path="/auth/login" element={isAdminDomain() ? <AdminLogin /> : <Login />} />
    <Route path="/auth/callback" element={<OAuthCallback />} />
    <Route path="/auth/reset-password" element={<ResetPassword />} />
    <Route element={<RequireRole />}>
      <Route path="/auth/verify-phone" element={<VerifyPhone />} />
      <Route path="/help" element={<HelpSupport />} />
      <Route path="/settings" element={<Settings />} />
    </Route>
    <Route element={<RequireRole roles={['worker']} />}>
      <Route path="/worker" element={<Navigate to="/worker/home" replace />} />
      <Route path="/worker/home" element={<WorkerHome />} />
      <Route path="/worker/explore" element={<WorkerJobs />} />
      <Route path="/worker/jobs" element={<Navigate to="/worker/explore" replace />} />
      <Route path="/worker/jobs/:slug" element={<LegacyJobLink />} />
      <Route path="/worker/applications" element={<WorkerApplications />} />
      <Route path="/worker/profile" element={<WorkerProfile />} />
      <Route path="/worker/profile/setup" element={<WorkerPersonalInfo />} />
      <Route path="/worker/profile/personal-information" element={<Navigate to="/worker/profile/setup" replace />} />
      <Route path="/worker/availability" element={<SmartAvailability />} />
      <Route path="/worker/job/:id" element={<WorkerJobDetail />} />
      <Route path="/worker/shift/:id" element={<WorkerJobDetail />} />
      <Route path="/worker/verification" element={<WorkerVerification />} />
      <Route path="/worker/notifications" element={<WorkerNotifications />} />
      <Route path="/worker/cv" element={<CVCenter />} />
      <Route path="/worker/cv/builder" element={<CVBuilder />} />
      <Route path="/worker/cv/preview/:id" element={<CVPreview />} />
      <Route path="/worker/assistant" element={<CareerAssistant />} />
      <Route path="/worker/job-hunter" element={<JobHunterDashboard />} />
      <Route path="/worker/wallet" element={<Deferred><WorkerWallet /></Deferred>} />
      <Route path="/worker/payment-methods" element={<Deferred><WorkerPaymentMethods /></Deferred>} />
      <Route path="/worker/ratings" element={<Deferred><WorkerRatings /></Deferred>} />
      <Route path="/worker/events" element={<Deferred><WorkerEvents /></Deferred>} />
      <Route path="/worker/shifts" element={<Navigate to="/worker/applications" replace />} />
      <Route path="/worker/intelligence" element={<Deferred><WorkerCareerIntelligence /></Deferred>} />
      <Route path="/worker/freelance" element={<Deferred><FreelanceMarketplace /></Deferred>} />
      <Route path="/worker/legacy/attendance/:id" element={<Deferred><WorkerAttendance /></Deferred>} />
    </Route>
    <Route element={<RequireRole roles={['business']} />}>
      <Route path="/business" element={<Navigate to="/business/dashboard" replace />} />
      <Route path="/business/dashboard" element={<BusinessDashboard />} />
      <Route path="/business/post-job" element={<PostJob />} />
      <Route path="/business/post-shift" element={<Navigate to="/business/post-job" replace />} />
      <Route path="/business/profile" element={<BusinessProfile />} />
      <Route path="/business/profile/info" element={<BusinessInfo />} />
      <Route path="/business/verification" element={<BusinessVerification />} />
      <Route path="/business/workers" element={<BusinessWorkers />} />
      <Route path="/business/job/:id" element={<BusinessJobDetail />} />
      <Route path="/business/jobs/:id" element={<BusinessJobDetail />} />
      <Route path="/business/notifications" element={<WorkerNotifications />} />
      <Route path="/business/shift/:id" element={<BusinessJobDetail />} />
      <Route path="/business/candidate-hunter" element={<CandidateHunterDashboard />} />
      <Route path="/business/wallet" element={<Deferred><BusinessWallet /></Deferred>} />
      <Route path="/business/payment-methods" element={<Deferred><BusinessPaymentMethods /></Deferred>} />
      <Route path="/business/ratings" element={<Deferred><BusinessRatings /></Deferred>} />
      <Route path="/business/intelligence" element={<Deferred><BusinessCareerIntelligence /></Deferred>} />
      <Route path="/business/assistant" element={<Deferred><BusinessAssistant /></Deferred>} />
      <Route path="/business/legacy/attendance/:id" element={<Deferred><BusinessAttendance /></Deferred>} />
    </Route>
    <Route element={<RequireRole roles={['admin']} />}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/verifications" element={<AdminVerificationQueue />} />
      <Route path="/admin/verification/:userId" element={<AdminVerificationDetail />} />
      <Route path="/admin/disputes" element={<AdminDisputesQueue />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes></Suspense>;
}
export default function App() {
  return <QueryClientProvider client={queryClient}><AppProvider><AuthProvider><TooltipProvider><Toaster /><Sonner /><BrowserRouter><AppRoutes /></BrowserRouter></TooltipProvider></AuthProvider></AppProvider></QueryClientProvider>;
}
