import { EnterprisePageTitle } from './EnterprisePageHeader';

export function FeaturePlaceholder({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <EnterprisePageTitle title={title} />
      <p className="max-w-2xl text-sm text-content-secondary">{body}</p>
      <div className="mt-4 rounded-xl border border-dashed border-hairline bg-paper px-6 py-10 text-sm text-content-tertiary">
        Isolated Enterprise surface — this screen does not change the existing product.
      </div>
    </div>
  );
}
