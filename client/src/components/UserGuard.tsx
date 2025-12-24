import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function UserGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      // Если пользователь - админ, перенаправляем на админ-панель
      if (user?.role === "admin") {
        setLocation("/admin");
      }
      setIsChecking(false);
    }
  }, [loading, user, setLocation]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если админ - показываем сообщение о перенаправлении
  if (user?.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Перенаправление в админ-панель...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
