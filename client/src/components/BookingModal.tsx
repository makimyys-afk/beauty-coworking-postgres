import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface Workspace {
  id: number;
  name: string;
  pricePerHour: string | number;
  type?: string;
}

interface BookingModalProps {
  workspace: Workspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const bookingSchema = z.object({
  startDate: z.string().min(1, 'Выберите дату'),
  startTime: z.string().min(1, 'Выберите время начала'),
  endTime: z.string().min(1, 'Выберите время окончания'),
  notes: z.string().optional(),
}).refine((data) => {
  if (!data.startDate || !data.startTime || !data.endTime) return true;
  const start = new Date(`${data.startDate}T${data.startTime}`);
  const end = new Date(`${data.startDate}T${data.endTime}`);
  return end > start;
}, {
  message: 'Время окончания должно быть позже времени начала',
  path: ['endTime'],
}).refine((data) => {
  if (!data.startDate || !data.startTime) return true;
  const start = new Date(`${data.startDate}T${data.startTime}`);
  return start > new Date();
}, {
  message: 'Нельзя забронировать на прошедшую дату',
  path: ['startDate'],
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function BookingModal({ workspace, open, onOpenChange }: BookingModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startDate: '',
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
    },
  });

  const watchedValues = watch();

  // Сброс формы при закрытии
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const utils = trpc.useUtils();
  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      utils.bookings.getUserBookings.invalidate();
      utils.transactions.getUserBalance.invalidate();
      utils.stats.getUserStats.invalidate();
    },
  });

  // Вычисляем стоимость
  const calculatePrice = () => {
    const { startDate, startTime, endTime } = watchedValues;
    if (!startDate || !startTime || !endTime || !workspace) return 0;
    
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${startDate}T${endTime}`);
    const hours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
    const pricePerHour = typeof workspace.pricePerHour === 'string' 
      ? parseFloat(workspace.pricePerHour) 
      : workspace.pricePerHour;
    
    return hours * pricePerHour;
  };

  const totalPrice = calculatePrice();

  const onSubmit = async (data: BookingFormData) => {
    if (!workspace) {
      toast.error('Рабочее место не выбрано');
      return;
    }

    const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
    const endDateTime = new Date(`${data.startDate}T${data.endTime}`);

    setIsLoading(true);
    try {
      await createBooking.mutateAsync({
        workspaceId: workspace.id,
        startTime: startDateTime,
        endTime: endDateTime,
        notes: data.notes || undefined,
      });

      toast.success('Бронирование создано успешно!');
      onOpenChange(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при создании бронирования');
    } finally {
      setIsLoading(false);
    }
  };

  // Минимальная дата - сегодня
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Забронировать {workspace?.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Дата */}
          <div className="space-y-2">
            <Label htmlFor="date">Дата бронирования</Label>
            <Input
              id="date"
              type="date"
              {...register('startDate')}
              min={today}
              className={`w-full ${errors.startDate ? 'border-red-500' : ''}`}
            />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate.message}</p>
            )}
          </div>

          {/* Время */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Начало
              </Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime')}
                min="08:00"
                max="21:00"
                className={errors.startTime ? 'border-red-500' : ''}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Окончание
              </Label>
              <Input
                id="endTime"
                type="time"
                {...register('endTime')}
                min="09:00"
                max="22:00"
                className={errors.endTime ? 'border-red-500' : ''}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Примечания */}
          <div className="space-y-2">
            <Label htmlFor="notes">Примечания (необязательно)</Label>
            <Textarea
              id="notes"
              placeholder="Дополнительная информация о бронировании..."
              {...register('notes')}
              rows={3}
            />
          </div>

          {/* Стоимость */}
          <div className="bg-accent/50 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Стоимость:</p>
                <p className="text-xs text-muted-foreground">
                  {workspace?.pricePerHour} ₽/час
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary flex items-center gap-1">
                  <CreditCard className="w-5 h-5" />
                  {totalPrice.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>

          {/* Кнопка бронирования */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Создание...
              </>
            ) : (
              'Забронировать'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
