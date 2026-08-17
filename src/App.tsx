import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell } from '@/layout/AppShell';
import { ROUTES } from '@/lib/routes';
import IntelligenceSunburst from '@/screens/IntelligenceSunburst';
import { DashboardBuilder } from '@/screens/DashboardBuilder';
import { DashboardView } from '@/screens/DashboardView';
import { TemplateDashboard } from '@/screens/TemplateDashboard';
import { ModulesSettings } from '@/screens/ModulesSettings';
import { MyTemplatesGallery } from '@/screens/MyTemplates';
import { DashboardFilterProvider } from '@/state/useDashboardFilterState';
import { ModulesProvider } from '@/state/useModules';
import { TemplatesProvider } from '@/state/useTemplates';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { PreferencesProvider } from '@/theme/usePreferences';

function RoutedApp() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to={ROUTES.intelligence} replace />} />
        <Route path={ROUTES.home} element={<Navigate to={ROUTES.intelligence} replace />} />
        <Route path={ROUTES.intelligence} element={<IntelligenceSunburst />} />
        <Route path={ROUTES.network} element={<Navigate to={ROUTES.intelligence} replace />} />
        <Route path={ROUTES.customDashboard} element={<DashboardBuilder />} />
        <Route path={ROUTES.myTemplates} element={<MyTemplatesGallery />} />
        <Route path="/builder/templates" element={<Navigate to={ROUTES.myTemplates} replace />} />
        <Route path={ROUTES.modules} element={<ModulesSettings />} />
        <Route path="/builder/modules" element={<Navigate to={ROUTES.modules} replace />} />
        <Route path="/builder/:dashboardId" element={<DashboardBuilder />} />
        <Route path="/dashboard/:id" element={<TemplateDashboard />} />
        <Route path={ROUTES.upload} element={<Navigate to={ROUTES.customDashboard} replace />} />
      </Route>
      <Route path="/view" element={<DashboardView />} />
      <Route path="/view/:dashboardId" element={<DashboardView />} />
    </Routes>
  );
}

export default function App() {
  return (
    <PreferencesProvider>
      <ThemeProvider>
        <ToastProvider>
          <DashboardFilterProvider>
            <ModulesProvider>
              <TemplatesProvider>
                <BrowserRouter>
                  <RoutedApp />
                </BrowserRouter>
              </TemplatesProvider>
            </ModulesProvider>
          </DashboardFilterProvider>
        </ToastProvider>
      </ThemeProvider>
    </PreferencesProvider>
  );
}
