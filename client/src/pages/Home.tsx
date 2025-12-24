import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Calendar, DollarSign, MapPin, Star, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: stats } = trpc.stats.getUserStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: workspaces } = trpc.workspaces.getAll.useQuery();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Добро пожаловать в {APP_TITLE}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Профессиональное пространство для специалистов индустрии красоты. 
              Арендуйте рабочее место по часам или на весь день.
            </p>
            <Button
              size="lg"
              className="bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary hover:shadow-primary-hover transition-all-smooth text-lg px-8 py-6"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Войти в систему
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all-smooth hover:-translate-y-1 bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Удобное расположение</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Современные рабочие места в центре города с отличной транспортной доступностью
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all-smooth hover:-translate-y-1 bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Гибкая аренда</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Бронируйте рабочее место на час, день или более длительный период
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all-smooth hover:-translate-y-1 bg-card">
              <CardHeader>
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-foreground">Профессиональное оборудование</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Все необходимое для комфортной работы: зеркала, освещение, стерилизаторы
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Workspaces Preview */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Наши рабочие места
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {workspaces?.slice(0, 3).map((workspace) => (
                <Card key={workspace.id} className="border-0 shadow-lg hover:shadow-xl transition-all-smooth hover:-translate-y-1 overflow-hidden bg-card">
                  <img
                    src={workspace.imageUrl || ""}
                    alt={workspace.name}
                    className="w-full h-48 object-cover"
                  />
                  <CardHeader>
                    <CardTitle className="text-foreground">{workspace.name}</CardTitle>
                    <CardDescription className="text-muted-foreground line-clamp-2">
                      {workspace.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="text-sm font-semibold text-foreground">
                          {Number(workspace.rating || 0).toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({workspace.reviewCount})
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {workspace.pricePerHour} ₽
                        </div>
                        <div className="text-xs text-muted-foreground">за час</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Добро пожаловать, {user?.name || "Пользователь"}!
          </h1>
          <p className="text-muted-foreground">
            Управляйте своими бронированиями и отслеживайте статистику
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Всего бронирований
                </CardTitle>
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats?.totalBookings || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Активные
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats?.activeBookings || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Завершенные
                </CardTitle>
                <Star className="w-5 h-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats?.completedBookings || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Баланс
                </CardTitle>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {(stats?.balance || 0)} ₽
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Быстрые действия</h2>
          <p className="text-muted-foreground mb-6">Начните работу с бьюти-коворкингом</p>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/workspaces">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-xl hover:-translate-y-1 transition-all-smooth cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">Рабочие места</h3>
                      <p className="text-sm text-muted-foreground">Просмотреть доступные пространства</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/bookings">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-accent/30 to-accent/10 hover:shadow-xl hover:-translate-y-1 transition-all-smooth cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="w-8 h-8 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">Мои бронирования</h3>
                      <p className="text-sm text-muted-foreground">Управление записями</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/finances">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-warning/20 to-warning/5 hover:shadow-xl hover:-translate-y-1 transition-all-smooth cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-warning rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <DollarSign className="w-8 h-8 text-warning-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">Финансы</h3>
                      <p className="text-sm text-muted-foreground">Баланс и транзакции</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Popular Workspaces */}
        <div>
          <Card className="border-0 shadow-lg bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Популярные места</CardTitle>
              <CardDescription className="text-muted-foreground">
                Рабочие места с лучшими отзывами
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workspaces?.slice(0, 3).map((workspace) => (
                <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-all-smooth cursor-pointer">
                    <img
                      src={workspace.imageUrl || ""}
                      alt={workspace.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {workspace.name}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-3 h-3 fill-warning text-warning" />
                        <span className="text-foreground font-medium">
                          {Number(workspace.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {workspace.pricePerHour} ₽
                      </div>
                      <div className="text-xs text-muted-foreground">час</div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
