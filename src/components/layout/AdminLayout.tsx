
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  MessageSquareWarning, 
  HelpCircle, 
  BarChart3, 
  Package,
  LogOut 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAdminEscalationNotifications } from "@/hooks/useNotifications";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingCount, newEscalationCount, clearNewEscalationCount } = useAdminEscalationNotifications();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
      console.error("Sign out error:", error);
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      current: location.pathname === "/admin"
    },
    {
      name: "Escalated Queries",
      href: "/admin/escalated-queries",
      icon: MessageSquareWarning,
      current: location.pathname === "/admin/escalated-queries",
      badge: pendingCount
    },
    {
      name: "Order Management",
      href: "/admin/orders",
      icon: Package,
      current: location.pathname === "/admin/orders"
    },
    {
      name: "FAQ Management",
      href: "/admin/faq",
      icon: HelpCircle,
      current: location.pathname === "/admin/faq"
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      current: location.pathname === "/admin/analytics"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-muted">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-foreground">
                Ather Admin
              </h1>
            </div>
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => {
                        if (item.name === "Escalated Queries") {
                          clearNewEscalationCount();
                        }
                      }}
                      className={cn(
                        item.current
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors relative"
                      )}
                    >
                      <Icon
                        className={cn(
                          "mr-3 flex-shrink-0 h-5 w-5"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                      {item.badge && item.badge > 0 && (
                        <NotificationBadge count={item.badge} className="ml-auto" />
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex-shrink-0 p-2">
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:text-accent-foreground"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
