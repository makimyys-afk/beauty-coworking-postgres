import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Upload, Download, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Documents() {
  const [, setLocation] = useLocation();

  const documents = [
    { id: 1, name: "Диплом парикмахера", date: "15.03.2024", size: "2.4 МБ" },
    { id: 2, name: "Сертификат повышения квалификации", date: "20.01.2024", size: "1.8 МБ" },
    { id: 3, name: "Медицинская книжка", date: "10.02.2024", size: "3.2 МБ" }
  ];

  const handleUpload = () => {
    toast.success("Документ успешно загружен");
  };

  const handleDownload = (name: string) => {
    toast.success(`Скачивание: ${name}`);
  };

  const handleDelete = (name: string) => {
    toast.success(`Документ "${name}" удален`);
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

        <h1 className="text-3xl font-bold mb-6">Мои документы</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Загрузить новый документ</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleUpload} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Выбрать файл
            </Button>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Поддерживаются форматы: PDF, JPG, PNG (макс. 10 МБ)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Загруженные документы</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className={`flex items-center justify-between p-4 ${
                  index !== documents.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.date} • {doc.size}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc.name)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.name)}
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
