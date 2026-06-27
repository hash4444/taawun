import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { isAdminDomain } from "@/hooks/useAdminDomain";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Onboarding
import Welcome from "./pages/onboarding/Welcome";
import RoleSelection from "./pages/onboarding/RoleSelection";

// Auth
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import VerifyPhone from "./pages/auth/VerifyPhone";
import OAuthCallback from "./pages/auth/OAuthCallback";

// Worker
import WorkerHome from "./pages/worker/WorkerHome";
import WorkerJobs from "./pages/worker/WorkerJobs";
import WorkerNotifications from "./pages/worker/WorkerNotifications";
import WorkerProfile from "./pages/worker/WorkerProfile";
import WorkerVerification from "./pages/worker/WorkerVerification";
import WorkerPersonalInfo from "./pages/worker/WorkerPersonalInfo";
import WorkerPaymentMethods from "./pages/worker/WorkerPaymentMethods";
import WorkerJobDetail from "./pages/worker/WorkerJobDetail";
import JobDetails from "./pages/worker/JobDetails";
import CategoryJobs from "./pages/worker/CategoryJobs";
import FreelanceMarketplace from "./pages/worker/FreelanceMarketplace";
import WorkerEvents from "./pages/worker/WorkerEvents";
import CVCenter from "./pages/worker/CVCenter";
import CVBuilder from "./pages/worker/CVBuilder";
import CVPreview from "./pages/worker/CVPreview";
import CareerAssistant from "./pages/worker/CareerAssistant";
import JobHunterDashboard from "./pages/worker/JobHunterDashboard";
import WorkerWallet from "./pages/worker/WorkerWallet";
import WorkerCareerIntelligence from "./pages/worker/WorkerCareerIntelligence";

// Shared
import HelpSupport from "./pages/shared/HelpSupport";
import Settings from "./pages/shared/Settings";

// Business
import BusinessDashboard from "./pages/business/BusinessDashboard";
import PostJob from "./pages/business/PostJob";
import BusinessCareerIntelligence from "./pages/business/BusinessCareerIntelligence";
import BusinessProfile from "./pages/business/BusinessProfile";
import BusinessInfo from "./pages/business/BusinessInfo";
import BusinessVerification from "./pages/business/BusinessVerification";
import BusinessWorkers from "./pages/business/BusinessWorkers";
import BusinessRatings from "./pages/business/BusinessRatings";
import BusinessPaymentMethods from "./pages/business/BusinessPaymentMethods";
import BusinessJobDetail from "./pages/business/BusinessJobDetail";
import BusinessWallet from "./pages/business/BusinessWallet";
import BusinessAssistant from "./pages/business/BusinessAssistant";
import CandidateHunterDashboard from "./pages/business/CandidateHunterDashboard";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVerificationQueue from "./pages/admin/AdminVerificationQueue";
import AdminVerificationDetail from "./pages/admin/AdminVerificationDetail";
import AdminDisputesQueue from "./pages/admin/AdminDisputesQueue";
import AdminLogin from "./pages/auth/AdminLogin";
import AdminRedirect from "./pages/admin/AdminRedirect";

