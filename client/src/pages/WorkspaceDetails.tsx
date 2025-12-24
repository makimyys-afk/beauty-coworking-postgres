import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Wifi, Video, Monitor, Coffee, ArrowLeft, Calendar, Clock, Shield } from "lucide-react";
import { BookingModal } from "@/components/BookingModal";
import { useAuth } from "@/_core/hooks/useAuth";

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl?: string;
  };
}

interface Workspace {
  id: number;
  name: string;
  description: string;
  pricePerHour: number;
  pricePerDay: number;
  imageUrl: string;
  amenities: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
}

export default function WorkspaceDetails() {
  const [, params] = useRoute("/workspaces/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;
  const { user } = useAuth();
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Fetch workspace details
  const { data: workspace, isLoading: isLoadingWorkspace } = useQuery<Workspace>(
    [`workspace`, id],
    async () => {
      const res = await fetch(`/api/workspaces/${id}`);
      if (!res.ok) throw new Error("Failed to fetch workspace");
      return res.json();
    }
  );

  // Fetch reviews
  const { data: reviews, isLoading: isLoadingReviews } = useQuery<Review[]>(
    [`workspace-reviews`, id],
    async () => {
      const res = await fetch(`/api/workspaces/${id}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    }
  );

  if (isLoadingWorkspace) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  if (!workspace) {
    return <div className="min-h-screen flex items-center justify-center">Рабочее место не найдено</div>;
  }

  const displayedReviews = showAllReviews ? reviews : reviews?.slice(0, 3);

  // Helper to get icon for amenity
  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wifi")) return <Wifi className="w-4 h-4" />;
    if (lower.includes("video") || lower.includes("конференц")) return <Video className="w-4 h-4" />;
    if (lower.includes("projector") || lower.includes("проектор") || lower.includes("экран")) return <Monitor className="w-4 h-4" />;
    if (lower.includes("coffee") || lower.includes("кофе") || lower.includes("кухня")) return <Coffee className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Image */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <img
          src={workspace.imageUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"}
          alt={workspace.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={() => setLocation("/workspaces")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl font-bold mb-2">{workspace.name}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>Центр красоты, 2 этаж</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                      <Star className="w-5 h-5 fill-primary text-primary" />
                      <span className="font-bold text-primary">{Number(workspace.rating || 0).toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground mt-1">{workspace.reviewCount} отзывов</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Описание</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {workspace.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Удобства</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {workspace.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
                        {getAmenityIcon(amenity)}
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Отзывы гостей</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {displayedReviews?.map((review) => (
                  <div key={review.id} className="border-b border-border last:border-0 pb-6 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={review.user.avatarUrl} />
                          <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{review.user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "fill-warning text-warning" : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
                
                {reviews && reviews.length > 3 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setShowAllReviews(!showAllReviews)}
                  >
                    {showAllReviews ? "Свернуть отзывы" : `Показать все отзывы (${reviews.length})`}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-none shadow-lg bg-primary-gradient text-white">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/20">
                    <span className="text-white/80">Цена за час</span>
                    <span className="text-2xl font-bold">{workspace.pricePerHour} ₽</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/20">
                    <span className="text-white/80">Цена за день</span>
                    <span className="text-2xl font-bold">{workspace.pricePerDay} ₽</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-white/90">
                    <Clock className="w-5 h-5" />
                    <span>Доступно 24/7</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <Calendar className="w-5 h-5" />
                    <span>Мгновенное подтверждение</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-white text-primary hover:bg-white/90 font-bold shadow-lg"
                  onClick={() => setBookingModalOpen(true)}
                  disabled={!workspace.isAvailable}
                >
                  {workspace.isAvailable ? "Забронировать сейчас" : "Временно недоступно"}
                </Button>
                
                {!user && (
                  <p className="text-xs text-center text-white/70">
                    Для бронирования необходимо войти в систему
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BookingModal
        workspace={workspace}
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
      />
    </div>
  );
}
