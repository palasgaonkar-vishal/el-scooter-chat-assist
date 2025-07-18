
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  // TODO: Implement authentication logic in Task 003
  // For now, we'll render children directly to allow navigation testing
  console.log(`Protected route accessed - Admin only: ${adminOnly}`);
  
  return <>{children}</>;
};

export default ProtectedRoute;