const queryClient = new QueryClient();
const onAdminDomain = isAdminDomain();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/onboarding/welcome" element={<Welcome />} />
    <Route path="/onboarding/role" element={<RoleSelection />} />
    <Route path="/auth/signup" element={<Signup />} />
    <Route path="/auth/login" element={<Login />} />
    <Route path="/auth/callback" element={<OAuthCallback />} />
    <Route path="/auth/verify-phone" element={<VerifyPhone />} />
    <Route path="/worker/home" element={<WorkerHome />} />
    <Route path="/worker/jobs" element={<WorkerJobs />} />
    <Route path="/worker/events" element={<WorkerEvents />} />
    <Route path="/worker/shifts" element={<Navigate to="/worker/events" replace />} />
    <Route path="/worker/wallet" element={<WorkerWallet />} />
    <Route path="/worker/intelligence" element={<WorkerCareerIntelligence />} />
    <Route path="/worker/notifications" element={<WorkerNotifications />} />
    <Route path="/worker/profile" element={<WorkerProfile />} />
    <Route path="/worker/profile/personal-information" element={<WorkerPersonalInfo />} />
    <Route path="/worker/verification" element={<WorkerVerification />} />
    <Route path="/worker/payment-methods" element={<WorkerPaymentMethods />} />
    <Route path="/worker/job/:id" element={<WorkerJobDetail />} />
    <Route path="/worker/jobs/:jobId" element={<JobDetails />} />
    <Route path="/worker/shift/:id" element={<WorkerJobDetail />} />
    <Route path="/worker/assistant" element={<CareerAssistant />} />
    <Route path="/worker/jobs/:category" element={<CategoryJobs />} />
    <Route path="/worker/freelance" element={<FreelanceMarketplace />} />
    <Route path="/worker/cv" element={<CVCenter />} />
    <Route path="/worker/cv/builder" element={<CVBuilder />} />
    <Route path="/worker/cv/preview/:id" element={<CVPreview />} />
    <Route path="/worker/job-hunter" element={<JobHunterDashboard />} />
    <Route path="/help" element={<HelpSupport />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/business/dashboard" element={<BusinessDashboard />} />
    <Route path="/business/post-job" element={<PostJob />} />
    <Route path="/business/post-shift" element={<PostJob />} />
    <Route path="/business/wallet" element={<BusinessWallet />} />
    <Route path="/business/intelligence" element={<BusinessCareerIntelligence />} />
    <Route path="/business/profile" element={<BusinessProfile />} />
    <Route path="/business/profile/info" element={<BusinessInfo />} />
    <Route path="/business/verification" element={<BusinessVerification />} />
    <Route path="/business/workers" element={<BusinessWorkers />} />
    <Route path="/business/ratings" element={<BusinessRatings />} />
    <Route path="/business/payment-methods" element={<BusinessPaymentMethods />} />
    <Route path="/business/job/:id" element={<BusinessJobDetail />} />
    <Route path="/business/shift/:id" element={<BusinessJobDetail />} />
    <Route path="/business/assistant" element={<BusinessAssistant />} />
    <Route path="/business/candidate-hunter" element={<CandidateHunterDashboard />} />
    <Route path="/admin/*" element={<AdminRedirect />} />
    <Route path="/worker" element={<Navigate to="/worker/home" replace />} />
    <Route path="/business" element={<Navigate to="/business/dashboard" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const AdminRoutes = () => (
  <Routes>
    <Route path="/" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/admin/verifications" element={<AdminRoute><AdminVerificationQueue /></AdminRoute>} />
    <Route path="/admin/verification/:userId" element={<AdminRoute><AdminVerificationDetail /></AdminRoute>} />
    <Route path="/admin/disputes" element={<AdminRoute><AdminDisputesQueue /></AdminRoute>} />
    <Route path="/auth/login" element={<AdminLogin />} />
    <Route path="/auth/callback" element={<OAuthCallback />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// Business/worker routes get a desktop-native shell and are unconstrained at
// all widths so that shell has room to render. The onboarding/auth entry flow
// (Welcome, Role Selection, Login, Signup) gets its own desktop split-layout
// via OnboardingDesktopFrame, used inside each of those pages — so they too
// must render unconstrained rather than trapped in the phone frame. Every
// other route (verify-phone, oauth callback, admin-redirect) stays inside the
// mobile phone frame at all viewport widths, unchanged.
const DESKTOP_SHELLED_ONBOARDING_PATHS = ['/onboarding/welcome', '/onboarding/role', '/auth/login', '/auth/signup'];

const AppFrame = () => {
  const location = useLocation();
  const isDesktopShelledRoute =
    location.pathname.startsWith('/business') ||
    location.pathname.startsWith('/worker') ||
    DESKTOP_SHELLED_ONBOARDING_PATHS.includes(location.pathname);

  if (isDesktopShelledRoute) {
    return <AppRoutes />;
  }

  return (
    <div className="min-h-screen w-full bg-muted dark:bg-background flex justify-center">
      <div className="relative w-full max-w-[480px] h-screen overflow-y-auto bg-background shadow-2xl [transform:translateZ(0)]">
        <AppRoutes />
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {onAdminDomain ? <AdminRoutes /> : <AppFrame />}
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
