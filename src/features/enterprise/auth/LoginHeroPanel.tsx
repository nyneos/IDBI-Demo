import { ArrowRight } from 'lucide-react';
import { NyneOsMark } from '@/components/dashboard-builder/JustAskDialog';
import { PRODUCT_SUFFIX, PRODUCT_WORDMARK } from '@/lib/product';

export function LoginHeroPanel() {
  return (
    <div className="relative hidden min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-brand lg:flex">
      <img
        src="/bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay"
        aria-hidden
      />
      <div className="relative z-10 flex max-w-lg flex-col items-center px-10 text-center text-white">
        <img src="/Image.png" alt="" className="h-16 w-16 rounded-xl object-cover shadow-md" aria-hidden />
        <p className="mt-8 text-2xl font-bold leading-snug">
          Governed analytics — build, certify, and publish with confidence.
        </p>
        <div className="mt-10 flex w-full max-w-md items-center gap-2 rounded-full bg-white px-2 py-2 shadow-lg">
          <input
            readOnly
            tabIndex={-1}
            aria-hidden
            value="What changed in branch performance overnight?"
            className="min-w-0 flex-1 bg-transparent px-3 text-sm text-content-secondary outline-none"
          />
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-xs">
            <ArrowRight size={18} strokeWidth={1.75} aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}

export function LoginBrandHeader() {
  return (
    <div className="flex items-center gap-2">
      <NyneOsMark className="h-8 w-8 rounded-md" />
      <p className="text-lg font-bold text-content-primary">
        <span className="text-brand-text">{PRODUCT_WORDMARK}</span>
        <span className="ml-1 font-semibold text-content-secondary">{PRODUCT_SUFFIX}</span>
      </p>
    </div>
  );
}
