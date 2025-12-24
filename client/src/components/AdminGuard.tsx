import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/useUser";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Не авторизован - редирект на логин
        setLocation("/login");
      } else if (user.role !== "admin") {
        // Не админ - редирект на главную
        setLocation("/");
      } else {
        // Все проверки пройдены
        setIsChecking(false);
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
