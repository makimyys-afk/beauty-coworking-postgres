import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE } from "@/const";
import {
  Home,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  LogOut,
  User,
  Users,
  MessageSquare,
  Database,
  Shield,
} from "lucide-react";
import { MobileMenu } from "./MobileMenu";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  // Определяем, является ли пользователь администратором
  const isAdmin = user?.role === "admin";

  // Навигация для обычных пользователей
  const userNavItems = [
    { path: "/", label: "Главная", icon: Home },
    { path: "/workspaces", label: "Рабочие места", icon: MapPin },
    { path: "/bookings", label: "Бронирования", icon: Calendar, authRequired: true },
    { path: "/finances", label: "Финансы", icon: DollarSign, authRequired: true },
    { path: "/reviews", label: "Отзывы", icon: Star, authRequired: true },
  ];

  // Навигация для администраторов (только админские функции)
  const adminNavItems = [
    { path: "/admin", label: "Дашборд", icon: Home },
    { path: "/admin/users", label: "Пользователи", icon: Users },
    { path: "/admin/workspaces", label: "Рабочие места", icon: MapPin },
    { path: "/admin/bookings", label: "Бронирования", icon: Calendar },
    { path: "/admin/reviews", label: "Отзывы", icon: MessageSquare },
    { path: "/logs", label: "SQL Логи", icon: Database },
  ];

  // Выбираем навигацию в зависимости от роли
  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-3">
            {/* Always show MobileMenu on small screens if authenticated */}
            {isAuthenticated && (
              <div className="md:hidden">
                <MobileMenu userName={user?.name} />
              </div>
            )}
            
            <Link href={isAdmin ? "/admin" : "/"}>
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className={`w-10 h-10 ${isAdmin ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-primary-gradient'} rounded-xl flex items-center justify-center`}>
                  {isAdmin ? <Shield className="w-6 h-6 text-white" /> : <MapPin className="w-6 h-6 text-white" />}
                </div>
                {/* Hide text on very small screens if needed, but usually fine */}
                <span className="text-xl font-bold text-foreground hidden sm:block">
                  {isAdmin ? "Админ-панель" : APP_TITLE}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              if (item.authRequired && !isAuthenticated) return null;
              
              const Icon = item.icon;
              const isActive = location === item.path || 
                (item.path !== "/" && item.path !== "/admin" && location.startsWith(item.path));

              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={
                      isActive
                        ? isAdmin 
                          ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md"
                          : "bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}

            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                {!isAdmin && (
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{user?.name || "Профиль"}</span>
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <span className="text-sm font-medium text-purple-600 mr-2">
                    {user?.name || "Администратор"}
                  </span>
                )}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => window.location.href = "/login"}
                className="ml-2 bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary"
              >
                Войти
              </Button>
            )}
          </div>
          
          {/* Mobile Auth Button (if not authenticated) */}
          {!isAuthenticated && (
            <div className="md:hidden">
               <Button
                onClick={() => window.location.href = "/login"}
                size="sm"
                className="bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary"
              >
                Войти
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
