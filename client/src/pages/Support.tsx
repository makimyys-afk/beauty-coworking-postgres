import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  MessageCircle, 
  Mail, 
  Phone, 
  HelpCircle,
  ChevronRight 
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Support() {
  const [, setLocation] = useLocation();

  const faqItems = [
    { question: "Как забронировать рабочее место?", answer: "Перейдите в раздел 'Рабочие места', выберите подходящее место и нажмите 'Забронировать'." },
    { question: "Как пополнить баланс?", answer: "В разделе 'Финансы' нажмите кнопку 'Пополнить' и выберите удобный способ оплаты." },
    { question: "Можно ли отменить бронирование?", answer: "Да, вы можете отменить бронирование не позднее чем за 24 часа до начала." },
    { question: "Как получить золотой статус?", answer: "Накопите 500 баллов, совершая бронирования и оставляя отзывы." }
  ];

  const handleSubmit = () => {
    toast.success("Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/profile")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <h1 className="text-3xl font-bold mb-6">Центр поддержки</h1>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Онлайн-чат</h3>
              <p className="text-sm text-muted-foreground">Ответим за 5 минут</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">support@beauty.com</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Phone className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Телефон</h3>
              <p className="text-sm text-muted-foreground">8 (800) 555-35-35</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Часто задаваемые вопросы
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {faqItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      index !== faqItems.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.question}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Написать в поддержку</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject">Тема обращения</Label>
                  <Input id="subject" placeholder="Опишите проблему кратко" />
                </div>
                <div>
                  <Label htmlFor="message">Сообщение</Label>
                  <Textarea
                    id="message"
                    placeholder="Подробно опишите вашу проблему или вопрос"
                    rows={6}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  Отправить сообщение
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
