import { Link, useLocation } from "wouter";
import { MobileMenu } from "./MobileMenu";
import { APP_TITLE } from "@/const";
import { Home, MapPin, Calendar, DollarSign, Star, User } from "lucide-react";

interface NavbarProps {
  userName?: string;
  userAvatar?: string;
}

const navItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/workspaces", label: "Рабочие места", icon: MapPin },
  { href: "/bookings", label: "Бронирования", icon: Calendar },
  { href: "/finances", label: "Финансы", icon: DollarSign },
  { href: "/reviews", label: "Отзывы", icon: Star },
];

export function Navbar({ userName, userAvatar }: NavbarProps) {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            <MobileMenu userName={userName} />
            <Link href="/">
              <a className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors">
                <MapPin className="w-6 h-6 text-primary" />
                <span className="hidden sm:inline">{APP_TITLE}</span>
              </a>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
                      isActive
                        ? "bg-primary text-white shadow-primary"
                        : "text-foreground hover:bg-accent hover:text-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          {userName && (
            <Link href="/profile">
              <a className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-all-smooth">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="hidden lg:inline text-sm font-medium text-foreground">
                  {userName}
                </span>
              </a>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
