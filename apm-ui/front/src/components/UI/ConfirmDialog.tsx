import { FC } from "react";
import { X } from "lucide-react";
import TechButton from "./TechButton";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "warning";
  isLoading?: boolean;
}

const variantStyles: Record<string, { btn: string; bg: string }> = {
  primary: {
    btn: "primary",
    bg: "rgba(22, 93, 255, 0.15)",
  },
  danger: {
    btn: "danger",
    bg: "rgba(255, 77, 79, 0.15)",
  },
  warning: {
    btn: "secondary",
    bg: "rgba(255, 170, 0, 0.15)",
  },
};

const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "确定",
  cancelText = "取消",
  variant = "primary",
  isLoading = false,
}) => {
  if (!isOpen) return null;
  const style = variantStyles[variant];
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200]"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-[360px] rounded-xl p-6 relative"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center"
          style={{ color: "var(--muted-foreground)" }}
        >
          <X size={16} />
        </button>
        <div className="text-sm font-semibold text-white mb-3">{title}</div>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {message}
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <TechButton
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </TechButton>
          <TechButton
            variant={style.btn as any}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "请稍候..." : confirmText}
          </TechButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
