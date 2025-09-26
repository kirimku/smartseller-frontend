import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@shared/components/ui/sheet";
import {
  LayoutDashboard,
  Store,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Shield,
  Menu,
  Bell,
  Search,
  HelpCircle,
  LogOut,
  Zap,
  Globe
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/platform', icon: LayoutDashboard },
  { name: 'Tenants', href: '/platform/tenants', icon: Store },
  { name: 'Users', href: '/platform/users', icon: Users },
  { name: 'Analytics', href: '/platform/analytics', icon: BarChart3 },
  { name: 'Billing', href: '/platform/billing', icon: CreditCard },
  { name: 'System', href: '/platform/system', icon: Shield },
  { name: 'Settings', href: '/platform/settings', icon: Settings },
];

interface PlatformLayoutProps {
  children?: React.ReactNode;
}

const PlatformLayout = ({ children }: PlatformLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  const NavigationItems = () => (
    <nav className="flex-1 space-y-1 px-2">
      {navigation.map((item) => (
        <Button
          key={item.name}
          variant={isActiveRoute(item.href) ? "secondary" : "ghost"}
          className={`w-full justify-start ${
            isActiveRoute(item.href) ? "bg-purple-100 text-purple-700" : ""
          }`}
          onClick={() => {
            navigate(item.href);
            setSidebarOpen(false);
          }}
        >
          <item.icon className="mr-3 h-5 w-5" />
          {item.name}
        </Button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="fixed top-4 left-4 z-40 md:hidden"
            size="icon"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <div className="flex flex-col h-full">
            <div className="flex items-center px-6 py-4 border-b">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-semibold">SmartSeller</h1>
                  <div className="flex items-center">
                    <Badge variant="default" className="text-xs bg-purple-600">Platform Admin</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 py-4">
              <NavigationItems />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r">
          <div className="flex items-center px-6 py-4 border-b">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold">SmartSeller</h1>
                <div className="flex items-center">
                  <Badge variant="default" className="text-xs bg-purple-600">Platform Admin</Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 py-4">
            <NavigationItems />
          </div>
          
          {/* System status */}
          <div className="p-4 border-t">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-800">All Systems Operational</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                1,247 tenants • 99.9% uptime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-72">
        {/* Top bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="max-w-lg w-full lg:max-w-xs">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="Search tenants, users..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  12
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/admin.png" alt="@admin" />
                      <AvatarFallback>SA</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">SmartSeller Admin</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        admin@smartseller.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Platform Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Globe className="mr-2 h-4 w-4" />
                    <span>System Status</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;