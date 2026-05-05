import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import TechButton from "./TechButton";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[300px]">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(255, 77, 79, 0.1)" }}
          >
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">页面出错了</h3>
          <p
            className="text-xs mb-4 max-w-md"
            style={{ color: "var(--muted-foreground)" }}
          >
            {this.state.error?.message || "发生了未知错误，请尝试刷新页面"}
          </p>
          <TechButton
            variant="primary"
            icon={<RefreshCw size={13} />}
            onClick={this.handleReload}
          >
            刷新页面
          </TechButton>
        </div>
      );
    }

    return this.props.children;
  }
}
