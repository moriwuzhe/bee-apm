type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

const variantStyles: Record<Variant, { bg: string; color: string; border: string; hover: string }> = {
  primary:   { bg: "#165DFF",                  color: "#fff",      border: "#165DFF",                hover: "#1250D4" },
  secondary: { bg: "transparent",              color: "#94A3B8",   border: "rgba(148,163,184,0.2)",  hover: "rgba(148,163,184,0.08)" },
  ghost:     { bg: "transparent",              color: "#94A3B8",   border: "transparent",             hover: "rgba(148,163,184,0.08)" },
  danger:    { bg: "rgba(255,77,79,0.12)",     color: "#FF4D4F",   border: "rgba(255,77,79,0.3)",    hover: "rgba(255,77,79,0.2)" },
  success:   { bg: "rgba(0,214,143,0.12)",     color: "#00D68F",   border: "rgba(0,214,143,0.3)",    hover: "rgba(0,214,143,0.2)" },
};

export default function TechButton({
  children,
  variant = "secondary",
  size = "sm",
  icon,
  onClick = () => {},
  disabled = false,
}: {
  children?: React.ReactNode;
  variant?: Variant;
  size?: "xs" | "sm" | "md";
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const v = variantStyles[variant];
  const padding = size === "xs" ? "px-2 py-1" : size === "md" ? "px-4 py-2" : "px-3 py-1.5";
  const fontSize = size === "xs" ? "text-xs" : size === "md" ? "text-sm" : "text-xs";

  return (
    <button
      data-cmp="TechButton"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-all ${padding} ${fontSize} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = v.hover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = v.bg; }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children && <span data-px-slot>{children}</span>}
    </button>
  );
}
