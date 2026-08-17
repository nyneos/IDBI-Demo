import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEnterpriseSession } from './useEnterpriseSession';

export function RequireEnterpriseAuth() {
  const { user } = useEnterpriseSession();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/enterprise/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
