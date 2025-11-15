import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Star, Gift } from "lucide-react";

interface StatusInfo {
  name: string;
  minPoints: number;
  maxPoints: number | null;
  discount: number;
  color: string;
  benefits: string[];
}

const STATUSES: StatusInfo[] = [
  {
    name: "Bronze",
    minPoints: 0,
    maxPoints: 749,
    discount: 0,
    color: "bg-amber-700",
    benefits: [
      "Доступ ко всем рабочим местам",
      "Стандартные цены",
      "Поддержка клиентов"
    ]
  },
  {
    name: "Silver",
    minPoints: 750,
    maxPoints: 1499,
    discount: 5,
    color: "bg-gray-400",
    benefits: [
      "Скидка 5% на все бронирования",
      "Приоритетное бронирование",
      "Ежемесячный бонус 100₽"
    ]
  },
  {
    name: "Gold",
    minPoints: 1500,
    maxPoints: 2999,
    discount: 10,
    color: "bg-yellow-500",
    benefits: [
      "Скидка 10% на все бронирования",
      "Доступ к премиум местам",
      "Ежемесячный бонус 250₽",
      "Бесплатная отмена за 24 часа"
    ]
  },
  {
    name: "Platinum",
    minPoints: 3000,
    maxPoints: null,
    discount: 15,
    color: "bg-purple-600",
    benefits: [
      "Скидка 15% на все бронирования",
      "VIP доступ ко всем местам",
      "Ежемесячный бонус 500₽",
      "Бесплатная отмена в любое время",
      "Персональный менеджер",
      "Эксклюзивные предложения"
    ]
  }
];

export default function StatusPage() {
  const [userPoints, setUserPoints] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<StatusInfo>(STATUSES[0]);
  const [nextStatus, setNextStatus] = useState<StatusInfo | null>(STATUSES[1]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStatus();
  }, []);

  const fetchUserStatus = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        const points = data.user?.points || 0;
        setUserPoints(points);
        
        // Определяем текущий статус
        const status = STATUSES.find(s => 
          points >= s.minPoints && (s.maxPoints === null || points <= s.maxPoints)
        ) || STATUSES[0];
        setCurrentStatus(status);
        
        // Определяем следующий статус
        const statusIndex = STATUSES.indexOf(status);
        setNextStatus(statusIndex < STATUSES.length - 1 ? STATUSES[statusIndex + 1] : null);
      }
    } catch (error) {
      console.error("Failed to fetch user status:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressToNextStatus = () => {
    if (!nextStatus) return 100;
    const range = nextStatus.minPoints - currentStatus.minPoints;
    const progress = userPoints - currentStatus.minPoints;
    return Math.min((progress / range) * 100, 100);
  };

  const getPointsToNextStatus = () => {
    if (!nextStatus) return 0;
    return Math.max(nextStatus.minPoints - userPoints, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Загрузка...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Система статусов</h1>
          <p className="text-gray-600">
            Зарабатывайте баллы и получайте эксклюзивные преимущества
          </p>
        </div>

        {/* Текущий статус */}
        <Card className="border-2 border-pink-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  Ваш текущий статус
                </CardTitle>
                <CardDescription>
                  У вас {userPoints} {userPoints === 1 ? 'балл' : userPoints < 5 ? 'балла' : 'баллов'}
                </CardDescription>
              </div>
              <Badge className={`${currentStatus.color} text-white text-lg px-4 py-2`}>
                {currentStatus.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextStatus && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Прогресс до статуса {nextStatus.name}
                  </span>
                  <span className="font-medium">
                    {getPointsToNextStatus()} {getPointsToNextStatus() === 1 ? 'балл' : getPointsToNextStatus() < 5 ? 'балла' : 'баллов'} до следующего уровня
                  </span>
                </div>
                <Progress value={getProgressToNextStatus()} className="h-3" />
              </div>
            )}
            
            <div className="bg-pink-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-pink-900 font-medium">
                <Star className="w-5 h-5" />
                Ваши преимущества:
              </div>
              <ul className="space-y-1 ml-7">
                {currentStatus.benefits.map((benefit, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    • {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Как зарабатывать баллы */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Как зарабатывать баллы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-3 p-3 bg-green-50 rounded-lg">
                <Gift className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-green-900">Бронирования</div>
                  <div className="text-sm text-green-700">
                    1 балл за каждые 100₽ потраченных на бронирования
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900">Отзывы</div>
                  <div className="text-sm text-blue-700">
                    10 баллов за каждый оставленный отзыв
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-purple-50 rounded-lg">
                <Award className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-purple-900">Регулярность</div>
                  <div className="text-sm text-purple-700">
                    Бонус 50 баллов за 5 бронирований в месяц
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-orange-50 rounded-lg">
                <Gift className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-orange-900">Акции</div>
                  <div className="text-sm text-orange-700">
                    Участвуйте в специальных акциях и получайте бонусы
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Все статусы */}
        <Card>
          <CardHeader>
            <CardTitle>Все статусы</CardTitle>
            <CardDescription>
              Повышайте свой статус и получайте больше преимуществ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATUSES.map((status, index) => (
                <div
                  key={status.name}
                  className={`p-4 rounded-lg border-2 ${
                    status.name === currentStatus.name
                      ? 'border-pink-400 bg-pink-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${status.color} text-white`}>
                        {status.name}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {status.minPoints} - {status.maxPoints || '∞'} баллов
                      </div>
                    </div>
                    {status.discount > 0 && (
                      <div className="text-sm font-medium text-green-600">
                        Скидка {status.discount}%
                      </div>
                    )}
                  </div>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {status.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
