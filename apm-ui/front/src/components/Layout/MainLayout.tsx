import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function MainLayout({
  children,
  title = "监控大盘",
}: {
  children?: React.ReactNode;
  title?: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div data-cmp="MainLayout" className="flex h-full w-full overflow-hidden" style={{ background: "var(--background)", minWidth: "1440px" }}>
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar title={title} />
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4" style={{ background: "var(--background)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
