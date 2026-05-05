import { FC, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string | string[];
  redirectPath?: string;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  redirectPath = "/login",
}) => {
  const location = useLocation();
  
  // 模拟用户权限检查
  // 在实际项目中，这里应该从 Context 或 store 中获取用户权限
  const userPermissions = (() => {
    try {
      const user = localStorage.getItem("currentUser");
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.permissions || [];
      }
    } catch {
      // ignore
    }
    return [];
  })();
  
  // 检查是否已登录
  const isLoggedIn = !!localStorage.getItem("currentUser");
  
  // 如果需要权限检查
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasPermission = permissions.some((p) => userPermissions.includes(p));
    
    if (!isLoggedIn) {
      return <Navigate to={redirectPath} state={{ from: location }} />;
    }
    
    if (!hasPermission) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-4xl mb-4">🚫</div>
            <div className="text-lg font-semibold text-white">权限不足</div>
            <div className="text-sm text-muted-foreground mt-2">
              您没有访问此页面的权限，请联系管理员
            </div>
          </div>
        </div>
      );
    }
  } else {
    // 只检查登录状态
    if (!isLoggedIn) {
      return <Navigate to={redirectPath} state={{ from: location }} />;
    }
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
