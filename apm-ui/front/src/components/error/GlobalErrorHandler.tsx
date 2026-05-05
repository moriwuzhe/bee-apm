import { FC, ReactNode, useEffect } from "react";

interface GlobalErrorHandlerProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

const GlobalErrorHandler: FC<GlobalErrorHandlerProps> = ({
  children,
  onError,
}) => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error("Unknown error");
      console.error("Global error caught:", error);
      onError?.(error);
    };
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      console.error("Unhandled promise rejection:", error);
      onError?.(error);
    };
    
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [onError]);
  
  return <>{children}</>;
};

export default GlobalErrorHandler;
