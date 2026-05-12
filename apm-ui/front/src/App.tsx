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
import TraceTracking from "./pages/TraceTracking";
import HealthCheck from "./pages/HealthCheck";
import AlertHistory from "./pages/AlertHistory";
import LogViewer from "./pages/LogViewer";
import APIDocs from "./pages/APIDocs";
import DatabaseManagement from "./pages/DatabaseManagement";
import SystemSettings from "./pages/SystemSettings";
import ReportBuilder from "./pages/ReportBuilder";
import CapacityPlanning from "./pages/CapacityPlanning";
import WorkflowAutomation from "./pages/WorkflowAutomation";
import DisasterRecovery from "./pages/DisasterRecovery";
import PerformanceAnalyzer from "./pages/PerformanceAnalyzer";
import AIAutomationCenter from "./pages/AIAutomationCenter";
import KnowledgeBase from "./pages/KnowledgeBase";
import SLAManagement from "./pages/SLAManagement";
import PluginMarketplace from "./pages/PluginMarketplace";
import NotificationCenter from "./pages/NotificationCenter";
import IntegrationHub from "./pages/IntegrationHub";
import SecurityAudit from "./pages/SecurityAudit";
import MetricExplorer from "./pages/MetricExplorer";
import CostAnalysis from "./pages/CostAnalysis";
import TaskScheduler from "./pages/TaskScheduler";
import DatabaseMonitor from "./pages/DatabaseMonitor";
import APIGatewayMonitor from "./pages/APIGatewayMonitor";
import MessageQueueMonitor from "./pages/MessageQueueMonitor";
import CacheMonitor from "./pages/CacheMonitor";
import ContainerMonitor from "./pages/ContainerMonitor";
import APIPerformance from "./pages/APIPerformance";
import DistributedTracing from "./pages/DistributedTracing";
import ConfigurationManager from "./pages/ConfigurationManager";
import CustomIntegrations from "./pages/CustomIntegrations";

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
        <Route path="/trace-tracking" element={<TraceTracking />} />
        <Route path="/health-check" element={<HealthCheck />} />
        <Route path="/alert-history" element={<AlertHistory />} />
        <Route path="/log-viewer" element={<LogViewer />} />
        <Route path="/api-docs" element={<APIDocs />} />
        <Route path="/database" element={<DatabaseManagement />} />
        <Route path="/settings" element={<SystemSettings />} />
        <Route path="/reports" element={<ReportBuilder />} />
        <Route path="/capacity" element={<CapacityPlanning />} />
        <Route path="/workflows" element={<WorkflowAutomation />} />
        <Route path="/dr" element={<DisasterRecovery />} />
        <Route path="/performance" element={<PerformanceAnalyzer />} />
        <Route path="/ai-automation" element={<AIAutomationCenter />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/sla" element={<SLAManagement />} />
        <Route path="/marketplace" element={<PluginMarketplace />} />
        <Route path="/notifications" element={<NotificationCenter />} />
        <Route path="/integrations" element={<IntegrationHub />} />
        <Route path="/security" element={<SecurityAudit />} />
        <Route path="/metrics" element={<MetricExplorer />} />
        <Route path="/cost" element={<CostAnalysis />} />
        <Route path="/tasks" element={<TaskScheduler />} />
        <Route path="/db-monitor" element={<DatabaseMonitor />} />
        <Route path="/api-gateway" element={<APIGatewayMonitor />} />
        <Route path="/message-queue" element={<MessageQueueMonitor />} />
        <Route path="/cache" element={<CacheMonitor />} />
        <Route path="/containers" element={<ContainerMonitor />} />
        <Route path="/api-performance" element={<APIPerformance />} />
        <Route path="/tracing" element={<DistributedTracing />} />
        <Route path="/config" element={<ConfigurationManager />} />
        <Route path="/integrations" element={<CustomIntegrations />} />
      </Routes>
    </ErrorBoundary>
    <Toaster position="top-right" />
  </BrowserRouter>
);

export default App;