import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginScreen } from './auth/LoginScreen';
import { RequireEnterpriseAuth } from './auth/RequireEnterpriseAuth';
import { EnterpriseDashboardBuilder } from './dashboard-builder/EnterpriseDashboardBuilder';
import { EnterpriseShell } from './shared/EnterpriseShell';
import { ROUTES } from '@/lib/routes';

/**
 * Isolated Enterprise builder + login.
 * Semantic Layer, Scheduled Reports, Audit, Report Designer, and AI Insights
 * now live on the main DataCanvas sidebar.
 */
export function EnterpriseRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginScreen />} />
      <Route element={<RequireEnterpriseAuth />}>
        <Route element={<EnterpriseShell />}>
          <Route index element={<Navigate to="builder" replace />} />
          <Route path="builder" element={<EnterpriseDashboardBuilder />} />
          <Route path="dashboard-builder" element={<EnterpriseDashboardBuilder />} />
          <Route path="semantic-layer" element={<Navigate to={ROUTES.semanticLayer} replace />} />
          <Route path="scheduled-reports" element={<Navigate to={ROUTES.scheduledReports} replace />} />
          <Route path="audit" element={<Navigate to={ROUTES.audit} replace />} />
          <Route path="report-designer" element={<Navigate to={ROUTES.reportDesigner} replace />} />
          <Route path="ai-insights" element={<Navigate to={ROUTES.aiInsights} replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
