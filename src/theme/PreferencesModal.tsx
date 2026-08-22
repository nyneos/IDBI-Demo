import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button, IconButton, Select } from '@/layout/ui';
import { cn } from '@/lib/cn';
import {
  BRANDS,
  DARK_SURFACES,
  FONT_LABELS,
  FONT_STACKS,
  LIGHT_SURFACES,
  type FontId,
} from './themeTokens';
import { usePreferences } from './usePreferences';

const FONTS = Object.keys(FONT_LABELS) as FontId[];

export function PreferencesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = usePreferences();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss preferences"
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prefs-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="relative z-[1] w-full max-w-lg rounded-2xl border border-hairline bg-paper p-8 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="prefs-title" className="text-xl font-bold text-content-primary">
                  Preferences
                </h2>
                <p className="mt-1 text-sm text-content-secondary">
                  Customize your dashboard layout preferences.
                </p>
              </div>
              <IconButton aria-label="Close preferences" onClick={onClose}>
                <X size={16} strokeWidth={1.75} />
              </IconButton>
            </div>

            <section className="mt-8">
              <p className="mb-3 text-sm font-semibold text-content-primary">Theme Brand</p>
              <div className="flex w-full justify-evenly">
                {BRANDS.map((b) => {
                  const selected = prefs.brand === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => prefs.setBrand(b.id)}
                      className="flex flex-col items-center gap-2 outline-none"
                    >
                      <motion.span
                        animate={{ scale: selected ? 1.05 : 1 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-full',
                          selected && 'ring-2 ring-offset-2',
                        )}
                        style={{
                          backgroundColor: b.color,
                          ['--tw-ring-color' as string]: b.color,
                        }}
                      >
                        {selected ? <Check size={20} strokeWidth={2.5} className="text-white" /> : null}
                      </motion.span>
                      <span className="text-xs font-medium text-content-secondary">{b.label}</span>
                    </button>
                  );
                })}
              </div>
              <hr className="mt-5 border-hairline" />
            </section>

            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-content-primary">Light Theme</p>
                {prefs.mode === 'light' ? (
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand-text">
                    Active
                  </span>
                ) : null}
              </div>
              <div className="flex w-full justify-evenly">
                {LIGHT_SURFACES.map((s) => {
                  const selected = prefs.mode === 'light' && prefs.surface === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => prefs.setLightSurface(s.id)}
                      className="flex flex-col items-center gap-2 outline-none"
                    >
                      <span
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-full border border-hairline',
                          selected && 'ring-2 ring-brand ring-offset-2',
                        )}
                        style={{ backgroundColor: s.canvas }}
                      >
                        {selected ? (
                          <Check size={18} strokeWidth={2.5} className="text-brand-text" />
                        ) : null}
                      </span>
                      <span className="max-w-20 text-center text-xs font-medium text-content-secondary">
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <hr className="mt-5 border-hairline" />
            </section>

            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-content-primary">Dark Theme</p>
                {prefs.mode === 'dark' ? (
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-semibold text-brand-text">
                    Active
                  </span>
                ) : null}
              </div>
              <div className="flex w-full justify-evenly">
                {DARK_SURFACES.map((s) => {
                  const selected = prefs.mode === 'dark' && prefs.surface === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => prefs.setDarkSurface(s.id)}
                      className="flex flex-col items-center gap-2 outline-none"
                    >
                      <span
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-full border border-hairline',
                          selected && 'ring-2 ring-brand ring-offset-2',
                        )}
                        style={{ backgroundColor: s.canvas }}
                      >
                        {selected ? (
                          <Check size={18} strokeWidth={2.5} className="text-brand-text" />
                        ) : null}
                      </span>
                      <span className="max-w-20 text-center text-xs font-medium text-content-secondary">
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <hr className="mt-5 border-hairline" />
            </section>

            <section className="mt-6">
              <p className="mb-3 text-sm font-semibold text-content-primary">Fonts</p>
              <Select
                label="Font family"
                hideLabel
                value={prefs.font}
                onChange={(e) => prefs.setFont(e.target.value as FontId)}
                options={FONTS.map((id) => ({ value: id, label: FONT_LABELS[id] }))}
              />
              <p className="mt-2 text-sm text-content-secondary" style={{ fontFamily: FONT_STACKS[prefs.font] }}>
                Preview in {FONT_LABELS[prefs.font]}
              </p>
            </section>

            <Button variant="secondary" className="mt-8 w-full" onClick={prefs.restoreDefaults}>
              Restore Defaults
            </Button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
