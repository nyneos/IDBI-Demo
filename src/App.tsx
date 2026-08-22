import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { LoginScreen } from '@/LoginScreen';
import { PreferencesProvider, ThemeProvider } from '@/theme/usePreferences';
import { SessionProvider, useSession } from '@/session';
import { useUserNameStream } from '@/useUserNameStream';

function RequireAuth() {
  const { user } = useSession();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

function DashboardHome() {
  const { user } = useSession();
  const userName = useUserNameStream(user?.name ?? '');

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <h1 className="text-2xl font-semibold text-content-primary">Hi, {userName}</h1>
    </div>
  );
}

function RoutedApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/enterprise/login" element={<Navigate to="/login" replace />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardHome />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <ThemeProvider>
        <SessionProvider>
          <BrowserRouter>
            <RoutedApp />
          </BrowserRouter>
        </SessionProvider>
      </ThemeProvider>
    </PreferencesProvider>
  );
}
