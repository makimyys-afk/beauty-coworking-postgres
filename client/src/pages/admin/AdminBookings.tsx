import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Booking {
  id: number;
  workspaceId: number;
  workspaceName: string;
  userId: number;
  userName: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
}

const statusOptions = [
  { value: "pending", label: "Ожидает", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Подтверждено", color: "bg-blue-100 text-blue-800" },
  { value: "cancelled", label: "Отменено", color: "bg-red-100 text-red-800" },
  { value: "completed", label: "Завершено", color: "bg-green-100 text-green-800" },
];

const paymentStatusOptions = [
  { value: "pending", label: "Ожидает", color: "bg-yellow-100 text-yellow-800" },
  { value: "paid", label: "Оплачено", color: "bg-green-100 text-green-800" },
  { value: "refunded", label: "Возврат", color: "bg-gray-100 text-gray-800" },
];

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/bookings");
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Ошибка загрузки бронирований");
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success("Статус обновлен");
        fetchBookings();
      } else {
        toast.error("Ошибка обновления статуса");
      }
    } catch (error) {
      console.error("Failed to update booking status:", error);
      toast.error("Ошибка обновления статуса");
    }
  };

  const updatePaymentStatus = async (bookingId: number, paymentStatus: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });

      if (response.ok) {
        toast.success("Статус оплаты обновлен");
        fetchBookings();
      } else {
        toast.error("Ошибка обновления статуса оплаты");
      }
    } catch (error) {
      console.error("Failed to update payment status:", error);
      toast.error("Ошибка обновления статуса оплаты");
    }
  };

  const getStatusColor = (status: string, options: typeof statusOptions) => {
    return options.find((opt) => opt.value === status)?.color || "bg-gray-100 text-gray-800";
  };

  const filteredBookings = filterStatus === "all"
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Управление бронированиями</CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все бронирования</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Показано: {filteredBookings.length} из {bookings.length}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Место</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Начало</TableHead>
                  <TableHead>Конец</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Оплата</TableHead>
                  <TableHead>Примечания</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.id}</TableCell>
                    <TableCell>{booking.workspaceName}</TableCell>
                    <TableCell>{booking.userName}</TableCell>
                    <TableCell>
                      {new Date(booking.startTime).toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell>
                      {new Date(booking.endTime).toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell>{booking.totalPrice} ₽</TableCell>
                    <TableCell>
                      <Select
                        value={booking.status}
                        onValueChange={(value) =>
                          updateBookingStatus(booking.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                booking.status,
                                statusOptions
                              )}`}
                            >
                              {statusOptions.find((s) => s.value === booking.status)
                                ?.label}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={booking.paymentStatus}
                        onValueChange={(value) =>
                          updatePaymentStatus(booking.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(
                                booking.paymentStatus,
                                paymentStatusOptions
                              )}`}
                            >
                              {paymentStatusOptions.find(
                                (s) => s.value === booking.paymentStatus
                              )?.label}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {paymentStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{booking.notes || "—"}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
