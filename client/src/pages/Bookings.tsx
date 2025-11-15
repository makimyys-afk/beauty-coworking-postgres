import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, MapPin, AlertCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Bookings() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: bookings, isLoading } = trpc.bookings.getUserBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-success text-white">Подтверждено</Badge>;
      case "pending":
        return <Badge className="bg-warning text-white">Ожидает</Badge>;
      case "cancelled":
        return <Badge className="bg-error text-white">Отменено</Badge>;
      case "completed":
        return <Badge className="bg-info text-white">Завершено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-white">Оплачено</Badge>;
      case "pending":
        return <Badge className="bg-warning text-white">Ожидает оплаты</Badge>;
      case "refunded":
        return <Badge className="bg-info text-white">Возврат</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Мои бронирования
          </h1>
          <p className="text-muted-foreground">
            Управляйте своими бронированиями рабочих мест
          </p>
        </div>

        {/* Bookings List */}
        {bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all-smooth bg-card"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-foreground mb-2">
                        Бронирование #{booking.id}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Рабочее место ID: {booking.workspaceId}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(booking.status)}
                      {getPaymentStatusBadge(booking.paymentStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date and Time */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 bg-accent rounded-lg">
                      <Calendar className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-1">
                          Дата
                        </div>
                        <div className="text-foreground font-medium">
                          {formatDate(booking.startTime)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-accent rounded-lg">
                      <Clock className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-1">
                          Время
                        </div>
                        <div className="text-foreground font-medium">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm font-semibold text-muted-foreground mb-1">
                        Заметки
                      </div>
                      <div className="text-foreground">{booking.notes}</div>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-muted-foreground">Стоимость</div>
                    <div className="text-2xl font-bold text-primary">
                      {booking.totalPrice} ₽
                    </div>
                  </div>

                  {/* Actions */}
                  <Button
                    onClick={() => setLocation(`/bookings/${booking.id}`)}
                    className="w-full bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary"
                  >
                    Подробнее и QR-код
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="py-16 text-center">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                У вас пока нет бронирований
              </h3>
              <p className="text-muted-foreground mb-6">
                Выберите подходящее рабочее место и создайте первое бронирование
              </p>
              <Button
                onClick={() => setLocation("/workspaces")}
                className="bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Посмотреть рабочие места
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
