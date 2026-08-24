import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { LoginScreen } from '@/LoginScreen';
import { PreferencesProvider, ThemeProvider } from '@/theme/usePreferences';
import { useUserNameLive } from '@/useUserNameLive';

function DashboardHome() {
  const userName = useUserNameLive();

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-content-primary">
        {userName ? `Hi, ${userName}` : 'Waiting for user_name…'}
      </h1>
    </div>
  );
}

function RoutedApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardHome />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <ThemeProvider>
        <BrowserRouter>
          <RoutedApp />
        </BrowserRouter>
      </ThemeProvider>
    </PreferencesProvider>
  );
}
