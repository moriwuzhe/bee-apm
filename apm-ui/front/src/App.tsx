import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Applications from "./pages/Applications";
import AgentControl from "./pages/AgentControl";
import JVMMonitor from "./pages/JVMMonitor";
import NetworkTopology from "./pages/NetworkTopology";
import ServiceDependency from "./pages/ServiceDependency";
import Releases from "./pages/Releases";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Permissions from "./pages/Permissions";
import AlertRules from "./pages/AlertRules";
import ReleaseAnalysis from "./pages/ReleaseAnalysis";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.log("ErrorBoundary caught:", error);
  }
  render() {
    return this.state.hasError ? (
      <div className="flex items-center justify-center h-screen" style={{ background: "#0F172A", color: "#94A3B8" }}>
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-sm">页面发生异常，请刷新重试</div>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}

const App = () => (
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/agent" element={<AgentControl />} />
        <Route path="/jvm" element={<JVMMonitor />} />
        <Route path="/topology" element={<NetworkTopology />} />
        <Route path="/service-dep" element={<ServiceDependency />} />
        <Route path="/releases" element={<Releases />} />
        <Route path="/users" element={<Users />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/permissions" element={<Permissions />} />
        <Route path="/alert-rules" element={<AlertRules />} />
        <Route path="/release-analysis" element={<ReleaseAnalysis />} />
      </Routes>
    </ErrorBoundary>
    <Toaster position="top-right" />
  </BrowserRouter>
);

export default App;
