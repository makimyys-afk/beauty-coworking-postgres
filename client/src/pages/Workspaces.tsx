import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkspaceSearch } from "@/components/WorkspaceSearch";
import { BookingModal } from "@/components/BookingModal";
import { trpc } from "@/lib/trpc";
import { Star, MapPin, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const workspaceTypes = [
  { value: "all", label: "Все" },
  { value: "hairdresser", label: "Парикмахер" },
  { value: "makeup", label: "Визаж" },
  { value: "manicure", label: "Маникюр" },
  { value: "cosmetology", label: "Косметология" },
  { value: "massage", label: "Массаж" },
];

const sortOptions = [
  { value: "name", label: "По названию" },
  { value: "price-asc", label: "Цена: по возрастанию" },
  { value: "price-desc", label: "Цена: по убыванию" },
  { value: "rating", label: "По рейтингу" },
];

const ITEMS_PER_PAGE = 9;

export default function Workspaces() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Модальное окно бронирования
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const { data: workspaces, isLoading } = trpc.workspaces.getAll.useQuery();

  // Фильтрация
  const filteredWorkspaces = workspaces?.filter((w) => {
    const matchesType = selectedType === "all" || w.type === selectedType;
    const matchesSearch = searchQuery === "" || 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Сортировка
  const sortedWorkspaces = [...(filteredWorkspaces || [])].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return parseFloat(String(a.pricePerHour)) - parseFloat(String(b.pricePerHour));
      case "price-desc":
        return parseFloat(String(b.pricePerHour)) - parseFloat(String(a.pricePerHour));
      case "rating":
        return parseFloat(String(b.rating || 0)) - parseFloat(String(a.rating || 0));
      case "name":
      default:
        return a.name.localeCompare(b.name);
    }
  });

  // Пагинация
  const totalPages = Math.ceil((sortedWorkspaces?.length || 0) / ITEMS_PER_PAGE);
  const paginatedWorkspaces = sortedWorkspaces?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Сброс страницы при изменении фильтров
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleBookClick = (workspace: any) => {
    setSelectedWorkspace(workspace);
    setBookingModalOpen(true);
  };

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

        {/* Search and Sort */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <WorkspaceSearch value={searchQuery} onChange={handleSearchChange} />
          </div>
          <div className="w-full md:w-48">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {workspaceTypes.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? "default" : "outline"}
              onClick={() => handleTypeChange(type.value)}
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

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Найдено: {sortedWorkspaces?.length || 0} рабочих мест
        </div>

        {/* Workspaces Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedWorkspaces?.map((workspace) => {
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
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link href={`/workspaces/${workspace.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Подробнее
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => handleBookClick(workspace)}
                      className="flex-1 bg-primary-gradient hover:bg-primary-gradient-hover text-white shadow-primary hover:shadow-primary-hover transition-all-smooth"
                      disabled={!workspace.isAvailable}
                    >
                      Забронировать
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty state */}
        {paginatedWorkspaces?.length === 0 && (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "bg-primary-gradient" : ""}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        workspace={selectedWorkspace}
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
      />
    </div>
  );
}
