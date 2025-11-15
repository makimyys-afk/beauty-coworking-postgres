import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/MobileMenu";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Home, MapPin, Calendar, DollarSign, Database, LogOut, User, Star } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const navItems = [
    { path: "/", label: "Главная", icon: Home },
    { path: "/workspaces", label: "Рабочие места", icon: MapPin },
    { path: "/bookings", label: "Бронирования", icon: Calendar, authRequired: true },
    { path: "/finances", label: "Финансы", icon: DollarSign, authRequired: true },
    { path: "/reviews", label: "Отзывы", icon: Star, authRequired: true },
  ];

  // Добавляем логи для администраторов
  if (user?.role === "admin") {
    navItems.push({ path: "/logs", label: "SQL Логи", icon: Database, authRequired: true });
  }

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-3">
            {isAuthenticated && <MobileMenu userName={user?.name} />}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-primary-gradient rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground hidden sm:block">
                  {APP_TITLE}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              if (item.authRequired && !isAuthenticated) return null;
              
              const Icon = item.icon;
              const isActive = location === item.path;

              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={
                      isActive
                        ? "bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}

            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <User className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{user?.name || "Профиль"}</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                className="ml-2 bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary"
              >
                Войти
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
