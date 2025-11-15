import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface WorkspaceSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function WorkspaceSearch({ value, onChange }: WorkspaceSearchProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Поиск по названию или описанию..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 w-full border-border focus:border-primary transition-all-smooth"
      />
    </div>
  );
}
