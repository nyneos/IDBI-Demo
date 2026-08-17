import { useParams } from 'react-router-dom';
import { DashboardWorkspace } from './DashboardBuilder';
import { useTemplates } from '@/state/useTemplates';

export function TemplateDashboard() {
  const { id } = useParams();
  const { byId } = useTemplates();
  const dash = id ? byId(id) : null;
  if (!dash) {
    return <p className="text-sm text-content-secondary">This template was not found.</p>;
  }
  return <DashboardWorkspace initial={dash} templateMode />;
}
