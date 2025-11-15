import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function PaymentMethods() {
  const [, setLocation] = useLocation();

  const paymentMethods = [
    { id: 1, type: "card", last4: "4242", brand: "Visa", isDefault: true },
    { id: 2, type: "card", last4: "5555", brand: "Mastercard", isDefault: false }
  ];

  const handleAddCard = () => {
    toast.success("Добавление новой карты");
  };

  const handleRemoveCard = (last4: string) => {
    toast.success(`Карта **** ${last4} удалена`);
  };

  const handleSetDefault = (last4: string) => {
    toast.success(`Карта **** ${last4} установлена по умолчанию`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/profile")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <h1 className="text-3xl font-bold mb-6">Способы оплаты</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Добавить новую карту</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAddCard} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Добавить карту
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Сохраненные карты</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {paymentMethods.map((method, index) => (
              <div
                key={method.id}
                className={`flex items-center justify-between p-4 ${
                  index !== paymentMethods.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {method.brand} •••• {method.last4}
                    </p>
                    {method.isDefault && (
                      <p className="text-sm text-primary">По умолчанию</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.last4)}
                    >
                      Сделать основной
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCard(method.last4)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
