import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkspaceSearch } from "@/components/WorkspaceSearch";
import { trpc } from "@/lib/trpc";
import { Star, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const workspaceTypes = [
  { value: "all", label: "Все" },
  { value: "hairdresser", label: "Парикмахер" },
  { value: "makeup", label: "Визаж" },
  { value: "manicure", label: "Маникюр" },
  { value: "cosmetology", label: "Косметология" },
  { value: "massage", label: "Массаж" },
];

export default function Workspaces() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { data: workspaces, isLoading } = trpc.workspaces.getAll.useQuery();

  const filteredWorkspaces = workspaces?.filter((w) => {
    const matchesType = selectedType === "all" || w.type === selectedType;
    const matchesSearch = searchQuery === "" || 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Рабочие места
          </h1>
          <p className="text-muted-foreground">
            Выберите подходящее рабочее место для вашей специализации
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <WorkspaceSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {workspaceTypes.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? "default" : "outline"}
              onClick={() => setSelectedType(type.value)}
              className={
                selectedType === type.value
                  ? "bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary transition-all-smooth"
                  : "border-border hover:bg-accent hover:border-primary transition-all-smooth"
              }
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* Workspaces Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces?.map((workspace) => {
            const amenities = workspace.amenities 
              ? JSON.parse(workspace.amenities as string) 
              : [];

            return (
              <Card
                key={workspace.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all-smooth hover:-translate-y-1 overflow-hidden bg-card animate-fade-in-up"
              >
                <div className="relative">
                  <img
                    src={workspace.imageUrl || ""}
                    alt={workspace.name}
                    className="w-full h-56 object-cover"
                  />
                  {workspace.isAvailable ? (
                    <Badge className="absolute top-4 right-4 bg-success text-white">
                      Доступно
                    </Badge>
                  ) : (
                    <Badge className="absolute top-4 right-4 bg-error text-white">
                      Занято
                    </Badge>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-foreground text-xl">
                      {workspace.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 bg-accent px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      <span className="text-sm font-semibold text-foreground">
                        {Number(workspace.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="text-muted-foreground line-clamp-2">
                    {workspace.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2">
                    {amenities.slice(0, 3).map((amenity: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-accent text-accent-foreground text-xs"
                      >
                        {amenity}
                      </Badge>
                    ))}
                    {amenities.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="bg-accent text-accent-foreground text-xs"
                      >
                        +{amenities.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {workspace.pricePerHour} ₽
                      </div>
                      <div className="text-sm text-muted-foreground">за час</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">
                        {workspace.pricePerDay} ₽
                      </div>
                      <div className="text-sm text-muted-foreground">за день</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/workspaces/${workspace.id}`}>
                    <Button className="w-full bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary hover:shadow-primary-hover transition-all-smooth">
                      Подробнее и забронировать
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredWorkspaces?.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Рабочие места не найдены
            </h3>
            <p className="text-muted-foreground">
              Попробуйте изменить фильтры или вернитесь позже
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
