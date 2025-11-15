import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Security() {
  const [, setLocation] = useLocation();
  
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("Пароли не совпадают");
      return;
    }
    toast.success("Пароль успешно изменен");
    setPasswords({ current: "", new: "", confirm: "" });
  };

  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.success(
      twoFactorEnabled 
        ? "Двухфакторная аутентификация отключена" 
        : "Двухфакторная аутентификация включена"
    );
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

        <h1 className="text-3xl font-bold mb-6">Безопасность</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Изменить пароль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current">Текущий пароль</Label>
              <Input
                id="current"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="new">Новый пароль</Label>
              <Input
                id="new"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="confirm">Подтвердите новый пароль</Label>
              <Input
                id="confirm"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>
            <Button onClick={handleChangePassword} className="w-full">
              Изменить пароль
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Двухфакторная аутентификация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Дополнительная защита аккаунта
                  </p>
                </div>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleToggle2FA}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Активные сеансы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Текущее устройство</p>
                <p className="text-sm text-muted-foreground">
                  Chrome на Windows • Москва, Россия
                </p>
                <p className="text-xs text-muted-foreground">
                  Последняя активность: сейчас
                </p>
              </div>
              <span className="text-xs text-primary font-medium">Активен</span>
            </div>
            <Button variant="outline" className="w-full">
              Завершить все другие сеансы
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
