import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { useEnterpriseSession } from './useEnterpriseSession';

export function RequireEnterpriseAuth() {
  const { user } = useEnterpriseSession();
  const location = useLocation();
  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
