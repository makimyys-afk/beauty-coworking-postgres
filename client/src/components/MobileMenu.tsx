import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, MapPin, Calendar, DollarSign, Star, User } from "lucide-react";
import { APP_TITLE } from "@/const";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/", label: "Главная", icon: <Home className="w-5 h-5" /> },
  { href: "/workspaces", label: "Рабочие места", icon: <MapPin className="w-5 h-5" /> },
  { href: "/bookings", label: "Бронирования", icon: <Calendar className="w-5 h-5" /> },
  { href: "/finances", label: "Финансы", icon: <DollarSign className="w-5 h-5" /> },
  { href: "/reviews", label: "Отзывы", icon: <Star className="w-5 h-5" /> },
];

interface MobileMenuProps {
  userName?: string;
}

export function MobileMenu({ userName }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

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
            <h2 className="text-xl font-bold text-foreground">{APP_TITLE}</h2>
            {userName && (
              <p className="text-sm text-muted-foreground mt-1">{userName}</p>
            )}
          </div>
          
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all-smooth ${
                      isActive
                        ? "bg-primary text-white"
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

          {userName && (
            <div className="pt-4 border-t border-border">
              <Link href="/profile">
                <a
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-all-smooth"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Профиль</span>
                </a>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
