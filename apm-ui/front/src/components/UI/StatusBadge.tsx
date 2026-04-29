type StatusType = "online" | "offline" | "warning" | "error" | "disabled" | "ok";

const statusConfig: Record<StatusType, { label: string; color: string; bg: string; dot: string }> = {
  online:   { label: "在线",   color: "#00D68F", bg: "rgba(0,214,143,0.1)",   dot: "status-dot-green" },
  ok:       { label: "正常",   color: "#00D68F", bg: "rgba(0,214,143,0.1)",   dot: "status-dot-green" },
  offline:  { label: "离线",   color: "#94A3B8", bg: "rgba(148,163,184,0.1)", dot: "status-dot-gray" },
  disabled: { label: "禁用",   color: "#94A3B8", bg: "rgba(148,163,184,0.1)", dot: "status-dot-gray" },
  warning:  { label: "警告",   color: "#FFAA00", bg: "rgba(255,170,0,0.1)",   dot: "status-dot-yellow" },
  error:    { label: "异常",   color: "#FF4D4F", bg: "rgba(255,77,79,0.1)",   dot: "status-dot-red" },
};

export default function StatusBadge({
  status = "online",
  label,
}: {
  status?: StatusType;
  label?: string;
}) {
  const cfg = statusConfig[status] || statusConfig.online;
  return (
    <span
      data-cmp="StatusBadge"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {label || cfg.label}
    </span>
  );
}
