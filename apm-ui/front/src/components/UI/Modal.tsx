import { FC, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  hideCloseButton?: boolean;
}

const sizeStyles: Record<string, string> = {
  sm: "w-[400px]",
  md: "w-[480px]",
  lg: "w-[640px]",
  xl: "w-[800px]",
};

const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  hideCloseButton = false,
}) => {
  if (!isOpen) return null;
  const sizeClass = sizeStyles[size];
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200]"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className={`${sizeClass} rounded-xl p-6 relative`}
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-sm font-semibold text-white">{title}</div>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ color: "var(--muted-foreground)" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-6 pt-4 border-t border-border">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
