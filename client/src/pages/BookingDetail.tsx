import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { MapPin, Calendar, Clock, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import QRCode from "qrcode";
import { toast } from "sonner";

export default function BookingDetail() {
  const [, params] = useRoute("/bookings/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const bookingId = params?.id ? parseInt(params.id) : 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  const { data: bookings, isLoading } = trpc.bookings.getUserBookings.useQuery(undefined, {
    enabled: !!user,
  });

  const cancelBookingMutation = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Бронирование отменено");
      setLocation("/bookings");
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const booking = bookings?.find((b) => b.id === bookingId);

  useEffect(() => {
    if (booking && canvasRef.current && !qrGenerated) {
      const qrData = JSON.stringify({
        bookingId: booking.id,
        workspaceId: booking.workspaceId,
        userId: user?.id,
        date: booking.startTime,
      });

      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then(() => setQrGenerated(true))
        .catch((err) => console.error("QR generation error:", err));
    }
  }, [booking, user, qrGenerated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Бронирование не найдено
          </h1>
          <p className="text-muted-foreground mb-8">
            Запрошенное бронирование не существует или было удалено
          </p>
          <Button onClick={() => setLocation("/bookings")}>
            Вернуться к бронированиям
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (start: Date, end: Date) => {
    const startTime = new Date(start).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = new Date(end).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${startTime} - ${endTime}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Подтверждено
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Ожидает
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-muted text-muted-foreground border-border">
            <CheckCircle className="w-3 h-3 mr-1" />
            Завершено
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-error/10 text-error border-error/20">
            <XCircle className="w-3 h-3 mr-1" />
            Отменено
          </Badge>
        );
      default:
        return null;
    }
  };

  const canCancel = booking.status === "pending" || booking.status === "confirmed";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/bookings")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Назад
          </Button>
          {getStatusBadge(booking.status)}
        </div>

        {/* Success Message for confirmed bookings */}
        {(booking.status === "confirmed" || booking.status === "pending") && (
          <div className="mb-6 p-6 bg-success/5 border border-success/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Бронирование {booking.status === "confirmed" ? "подтверждено" : "создано"}!
                </h3>
                <p className="text-sm text-muted-foreground">
                  {booking.status === "confirmed" 
                    ? "Ваше рабочее место успешно забронировано"
                    : "Ожидает подтверждения администратора"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Card */}
        {(booking.status === "confirmed" || booking.status === "pending") && (
          <Card className="border-0 shadow-xl p-6 mb-6 bg-card">
            <div className="flex flex-col items-center">
              <canvas
                ref={canvasRef}
                className="mb-4 rounded-2xl bg-white p-4 shadow-md"
              />
              <p className="text-sm text-muted-foreground text-center">
                Покажите этот код на входе
              </p>
            </div>
          </Card>
        )}

        {/* Booking Details */}
        <Card className="border-0 shadow-lg p-6 mb-6 bg-card">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Детали бронирования
          </h3>

          <div className="space-y-5">
            {/* Workspace */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Место</p>
                <p className="text-lg font-medium text-foreground">
                  {booking.workspaceName}
                </p>
                {booking.workspaceType && (
                  <p className="text-sm text-muted-foreground">
                    {booking.workspaceType}
                  </p>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Дата</p>
                <p className="text-lg font-medium text-foreground">
                  {formatDate(booking.startTime)}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Время</p>
                <p className="text-lg font-medium text-foreground">
                  {formatTime(booking.startTime, booking.endTime)}
                </p>
              </div>
            </div>

            {/* Payment */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Тариф</p>
                <p className="text-lg font-medium text-foreground">
                  {booking.totalPrice} ₽
                </p>
                <p className="text-sm text-success">
                  {booking.paymentStatus === "paid" ? "Оплачено" : "Ожидает оплаты"}
                </p>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Заметки</p>
                <p className="text-foreground">{booking.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {canCancel && (
            <Button
              onClick={() => {
                if (confirm("Вы уверены, что хотите отменить бронирование?")) {
                  cancelBookingMutation.mutate({
                    bookingId: booking.id,
                    status: "cancelled",
                  });
                }
              }}
              variant="outline"
              disabled={cancelBookingMutation.isPending}
              className="flex-1 border-error text-error hover:bg-error/5"
            >
              {cancelBookingMutation.isPending ? "Отмена..." : "Отменить бронирование"}
            </Button>
          )}
          <Button
            onClick={() => setLocation("/bookings")}
            className="flex-1 bg-primary-gradient hover:bg-primary-gradient-hover text-white"
          >
            К расписанию
          </Button>
        </div>
      </div>
    </div>
  );
}
