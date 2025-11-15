import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Finances() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: balance } = trpc.transactions.getUserBalance.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: transactions, isLoading } = trpc.transactions.getUserTransactions.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const income = transactions?.filter(t => t.type === "deposit" || t.type === "refund")
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  
  const expenses = transactions?.filter(t => t.type === "payment" || t.type === "withdrawal")
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  const pendingInvoices = transactions?.filter(
    (t) => (t.type === "payment" || t.type === "withdrawal") && t.status === "pending"
  ) || [];

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Пополнение баланса";
      case "refund":
        return "Возврат за отмену";
      case "payment":
        return "Оплата бронирования";
      case "withdrawal":
        return "Вывод средств";
      default:
        return type;
    }
  };

  const handleTopUp = () => {
    toast.info("Функция пополнения баланса в разработке");
  };

  const handlePayInvoice = (invoiceId: number) => {
    toast.info(`Оплата счета #${invoiceId} в разработке`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-2">Финансы</h1>
          <p className="text-muted-foreground">
            Управляйте своими финансами и транзакциями
          </p>
        </div>

        {/* Balance Card */}
        <Card className="border-0 shadow-xl bg-primary-gradient p-6 mb-6 text-white animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6" />
            <p className="text-white/80">Текущий баланс</p>
          </div>
          <h2 className="text-4xl font-bold mb-6">
            {((balance || 0) / 100).toFixed(0)} ₽
          </h2>
          <Button
            onClick={handleTopUp}
            className="w-full bg-white text-primary hover:bg-white/90 h-12 rounded-xl font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Пополнить баланс
          </Button>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 animate-fade-in-up">
          <Card className="border-0 shadow-lg p-5 bg-card hover:shadow-xl transition-all-smooth">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                Доход
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {income}₽
            </p>
            <p className="text-xs text-muted-foreground mt-1">за месяц</p>
          </Card>

          <Card className="border-0 shadow-lg p-5 bg-card hover:shadow-xl transition-all-smooth">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-error/10 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-error" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                Расход
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {expenses}₽
            </p>
            <p className="text-xs text-muted-foreground mt-1">за месяц</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="animate-fade-in-up">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted p-1 rounded-xl h-12">
            <TabsTrigger
              value="transactions"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-medium"
            >
              История операций
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-medium relative"
            >
              Счета
              {pendingInvoices.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingInvoices.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-3">
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className="border-0 shadow-md hover:shadow-lg transition-all-smooth p-4 bg-card"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        transaction.type === "deposit" || transaction.type === "refund"
                          ? "bg-success/10"
                          : "bg-error/10"
                      }`}
                    >
                      {transaction.type === "deposit" || transaction.type === "refund" ? (
                        <ArrowUpRight className="w-6 h-6 text-success" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-error" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-semibold truncate">
                            {getTransactionLabel(transaction.type)}
                          </p>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`text-lg font-bold ${
                              transaction.type === "deposit" || transaction.type === "refund"
                                ? "text-success"
                                : "text-foreground"
                            }`}
                          >
                            {transaction.type === "deposit" || transaction.type === "refund" ? "+" : "-"}
                            {transaction.amount}₽
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      {transaction.status === "pending" && (
                        <Badge className="bg-warning/10 text-warning border-warning/20 mt-2">
                          Ожидает обработки
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-lg p-8 text-center bg-card">
                <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  История транзакций пуста
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-3">
            {pendingInvoices.length > 0 ? (
              pendingInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="border-0 shadow-md hover:shadow-lg transition-all-smooth p-5 bg-card"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-foreground font-semibold mb-1">
                            {getTransactionLabel(invoice.type)}
                          </p>
                          {invoice.description && (
                            <p className="text-sm text-muted-foreground">
                              {invoice.description}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-warning/10 text-warning border-warning/20">
                          К оплате
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Оплатить до
                          </p>
                          <p className="text-sm text-foreground font-medium">
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground mb-2">
                            {invoice.amount}₽
                          </p>
                          <Button
                            onClick={() => handlePayInvoice(invoice.id)}
                            className="bg-primary hover:bg-primary/90 text-white h-9 px-6 rounded-lg font-medium"
                          >
                            Оплатить
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="border-0 shadow-lg p-8 text-center bg-card">
                <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Нет неоплаченных счетов</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
