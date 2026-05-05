import { Inbox, Search, FileX, Users, FolderOpen, Database } from "lucide-react";
import TechButton from "./TechButton";

interface EmptyStateProps {
  icon?: "default" | "search" | "file" | "users" | "folder" | "database";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  default: Inbox,
  search: Search,
  file: FileX,
  users: Users,
  folder: FolderOpen,
  database: Database,
};

export default function EmptyState({
  icon = "default",
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(148, 163, 184, 0.1)" }}
      >
        <Icon size={28} style={{ color: "#64748B" }} />
      </div>
      <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
      {description && (
        <p
          className="text-xs mb-4 max-w-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          {description}
        </p>
      )}
      {action && (
        <TechButton variant="primary" onClick={action.onClick}>
          {action.label}
        </TechButton>
      )}
    </div>
  );
}
