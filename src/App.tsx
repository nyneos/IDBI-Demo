import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { DashboardScreen } from '@/DashboardScreen';
import { LoginScreen } from '@/LoginScreen';
import { PreferencesProvider, ThemeProvider } from '@/theme/usePreferences';

function RoutedApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardScreen />} />
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
