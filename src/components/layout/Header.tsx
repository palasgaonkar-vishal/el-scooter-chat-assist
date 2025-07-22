
import { useState } from "react";
import { Menu, X, User, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  isAdmin?: boolean;
}

const Header = ({ isAdmin = false }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, isAdmin: userIsAdmin } = useAuth();

  const customerNavItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Chat Support", path: "/dashboard/chat" },
    { name: "FAQ", path: "/dashboard/faq" },
    { name: "Order Status", path: "/dashboard/orders" },
    { name: "Profile", path: "/dashboard/profile" },
  ];

  const adminNavItems = [
    { name: "Dashboard", path: "/admin" },
    { name: "FAQ Management", path: "/admin/faq" },
    { name: "Escalated Queries", path: "/admin/escalated-queries" },
    { name: "Analytics", path: "/admin/analytics" },
    { name: "Order Management", path: "/admin/orders" },
  ];

  const navItems = isAdmin ? adminNavItems : customerNavItems;

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg">
              {isAdmin ? "Ather Admin" : "Ather Support"}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`transition-colors hover:text-foreground/80 ${
                isActive(item.path) 
                  ? "text-foreground" 
                  : "text-foreground/60"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center space-x-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex">
                  <User className="h-4 w-4 mr-2" />
                  {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                 <DropdownMenuItem asChild>
                   <Link to="/dashboard/profile" className="flex items-center">
                     <User className="h-4 w-4 mr-2" />
                     Profile
                   </Link>
                 </DropdownMenuItem>
                 {userIsAdmin && (
                   <DropdownMenuItem asChild>
                     <Link to="/admin" className="flex items-center">
                       <Settings className="h-4 w-4 mr-2" />
                       Admin Dashboard
                     </Link>
                   </DropdownMenuItem>
                 )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link to="/login">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
          
          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <div className="px-7">
                 <Link
                   to={isAdmin ? "/admin" : "/dashboard"}
                   className="flex items-center"
                   onClick={() => setIsOpen(false)}
                 >
                  <span className="font-bold">
                    {isAdmin ? "Ather Admin" : "Ather Support"}
                  </span>
                </Link>
                <nav className="flex flex-col space-y-3 mt-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`transition-colors hover:text-foreground/80 ${
                        isActive(item.path) 
                          ? "text-foreground font-medium" 
                          : "text-foreground/60"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {user ? (
                    <>
                       <Link
                         to="/dashboard/profile"
                         onClick={() => setIsOpen(false)}
                         className="flex items-center text-foreground/60 hover:text-foreground/80 transition-colors mt-4 pt-4 border-t"
                       >
                         <User className="h-4 w-4 mr-2" />
                         Profile
                       </Link>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-start text-destructive hover:text-destructive p-0 h-auto"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center text-foreground/60 hover:text-foreground/80 transition-colors mt-4 pt-4 border-t"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
