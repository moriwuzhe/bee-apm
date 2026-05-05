import { FC, ReactNode, useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

interface PublicLayoutProps {
  children?: ReactNode;
}

const PublicLayout: FC<PublicLayoutProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem("currentUser"));
    };
    checkLogin();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "currentUser") {
        setIsLoggedIn(!!e.newValue);
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  
  // 如果已登录，重定向到首页
  if (isLoggedIn) {
    return <Navigate to="/dashboard" />;
  }
  
  return children || <Outlet />;
};

export default PublicLayout;
