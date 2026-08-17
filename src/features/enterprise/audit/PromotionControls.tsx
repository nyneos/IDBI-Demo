import { Button } from '@/components/ui/Button';
import { StatusPill, type PillTone } from '@/components/ui/StatusPill';
import { PROMOTION_LABEL, type PromotionStatus } from './types';

const TONE: Record<PromotionStatus, PillTone> = {
  draft: 'neutral',
  'in-review': 'warning',
  approved: 'info',
  published: 'success',
};

export function PromotionControls({
  status,
  onSubmit,
  onApprovePublish,
  onRevert,
}: {
  status: PromotionStatus;
  onSubmit: () => void;
  onApprovePublish: () => void;
  onRevert: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill label={PROMOTION_LABEL[status]} tone={TONE[status]} />
      {status === 'draft' ? (
        <Button variant="secondary" onClick={onSubmit}>
          Submit for Review
        </Button>
      ) : null}
      {status === 'in-review' ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={onApprovePublish}>
            Approve & Publish
          </Button>
          <p className="max-w-xs text-xs text-content-tertiary">
            Single admin identity — you are approving your own submission. A second role is not
            faked here.
          </p>
        </div>
      ) : null}
      {status === 'approved' ? (
        <Button variant="primary" onClick={onApprovePublish}>
          Publish
        </Button>
      ) : null}
      {status === 'published' ? (
        <Button variant="secondary" onClick={onRevert}>
          Revert to Draft
        </Button>
      ) : null}
    </div>
  );
}
