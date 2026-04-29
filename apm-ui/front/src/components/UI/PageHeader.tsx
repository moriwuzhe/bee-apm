export default function PageHeader({
  title = "页面标题",
  subtitle = "",
  actions,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div data-cmp="PageHeader" className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2" data-px-slot>{actions}</div>}
    </div>
  );
}
