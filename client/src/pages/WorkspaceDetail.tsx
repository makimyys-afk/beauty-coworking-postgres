import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Star, MapPin, Clock, DollarSign, Calendar, CheckCircle, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function WorkspaceDetail() {
  const [, params] = useRoute("/workspaces/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const workspaceId = params?.id ? parseInt(params.id) : 0;

  const { data: workspace, isLoading } = trpc.workspaces.getById.useQuery(
    { id: workspaceId },
    { enabled: workspaceId > 0 }
  );

  const [bookingType, setBookingType] = useState<"hour" | "day">("hour");
  const [hours, setHours] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");

  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success("Бронирование успешно создано!");
      setLocation("/bookings");
    },
    onError: (error) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Рабочее место не найдено
          </h1>
          <p className="text-muted-foreground mb-8">
            Запрошенное рабочее место не существует или было удалено
          </p>
          <Button onClick={() => setLocation("/workspaces")}>
            Вернуться к каталогу
          </Button>
        </div>
      </div>
    );
  }

  const amenities = workspace.amenities
    ? JSON.parse(workspace.amenities as string)
    : [];

  const calculatePrice = () => {
    if (bookingType === "hour") {
      return (workspace.pricePerHour * hours) / 100;
    }
    return workspace.pricePerDay / 100;
  };

  const handleBooking = () => {
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime);
    
    if (bookingType === "hour") {
      endDateTime.setHours(endDateTime.getHours() + hours);
    } else {
      endDateTime.setHours(23, 59, 59);
    }

    createBookingMutation.mutate({
      workspaceId: workspace.id,
      startTime: startDateTime,
      endTime: endDateTime,
      notes,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/workspaces")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          ← Назад к каталогу
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Workspace Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={workspace.imageUrl || ""}
                alt={workspace.name}
                className="w-full h-96 object-cover"
              />
              {workspace.isAvailable ? (
                <Badge className="absolute top-6 right-6 bg-success text-white text-lg px-4 py-2">
                  Доступно
                </Badge>
              ) : (
                <Badge className="absolute top-6 right-6 bg-error text-white text-lg px-4 py-2">
                  Занято
                </Badge>
              )}
            </div>

            {/* Workspace Info */}
            <Card className="border-0 shadow-lg bg-card">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl text-foreground mb-2">
                      {workspace.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1 bg-accent px-3 py-1 rounded-lg">
                        <Star className="w-5 h-5 fill-warning text-warning" />
                        <span className="text-lg font-semibold text-foreground">
                          {Number(workspace.rating || 0).toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({workspace.reviewCount} отзывов)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {workspace.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amenities */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    Удобства
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-accent text-accent-foreground px-4 py-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-success" />
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid md:grid-cols-2 gap-4 pt-6 border-t border-border">
                  <div className="flex items-center gap-4 p-4 bg-accent rounded-lg">
                    <Clock className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Почасовая аренда</div>
                      <div className="text-2xl font-bold text-primary">
                        {workspace.pricePerHour} ₽
                      </div>
                      <div className="text-xs text-muted-foreground">за час</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-accent rounded-lg">
                    <Calendar className="w-8 h-8 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Дневная аренда</div>
                      <div className="text-2xl font-bold text-primary">
                        {workspace.pricePerDay} ₽
                      </div>
                      <div className="text-xs text-muted-foreground">за день</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-card sticky top-24">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">
                  Забронировать
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Выберите дату и время для бронирования
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Type */}
                <div>
                  <Label className="text-foreground mb-3 block">Тип аренды</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={bookingType === "hour" ? "default" : "outline"}
                      onClick={() => setBookingType("hour")}
                      className={
                        bookingType === "hour"
                          ? "bg-primary-gradient hover:bg-primary-gradient-hover text-white"
                          : "border-border hover:bg-accent"
                      }
                    >
                      Почасовая
                    </Button>
                    <Button
                      variant={bookingType === "day" ? "default" : "outline"}
                      onClick={() => setBookingType("day")}
                      className={
                        bookingType === "day"
                          ? "bg-primary-gradient hover:bg-primary-gradient-hover text-white"
                          : "border-border hover:bg-accent"
                      }
                    >
                      Дневная
                    </Button>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <Label htmlFor="date" className="text-foreground mb-2 block">
                    Дата
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="border-border"
                  />
                </div>

                {/* Time */}
                <div>
                  <Label htmlFor="time" className="text-foreground mb-2 block">
                    Время начала
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="border-border"
                  />
                </div>

                {/* Hours (only for hourly) */}
                {bookingType === "hour" && (
                  <div>
                    <Label htmlFor="hours" className="text-foreground mb-2 block">
                      Количество часов
                    </Label>
                    <Input
                      id="hours"
                      type="number"
                      min="1"
                      max="12"
                      value={hours}
                      onChange={(e) => setHours(parseInt(e.target.value) || 1)}
                      className="border-border"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-foreground mb-2 block">
                    Заметки (необязательно)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Дополнительные пожелания..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border-border resize-none"
                    rows={3}
                  />
                </div>

                {/* Price Summary */}
                <div className="p-4 bg-accent rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Итого:</span>
                    <div className="text-3xl font-bold text-primary">
                      {calculatePrice().toFixed(0)} ₽
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {bookingType === "hour"
                      ? `${hours} час${hours > 1 ? "а" : ""}`
                      : "Полный день"}
                  </div>
                </div>

                {/* Book Button */}
                <Button
                  onClick={handleBooking}
                  disabled={!workspace.isAvailable || createBookingMutation.isPending}
                  className="w-full bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary hover:shadow-primary-hover text-lg py-6"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Бронирование...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 mr-2" />
                      Забронировать
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <Card className="border-0 shadow-lg bg-card">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Отзывы
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {workspace.reviewCount} отзывов от специалистов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewsList workspaceId={workspaceId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReviewsList({ workspaceId }: { workspaceId: number }) {
  const { data: reviews, isLoading } = trpc.reviews.getByWorkspace.useQuery({ workspaceId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Пока нет отзывов об этом месте</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border border-border rounded-lg p-4 bg-accent/5 hover:bg-accent/10 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {review.userName?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="font-semibold text-foreground">{review.userName || "Аноним"}</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "fill-warning text-warning"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          {review.comment && (
            <p className="text-foreground leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
