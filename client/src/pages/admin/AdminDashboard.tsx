import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Calendar, MessageSquare, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "wouter";

interface Stats {
  totalUsers: number;
  totalWorkspaces: number;
  totalBookings: number;
  totalReviews: number;
  totalRevenue: number;
  activeBookings: number;
}

interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  entityType: string;
  entityId: number | null;
  details: string | null;
  createdAt: string;
  adminName: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalWorkspaces: 0,
    totalBookings: 0,
    totalReviews: 0,
    totalRevenue: 0,
    activeBookings: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const response = await fetch("/api/admin/logs/recent");
      if (response.ok) {
        const data = await response.json();
        setRecentLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch recent logs:", error);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      user_created: "Создан пользователь",
      user_updated: "Обновлен пользователь",
      user_deleted: "Удален пользователь",
      workspace_created: "Создано рабочее место",
      workspace_updated: "Обновлено рабочее место",
      workspace_deleted: "Удалено рабочее место",
      booking_updated: "Обновлено бронирование",
      review_deleted: "Удален отзыв",
    };
    return labels[action] || action;
  };

  const statCards = [
    {
      title: "Пользователи",
      value: stats.totalUsers,
      icon: Users,
      link: "/admin/users",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Рабочие места",
      value: stats.totalWorkspaces,
      icon: MapPin,
      link: "/admin/workspaces",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Бронирования",
      value: stats.totalBookings,
      icon: Calendar,
      link: "/admin/bookings",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Отзывы",
      value: stats.totalReviews,
      icon: MessageSquare,
      link: "/admin/reviews",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Активные бронирования",
      value: stats.activeBookings,
      icon: TrendingUp,
      link: "/admin/bookings",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      title: "Общий доход",
      value: `${stats.totalRevenue.toLocaleString()} ₽`,
      icon: DollarSign,
      link: "/admin/bookings",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Панель администратора</h1>
        <p className="text-gray-600 mt-2">Управление системой бьюти-коворкинга</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.link}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>Основные операции управления</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/workspaces/new">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                + Добавить рабочее место
              </button>
            </Link>
            <Link href="/admin/users">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                👥 Управление пользователями
              </button>
            </Link>
            <Link href="/admin/reviews">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                ⭐ Модерация отзывов
              </button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Последние действия</CardTitle>
            <CardDescription>Недавняя активность в системе</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="text-sm text-gray-600">
                <p>Нет недавних действий</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{getActionLabel(log.action)}</p>
                      <p className="text-gray-600 text-xs">
                        {log.adminName} • {new Date(log.createdAt).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
