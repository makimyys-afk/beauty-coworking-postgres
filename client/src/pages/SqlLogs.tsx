import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Database, Clock, User, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function SqlLogs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [limit, setLimit] = useState(100);

  const { data: logs, isLoading, error } = trpc.logs.getSqlLogs.useQuery(
    { limit },
    {
      enabled: user?.role === "admin",
    }
  );

  // Если пользователь не администратор, перенаправляем на главную
  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-error bg-card">
            <CardHeader>
              <CardTitle className="text-error flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Ошибка доступа
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                У вас нет прав для просмотра логов SQL-запросов
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case "SELECT":
        return "bg-info text-white";
      case "INSERT":
        return "bg-success text-white";
      case "UPDATE":
        return "bg-warning text-white";
      case "DELETE":
        return "bg-error text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getExecutionTimeColor = (time: number | null) => {
    if (!time) return "text-muted-foreground";
    if (time < 100) return "text-success";
    if (time < 500) return "text-warning";
    return "text-error";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              SQL Логи
            </h1>
          </div>
          <p className="text-muted-foreground">
            Мониторинг всех SQL-запросов к базе данных в реальном времени
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Всего запросов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {logs?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                SELECT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-info">
                {logs?.filter((l) => l.operation === "SELECT").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                INSERT/UPDATE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {logs?.filter((l) => l.operation === "INSERT" || l.operation === "UPDATE").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                С ошибками
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-error">
                {logs?.filter((l) => l.error).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          <Button
            variant={limit === 50 ? "default" : "outline"}
            onClick={() => setLimit(50)}
            className={
              limit === 50
                ? "bg-primary-gradient hover:bg-primary-gradient-hover text-white"
                : "border-border hover:bg-accent"
            }
          >
            50 записей
          </Button>
          <Button
            variant={limit === 100 ? "default" : "outline"}
            onClick={() => setLimit(100)}
            className={
              limit === 100
                ? "bg-primary-gradient hover:bg-primary-gradient-hover text-white"
                : "border-border hover:bg-accent"
            }
          >
            100 записей
          </Button>
          <Button
            variant={limit === 200 ? "default" : "outline"}
            onClick={() => setLimit(200)}
            className={
              limit === 200
                ? "bg-primary-gradient hover:bg-primary-gradient-hover text-white"
                : "border-border hover:bg-accent"
            }
          >
            200 записей
          </Button>
        </div>

        {/* Logs List */}
        <div className="space-y-4">
          {logs?.map((log) => (
            <Card
              key={log.id}
              className={`border-0 shadow-md hover:shadow-lg transition-all-smooth bg-card ${
                log.error ? "border-l-4 border-l-error" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge className={getOperationColor(log.operation)}>
                      {log.operation}
                    </Badge>
                    {log.endpoint && (
                      <span className="text-sm text-muted-foreground truncate">
                        {log.endpoint}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {log.userId && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>ID: {log.userId}</span>
                      </div>
                    )}
                    {log.executionTime !== null && (
                      <div className={`flex items-center gap-1 font-semibold ${getExecutionTimeColor(log.executionTime)}`}>
                        <Clock className="w-4 h-4" />
                        <span>{log.executionTime}ms</span>
                      </div>
                    )}
                    {log.error ? (
                      <AlertCircle className="w-5 h-5 text-error" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-success" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Query */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    SQL ЗАПРОС:
                  </div>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto text-foreground font-mono">
                    {log.query}
                  </pre>
                </div>

                {/* Parameters */}
                {log.params && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1">
                      ПАРАМЕТРЫ:
                    </div>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto text-foreground font-mono">
                      {log.params}
                    </pre>
                  </div>
                )}

                {/* Error */}
                {log.error && (
                  <div>
                    <div className="text-xs font-semibold text-error mb-1">
                      ОШИБКА:
                    </div>
                    <pre className="bg-error/10 border border-error p-3 rounded-lg text-xs overflow-x-auto text-error font-mono">
                      {log.error}
                    </pre>
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Время: {new Date(log.createdAt).toLocaleString("ru-RU")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {logs?.length === 0 && (
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="py-16 text-center">
              <Database className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Логи не найдены
              </h3>
              <p className="text-muted-foreground">
                SQL-запросы будут отображаться здесь по мере их выполнения
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
