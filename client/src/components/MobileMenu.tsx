import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, MapPin, Calendar, DollarSign, Star, User, Users, MessageSquare, Database, LogOut, Shield } from "lucide-react";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// Навигация для обычных пользователей
const userNavItems: NavItem[] = [
  { href: "/", label: "Главная", icon: <Home className="w-5 h-5" /> },
  { href: "/workspaces", label: "Рабочие места", icon: <MapPin className="w-5 h-5" /> },
  { href: "/bookings", label: "Бронирования", icon: <Calendar className="w-5 h-5" /> },
  { href: "/finances", label: "Финансы", icon: <DollarSign className="w-5 h-5" /> },
  { href: "/reviews", label: "Отзывы", icon: <Star className="w-5 h-5" /> },
];

// Навигация для администраторов
const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Дашборд", icon: <Home className="w-5 h-5" /> },
  { href: "/admin/users", label: "Пользователи", icon: <Users className="w-5 h-5" /> },
  { href: "/admin/workspaces", label: "Рабочие места", icon: <MapPin className="w-5 h-5" /> },
  { href: "/admin/bookings", label: "Бронирования", icon: <Calendar className="w-5 h-5" /> },
  { href: "/admin/reviews", label: "Отзывы", icon: <MessageSquare className="w-5 h-5" /> },
  { href: "/logs", label: "SQL Логи", icon: <Database className="w-5 h-5" /> },
];

interface MobileMenuProps {
  userName?: string;
}

export function MobileMenu({ userName }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    window.location.href = "/login";
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="flex flex-col h-full">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              {isAdmin && <Shield className="w-5 h-5 text-purple-600" />}
              <h2 className="text-xl font-bold text-foreground">
                {isAdmin ? "Админ-панель" : APP_TITLE}
              </h2>
            </div>
            {userName && (
              <p className={`text-sm mt-1 ${isAdmin ? "text-purple-600 font-medium" : "text-muted-foreground"}`}>
                {userName}
              </p>
            )}
          </div>
          
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href || 
                (item.href !== "/" && item.href !== "/admin" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all-smooth ${
                      isActive
                        ? isAdmin 
                          ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white"
                          : "bg-primary text-white"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-border space-y-2">
            {!isAdmin && userName && (
              <Link href="/profile">
                <a
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-all-smooth"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Профиль</span>
                </a>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all-smooth w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Выйти</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
