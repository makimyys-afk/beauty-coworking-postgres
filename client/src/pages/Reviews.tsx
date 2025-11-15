import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Star } from "lucide-react";
import { Link } from "wouter";

export default function Reviews() {
  const { user, loading, isAuthenticated } = useAuth();
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>
              Войдите в систему, чтобы просматривать отзывы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Отзывы</h1>
          <p className="text-muted-foreground">
            Ваши отзывы о рабочих местах помогают другим специалистам сделать правильный выбор
          </p>
        </div>

        {/* Reviews by Workspace */}
        <div className="space-y-6">
          {workspaces?.map((workspace) => (
            <Card key={workspace.id} className="border-0 shadow-lg bg-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      {workspace.name}
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-warning text-warning" />
                        <span className="text-lg font-bold text-foreground">
                          {Number(workspace.rating || 0).toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({workspace.reviewCount} отзывов)
                        </span>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      {workspace.description}
                    </CardDescription>
                  </div>
                  <Link href={`/workspaces/${workspace.id}`}>
                    <Button variant="outline" size="sm">
                      Подробнее
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ReviewsList workspaceId={workspace.id} />
              </CardContent>
            </Card>
          ))}
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
