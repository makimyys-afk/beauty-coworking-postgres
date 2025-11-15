import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  FileText, 
  CreditCard, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Star
} from "lucide-react";
import { useLocation } from "wouter";
export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  // Mock данные пользователя с золотым статусом
  const userData = {
    phone: "+7 (999) 123-45-67",
    specialization: "Парикмахер",
    points: 750,
    status: "gold" as const
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      bronze: "Бронзовый статус",
      silver: "Серебряный статус",
      gold: "Золотой статус"
    };
    return labels[status as keyof typeof labels] || "Бронзовый статус";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      bronze: "bg-orange-100 text-orange-700 border-orange-200",
      silver: "bg-gray-100 text-gray-700 border-gray-300",
      gold: "bg-yellow-100 text-yellow-700 border-yellow-300"
    };
    return colors[status as keyof typeof colors] || colors.bronze;
  };

  const specializations = ["Парикмахер", "Колорист", "Стилист"];
  const currentSpecialization = userData?.specialization || "Парикмахер";

  const settingsItems = [
    { icon: User, label: "Личные данные", path: "/profile/personal" },
    { icon: FileText, label: "Мои документы", path: "/profile/documents" },
    { icon: CreditCard, label: "Способы оплаты", path: "/profile/payment" },
    { icon: Bell, label: "Уведомления", path: "/profile/notifications" },
    { icon: Shield, label: "Безопасность", path: "/profile/security" },
  ];

  const helpItems = [
    { icon: HelpCircle, label: "Центр поддержки", path: "/support" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Профиль</h1>

        {/* User Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16 bg-primary/10">
                <AvatarFallback className="text-xl font-semibold text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {userData?.phone && (
                  <p className="text-sm text-muted-foreground">{userData.phone}</p>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div 
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(userData?.status || 'bronze')}`}
              onClick={() => setLocation("/profile/status")}
            >
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6" fill="currentColor" />
                <div>
                  <p className="font-semibold">{getStatusLabel(userData?.status || 'bronze')}</p>
                  <p className="text-sm">{userData?.points || 0} баллов</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Specialization */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Специализация</h3>
          <div className="flex gap-2">
            {specializations.map((spec) => (
              <Button
                key={spec}
                variant={currentSpecialization === spec ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  // TODO: Update specialization
                }}
              >
                {spec}
              </Button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Настройки</h3>
          <Card>
            <CardContent className="p-0">
              {settingsItems.map((item, index) => (
                <div
                  key={item.path}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    index !== settingsItems.length - 1 ? "border-b" : ""
                  }`}
                  onClick={() => setLocation(item.path)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Help */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Помощь</h3>
          <Card>
            <CardContent className="p-0">
              {helpItems.map((item) => (
                <div
                  key={item.path}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setLocation(item.path)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-primary" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
              
              {/* Logout */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors border-t"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-destructive" />
                  <span className="text-destructive">Выйти</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
