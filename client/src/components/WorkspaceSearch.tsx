import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface WorkspaceSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function WorkspaceSearch({ value, onChange }: WorkspaceSearchProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Поиск по названию или описанию..."
        value={value}
        onChange={handleChange}
        className="pl-10 pr-10 w-full border-border focus:border-primary transition-all-smooth"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
