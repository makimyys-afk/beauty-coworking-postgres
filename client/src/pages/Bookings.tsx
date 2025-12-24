import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, MapPin, AlertCircle, ArrowRight, X, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Bookings() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Модальное окно переноса
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");

  const utils = trpc.useUtils();
  
  const { data: bookings, isLoading } = trpc.bookings.getUserBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cancelBooking = trpc.bookings.cancelBooking.useMutation({
    onSuccess: (data) => {
      utils.bookings.getUserBookings.invalidate();
      utils.transactions.getUserBalance.invalidate();
      utils.transactions.getUserTransactions.invalidate();
      if (data.refunded) {
        toast.success("Бронирование отменено, средства возвращены на баланс");
      } else {
        toast.success("Бронирование отменено");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rescheduleBooking = trpc.bookings.rescheduleBooking.useMutation({
    onSuccess: () => {
      utils.bookings.getUserBookings.invalidate();
      toast.success("Бронирование успешно перенесено");
      setRescheduleModalOpen(false);
      setSelectedBooking(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Wait for auth to load before redirecting
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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

  const handleCancel = (booking: any) => {
    if (confirm("Вы уверены, что хотите отменить бронирование? Средства будут возвращены на баланс.")) {
      cancelBooking.mutate({ bookingId: booking.id });
    }
  };

  const handleReschedule = (booking: any) => {
    setSelectedBooking(booking);
    // Установить текущую дату бронирования
    const bookingDate = new Date(booking.startTime);
    setNewDate(bookingDate.toISOString().split("T")[0]);
    setNewStartTime(bookingDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    const endDate = new Date(booking.endTime);
    setNewEndTime(endDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
    setRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = () => {
    if (!newDate || !newStartTime || !newEndTime || !selectedBooking) {
      toast.error("Заполните все поля");
      return;
    }

    const startDateTime = new Date(`${newDate}T${newStartTime}`);
    const endDateTime = new Date(`${newDate}T${newEndTime}`);

    if (endDateTime <= startDateTime) {
      toast.error("Время окончания должно быть позже времени начала");
      return;
    }

    if (startDateTime < new Date()) {
      toast.error("Нельзя перенести на прошедшую дату");
      return;
    }

    rescheduleBooking.mutate({
      bookingId: selectedBooking.id,
      startTime: startDateTime,
      endTime: endDateTime,
    });
  };

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

  const canModifyBooking = (booking: any) => {
    return booking.status !== "completed" && booking.status !== "cancelled";
  };

  const today = new Date().toISOString().split("T")[0];

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
                        {booking.workspaceName || `Бронирование #${booking.id}`}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {booking.workspaceType ? `Тип: ${booking.workspaceType}` : `ID: ${booking.workspaceId}`}
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => setLocation(`/bookings/${booking.id}`)}
                      className="flex-1 bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary"
                    >
                      Подробнее и QR-код
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    
                    {canModifyBooking(booking) && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleReschedule(booking)}
                          disabled={rescheduleBooking.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Перенести
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleCancel(booking)}
                          disabled={cancelBooking.isPending}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Отменить
                        </Button>
                      </>
                    )}
                  </div>
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

      {/* Reschedule Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Перенести бронирование
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newDate">Новая дата</Label>
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={today}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newStartTime">Начало</Label>
                <Input
                  id="newStartTime"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  min="08:00"
                  max="21:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEndTime">Окончание</Label>
                <Input
                  id="newEndTime"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  min="09:00"
                  max="22:00"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setRescheduleModalOpen(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleRescheduleSubmit}
                disabled={rescheduleBooking.isPending}
                className="flex-1 bg-primary-gradient"
              >
                {rescheduleBooking.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
