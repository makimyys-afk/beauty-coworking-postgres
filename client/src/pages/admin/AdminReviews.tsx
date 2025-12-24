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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Star } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: number;
  workspaceId: number;
  workspaceName: string;
  userId: number;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/admin/reviews");
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Ошибка загрузки отзывов");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (review: Review) => {
    setReviewToDelete(review);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;

    try {
      const response = await fetch(`/api/admin/reviews/${reviewToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Отзыв удален");
        fetchReviews();
        setShowDeleteDialog(false);
      } else {
        toast.error("Ошибка удаления отзыва");
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Ошибка удаления отзыва");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

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
          <CardTitle className="text-2xl">Управление отзывами</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Всего отзывов: {reviews.length}
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Рабочее место</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Рейтинг</TableHead>
                <TableHead>Комментарий</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>{review.id}</TableCell>
                  <TableCell>{review.workspaceName}</TableCell>
                  <TableCell>{review.userName}</TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{review.comment || "—"}</p>
                  </TableCell>
                  <TableCell>
                    {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этот отзыв? Это действие нельзя
              отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
