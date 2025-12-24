import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Workspace {
  id: number;
  name: string;
  description: string | null;
  type: string;
  pricePerHour: number;
  pricePerDay: number;
  imageUrl: string | null;
  isAvailable: boolean;
  rating: string;
  reviewCount: number;
}

const workspaceTypes = [
  { value: "hairdresser", label: "Парикмахерская" },
  { value: "makeup", label: "Визаж" },
  { value: "manicure", label: "Маникюр" },
  { value: "cosmetology", label: "Косметология" },
  { value: "massage", label: "Массаж" },
];

export default function AdminWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Partial<Workspace> | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/admin/workspaces");
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
      toast.error("Ошибка загрузки рабочих мест");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingWorkspace({
      name: "",
      description: "",
      type: "hairdresser",
      pricePerHour: 0,
      pricePerDay: 0,
      imageUrl: "",
      isAvailable: true,
    });
    setShowDialog(true);
  };

  const handleEdit = (workspace: Workspace) => {
    setIsCreating(false);
    setEditingWorkspace({ ...workspace });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!editingWorkspace) return;

    try {
      const url = isCreating
        ? "/api/admin/workspaces"
        : `/api/admin/workspaces/${editingWorkspace.id}`;
      const method = isCreating ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingWorkspace),
      });

      if (response.ok) {
        toast.success(
          isCreating ? "Рабочее место создано" : "Рабочее место обновлено"
        );
        fetchWorkspaces();
        setShowDialog(false);
      } else {
        toast.error("Ошибка сохранения");
      }
    } catch (error) {
      console.error("Failed to save workspace:", error);
      toast.error("Ошибка сохранения");
    }
  };

  const handleDelete = (workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!workspaceToDelete) return;

    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Рабочее место удалено");
        fetchWorkspaces();
        setShowDeleteDialog(false);
      } else {
        toast.error("Ошибка удаления");
      }
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      toast.error("Ошибка удаления");
    }
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
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Управление рабочими местами</CardTitle>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить место
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <Card key={workspace.id} className="overflow-hidden">
                {workspace.imageUrl && (
                  <img
                    src={workspace.imageUrl}
                    alt={workspace.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2">{workspace.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {workspace.description}
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Тип:</strong>{" "}
                      {workspaceTypes.find((t) => t.value === workspace.type)?.label}
                    </p>
                    <p>
                      <strong>Цена:</strong> {workspace.pricePerHour}₽/час,{" "}
                      {workspace.pricePerDay}₽/день
                    </p>
                    <p>
                      <strong>Рейтинг:</strong> {workspace.rating} ⭐ (
                      {workspace.reviewCount} отзывов)
                    </p>
                    <p>
                      <strong>Статус:</strong>{" "}
                      <span
                        className={
                          workspace.isAvailable
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {workspace.isAvailable ? "Доступно" : "Недоступно"}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(workspace)}
                      className="flex-1"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Изменить
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(workspace)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Создать рабочее место" : "Редактировать рабочее место"}
            </DialogTitle>
          </DialogHeader>
          {editingWorkspace && (
            <div className="space-y-4">
              <div>
                <Label>Название</Label>
                <Input
                  value={editingWorkspace.name || ""}
                  onChange={(e) =>
                    setEditingWorkspace({ ...editingWorkspace, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea
                  value={editingWorkspace.description || ""}
                  onChange={(e) =>
                    setEditingWorkspace({
                      ...editingWorkspace,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label>Тип</Label>
                <Select
                  value={editingWorkspace.type}
                  onValueChange={(value) =>
                    setEditingWorkspace({ ...editingWorkspace, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Цена за час (₽)</Label>
                  <Input
                    type="number"
                    value={editingWorkspace.pricePerHour || 0}
                    onChange={(e) =>
                      setEditingWorkspace({
                        ...editingWorkspace,
                        pricePerHour: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Цена за день (₽)</Label>
                  <Input
                    type="number"
                    value={editingWorkspace.pricePerDay || 0}
                    onChange={(e) =>
                      setEditingWorkspace({
                        ...editingWorkspace,
                        pricePerDay: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>URL изображения</Label>
                <Input
                  value={editingWorkspace.imageUrl || ""}
                  onChange={(e) =>
                    setEditingWorkspace({
                      ...editingWorkspace,
                      imageUrl: e.target.value,
                    })
                  }
                  placeholder="/workspace-1.jpg"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={editingWorkspace.isAvailable}
                  onChange={(e) =>
                    setEditingWorkspace({
                      ...editingWorkspace,
                      isAvailable: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="isAvailable">Доступно для бронирования</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить рабочее место{" "}
              <strong>{workspaceToDelete?.name}</strong>?
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
