import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import MobileNav from './components/MobileNav.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import BackToTop from './components/ui/BackToTop.jsx';
import { Breadcrumb } from './components/ui/Breadcrumb.jsx';
import { DashboardSkeleton, TableSkeleton } from './components/ui/SkeletonLoader.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

// ── Code-split every page with React.lazy ──────────────────────────────────
const Login          = lazy(() => import('./pages/Login.jsx'));
const Register       = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const Dashboard      = lazy(() => import('./pages/Dashboard.jsx'));
const Plans          = lazy(() => import('./pages/Plans.jsx'));
const Policies       = lazy(() => import('./pages/Policies.jsx'));
const Claims         = lazy(() => import('./pages/Claims.jsx'));
const Notifications  = lazy(() => import('./pages/Notifications.jsx'));
const Settings       = lazy(() => import('./pages/Settings.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const WeatherMonitor = lazy(() => import('./pages/WeatherMonitor.jsx'));
const Analytics      = lazy(() => import('./pages/Analytics.jsx'));
const NotFound       = lazy(() => import('./pages/NotFound.jsx'));

// ── Fallback skeletons per route ───────────────────────────────────────────
function DashFallback() { return <DashboardSkeleton />; }
function TableFallback() { return <TableSkeleton rows={6} cols={6} />; }
function AuthFallback() { return <LoadingSpinner />; }

// ── Route change announcer for screen readers ──────────────────────────────
function RouteAnnouncer() {
  const location = useRouterLocation();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const pageName = location.pathname.replace(/^\//, '').replace(/-/g, ' ') || 'home';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnnouncement(`Navigated to ${pageName} page`);
  }, [location.pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppLayout({ children, fallback }) {
  return (
    <div className="app-layout">
      {/* Skip to main content — accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar />
      <main id="main-content" className="main-content" tabIndex={-1}>
        <Breadcrumb />
        <ErrorBoundary>
          <Suspense fallback={fallback || <TableFallback />}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <MobileNav />
      <BackToTop />
    </div>
  );
}

function App() {
  return (
    <>
      <RouteAnnouncer />
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={
          <Suspense fallback={<AuthFallback />}><Login /></Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<AuthFallback />}><Register /></Suspense>
        } />
        <Route path="/forgot-password" element={
          <Suspense fallback={<AuthFallback />}><ForgotPassword /></Suspense>
        } />

        {/* Protected pages */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout fallback={<DashFallback />}>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/plans" element={
          <ProtectedRoute>
            <AppLayout fallback={<TableFallback />}>
              <Plans />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/policies" element={
          <ProtectedRoute>
            <AppLayout fallback={<TableFallback />}>
              <Policies />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/claims" element={
          <ProtectedRoute>
            <AppLayout fallback={<TableFallback />}>
              <Claims />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <AppLayout>
              <Notifications />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/weather" element={
          <ProtectedRoute>
            <AppLayout>
              <WeatherMonitor />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AppLayout>
              <Analytics />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <AdminRoute>
            <AppLayout fallback={<TableFallback />}>
              <AdminDashboard />
            </AppLayout>
          </AdminRoute>
        } />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={
          <Suspense fallback={<AuthFallback />}><NotFound /></Suspense>
        } />
      </Routes>
    </>
  );
}

export default App;
