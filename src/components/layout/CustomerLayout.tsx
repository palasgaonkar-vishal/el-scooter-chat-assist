
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useCustomerResolutionNotifications } from "@/hooks/useNotifications";
import { useEffect } from "react";

const CustomerLayout = () => {
  // Initialize customer notifications (happens globally in layout)
  const { unreadResolutions } = useCustomerResolutionNotifications();

  return (
    <div className="min-h-screen bg-background">
      <Header isAdmin={false} />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
