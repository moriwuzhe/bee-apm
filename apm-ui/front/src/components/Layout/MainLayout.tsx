import { useLocalStorage } from "../../hooks";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { Activity, Settings, Bell, RefreshCw } from "lucide-react";

interface Breadcrumb {
  label: string;
  href?: string;
}

export default function MainLayout({
  children,
  title = "监控大盘",
  actions,
  breadcrumbs = [],
  showRefresh = false,
  onRefresh,
  showSettings = false,
  onSettings,
  showNotifications = false,
  notificationCount = 0,
}: {
  children?: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  showRefresh?: boolean;
  onRefresh?: () => void;
  showSettings?: boolean;
  onSettings?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
}) {
  const [collapsed, setCollapsed] = useLocalStorage("sidebarCollapsed", false);

  return (
    <div data-cmp="MainLayout" className="flex h-full w-full overflow-hidden" style={{ background: "var(--background)", minWidth: "1440px" }}>
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar 
          title={title} 
          actions={actions}
          breadcrumbs={breadcrumbs}
          showRefresh={showRefresh}
          onRefresh={onRefresh}
          showSettings={showSettings}
          onSettings={onSettings}
          showNotifications={showNotifications}
          notificationCount={notificationCount}
        />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4" style={{ background: "var(--background)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
