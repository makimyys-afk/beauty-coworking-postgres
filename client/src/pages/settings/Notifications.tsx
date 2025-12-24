import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Notifications() {
  const [, setLocation] = useLocation();
  
  const [settings, setSettings] = useState({
    emailBookings: true,
    emailPayments: true,
    emailPromotions: false,
    pushBookings: true,
    pushPayments: true,
    pushPromotions: false,
    smsBookings: false,
    smsPayments: true
  });

  const handleSave = () => {
    toast.success("Настройки уведомлений сохранены");
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
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

        <h1 className="text-3xl font-bold mb-6">Уведомления</h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Email уведомления</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailBookings" className="cursor-pointer">
                Бронирования
              </Label>
              <Switch
                id="emailBookings"
                checked={settings.emailBookings}
                onCheckedChange={() => toggleSetting("emailBookings")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailPayments" className="cursor-pointer">
                Платежи
              </Label>
              <Switch
                id="emailPayments"
                checked={settings.emailPayments}
                onCheckedChange={() => toggleSetting("emailPayments")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailPromotions" className="cursor-pointer">
                Акции и предложения
              </Label>
              <Switch
                id="emailPromotions"
                checked={settings.emailPromotions}
                onCheckedChange={() => toggleSetting("emailPromotions")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Push уведомления</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="pushBookings" className="cursor-pointer">
                Бронирования
              </Label>
              <Switch
                id="pushBookings"
                checked={settings.pushBookings}
                onCheckedChange={() => toggleSetting("pushBookings")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushPayments" className="cursor-pointer">
                Платежи
              </Label>
              <Switch
                id="pushPayments"
                checked={settings.pushPayments}
                onCheckedChange={() => toggleSetting("pushPayments")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pushPromotions" className="cursor-pointer">
                Акции и предложения
              </Label>
              <Switch
                id="pushPromotions"
                checked={settings.pushPromotions}
                onCheckedChange={() => toggleSetting("pushPromotions")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>SMS уведомления</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="smsBookings" className="cursor-pointer">
                Бронирования
              </Label>
              <Switch
                id="smsBookings"
                checked={settings.smsBookings}
                onCheckedChange={() => toggleSetting("smsBookings")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="smsPayments" className="cursor-pointer">
                Платежи
              </Label>
              <Switch
                id="smsPayments"
                checked={settings.smsPayments}
                onCheckedChange={() => toggleSetting("smsPayments")}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">
          Сохранить изменения
        </Button>
      </div>
    </div>
  );
}
