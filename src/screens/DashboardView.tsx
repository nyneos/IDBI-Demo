import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Maximize2, X } from 'lucide-react';
import { DashboardGrid } from '@/components/dashboard-builder/DashboardGrid';
import { IconButton } from '@/components/ui/IconButton';
import { useDashboardFilterState } from '@/state/useDashboardFilterState';
import { useDataSources } from '@/state/useDataSources';
import { useTemplates } from '@/state/useTemplates';
import { emptyDashboard } from '@/state/useDashboardState';

export function DashboardView() {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  const { byId, templates } = useTemplates();
  const { latest } = useDataSources();
  const { activeFilter, clearFilter, drillFilter, setDrillFilter } = useDashboardFilterState();
  const dash = (dashboardId ? byId(dashboardId) : templates[0]) ?? emptyDashboard();

  return (
    <div className="min-h-screen bg-canvas p-6">
      <div className="mb-4 flex items-center justify-between">
        <IconButton aria-label="Back to builder" onClick={() => navigate('/builder')}>
          <ArrowLeft size={18} />
        </IconButton>
        <h1 className="text-lg font-semibold">{dash.name}</h1>
        <div className="flex gap-1">
          <IconButton
            aria-label="Present fullscreen"
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            <Maximize2 size={16} />
          </IconButton>
          <IconButton aria-label="Close view" onClick={() => navigate('/builder')}>
            <X size={16} />
          </IconButton>
        </div>
      </div>
      {(activeFilter || drillFilter) && (
        <button
          type="button"
          className="mb-4 rounded-full bg-brand-tint px-3 py-1 text-sm text-brand-text"
          onClick={() => {
            clearFilter();
            setDrillFilter(null);
          }}
        >
          Filtered by {(activeFilter ?? drillFilter)?.field} = {(activeFilter ?? drillFilter)?.value} ×
        </button>
      )}
      <DashboardGrid blocks={dash.blocks} layout={dash.layout} dataSource={latest} mode="view" />
    </div>
  );
}
