import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { CreditCard, CheckCircle, Loader2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const presetAmounts = [500, 1000, 2000, 5000];

export function TopUpModal({ open, onOpenChange }: TopUpModalProps) {
  const [amount, setAmount] = useState('1000');
  const [qrCode, setQrCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  const utils = trpc.useUtils();
  const createTransaction = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.getUserBalance.invalidate();
      utils.transactions.getUserTransactions.invalidate();
      utils.stats.getUserStats.invalidate();
    },
  });

  // Генерировать QR код при изменении суммы
  useEffect(() => {
    if (amount && open && !isProcessing) {
      const sbpLink = `https://qr.nspk.ru/AD100004BAG7KT1IADG6P0A8UIRN4F1?type=02&amount=${amount}&currency=643&purpose=Пополнение баланса Beauty Coworking`;
      QRCode.toDataURL(sbpLink, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        width: 256,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }).then(setQrCode).catch(console.error);
    }
  }, [amount, open, isProcessing]);

  // Имитация обработки платежа
  useEffect(() => {
    if (isProcessing && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    
    if (isProcessing && timeLeft === 0 && !paymentComplete) {
      // Создаем транзакцию пополнения
      createTransaction.mutateAsync({
        type: 'deposit',
        amount: parseFloat(amount),
        description: `Пополнение баланса через СБП`,
      }).then(() => {
        setPaymentComplete(true);
        toast.success(`Баланс пополнен на ${amount}₽!`);
      }).catch((error) => {
        toast.error(error.message || 'Ошибка при пополнении');
        setIsProcessing(false);
        setTimeLeft(5);
      });
    }
  }, [isProcessing, timeLeft, amount, paymentComplete, createTransaction]);

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setIsProcessing(false);
        setPaymentComplete(false);
        setTimeLeft(5);
        setAmount('1000');
        setQrCode('');
      }, 300);
    }
  }, [open]);

  const handleTopUp = () => {
    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      toast.error('Введите сумму');
      return;
    }
    if (numAmount < 100) {
      toast.error('Минимальная сумма 100₽');
      return;
    }
    if (numAmount > 100000) {
      toast.error('Максимальная сумма 100000₽');
      return;
    }
    setIsProcessing(true);
  };

  const handleClose = () => {
    if (paymentComplete) {
      onOpenChange(false);
    } else if (isProcessing) {
      toast.error('Дождитесь завершения платежа');
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Пополнить баланс
          </DialogTitle>
        </DialogHeader>

        {!isProcessing ? (
          <div className="space-y-6 py-4">
            {/* Preset amounts */}
            <div className="space-y-2">
              <Label>Быстрый выбор суммы</Label>
              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === String(preset) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(String(preset))}
                    className={amount === String(preset) ? "bg-primary-gradient" : ""}
                  >
                    {preset}₽
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Или введите свою сумму (₽)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                min="100"
                max="100000"
                step="100"
              />
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <QrCode className="w-4 h-4" />
                  <span>Отсканируйте QR-код в приложении банка</span>
                </div>
                <img src={qrCode} alt="QR код для оплаты" className="w-48 h-48" />
                <p className="text-xs text-muted-foreground text-center">
                  Система быстрых платежей (СБП)
                </p>
              </div>
            )}

            {/* Amount display */}
            <div className="bg-accent/50 p-4 rounded-lg border text-center">
              <p className="text-sm text-muted-foreground">Сумма к оплате:</p>
              <p className="text-3xl font-bold text-primary">
                {parseFloat(amount || '0').toLocaleString('ru-RU')} ₽
              </p>
            </div>

            {/* Pay button */}
            <Button
              onClick={handleTopUp}
              className="w-full bg-primary-gradient hover:bg-primary-gradient-hover"
              size="lg"
              disabled={!amount || parseFloat(amount) < 100}
            >
              Оплатить через СБП
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Нажмите кнопку после сканирования QR-кода и подтверждения оплаты в приложении банка
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-8 text-center">
            {!paymentComplete ? (
              <>
                <div className="flex justify-center">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Обработка платежа...</p>
                  <p className="text-muted-foreground">Пожалуйста, подождите</p>
                </div>
                <div className="text-4xl font-bold text-primary">
                  {timeLeft}
                </div>
                <p className="text-sm text-muted-foreground">
                  Проверяем поступление средств
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-semibold text-green-600">Платеж успешен!</p>
                  <p className="text-muted-foreground mt-2">
                    Баланс пополнен на {parseFloat(amount).toLocaleString('ru-RU')}₽
                  </p>
                </div>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="bg-primary-gradient hover:bg-primary-gradient-hover"
                >
                  Закрыть
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
