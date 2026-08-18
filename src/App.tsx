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
import { EnterpriseRoutes } from '@/features/enterprise/EnterpriseRoutes';
import { LoginScreen } from '@/features/enterprise/auth/LoginScreen';
import { RequireEnterpriseAuth } from '@/features/enterprise/auth/RequireEnterpriseAuth';
import { EnterpriseSessionProvider } from '@/features/enterprise/auth/useEnterpriseSession';
import { SemanticLayerProvider } from '@/features/enterprise/semantic-layer/useSemanticLayer';
import { SemanticLayerScreen } from '@/features/enterprise/semantic-layer/SemanticLayerScreen';
import { ScheduledReportsScreen } from '@/features/enterprise/scheduling/ScheduledReportsScreen';
import { AuditLogScreen } from '@/features/enterprise/audit/AuditLogScreen';
import { ReportDesignerScreen } from '@/features/enterprise/report-designer/ReportDesignerScreen';
import { AiInsightsScreen } from '@/features/enterprise/ai-insights/AiInsightsScreen';

function RoutedApp() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginScreen />} />
      <Route path="/enterprise/login" element={<Navigate to={ROUTES.login} replace />} />
      <Route element={<RequireEnterpriseAuth />}>
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
          <Route path={ROUTES.semanticLayer} element={<SemanticLayerScreen />} />
          <Route path={ROUTES.scheduledReports} element={<ScheduledReportsScreen />} />
          <Route path={ROUTES.audit} element={<AuditLogScreen />} />
          <Route path={ROUTES.reportDesigner} element={<ReportDesignerScreen />} />
          <Route path={ROUTES.aiInsights} element={<AiInsightsScreen />} />
        </Route>
        <Route path="/view" element={<DashboardView />} />
        <Route path="/view/:dashboardId" element={<DashboardView />} />
        <Route path="/enterprise/*" element={<EnterpriseRoutes />} />
        <Route path="*" element={<Navigate to={ROUTES.intelligence} replace />} />
      </Route>
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
                <EnterpriseSessionProvider>
                  <SemanticLayerProvider>
                    <BrowserRouter>
                      <RoutedApp />
                    </BrowserRouter>
                  </SemanticLayerProvider>
                </EnterpriseSessionProvider>
              </TemplatesProvider>
            </ModulesProvider>
          </DashboardFilterProvider>
        </ToastProvider>
      </ThemeProvider>
    </PreferencesProvider>
  );
}
