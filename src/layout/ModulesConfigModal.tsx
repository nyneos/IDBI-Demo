import { createPortal } from 'react-dom';
import { ModulesConfigPanel } from '@/screens/ModulesConfigPanel';
import { useModules } from '@/state/useModules';

export function ModulesConfigModal() {
  const { configOpen, setConfigOpen } = useModules();
  if (typeof document === 'undefined' || !configOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Dismiss"
        onClick={() => setConfigOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modules-config-title"
        className="relative z-[1] max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-hairline bg-paper p-8 shadow-lg"
      >
        <ModulesConfigPanel onClose={() => setConfigOpen(false)} />
      </div>
    </div>,
    document.body,
  );
}
