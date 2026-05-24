import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UserSearchToolbar({
  search,
  onSearchChange,
  showCreate,
  onToggleCreate,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  showCreate: boolean;
  onToggleCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-md flex-1 space-y-2">
        <Label htmlFor="user-search">Search</Label>
        <Input
          id="user-search"
          placeholder="Email, name, username…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Button
        type="button"
        onClick={onToggleCreate}
        className="shrink-0 gap-2"
      >
        <UserPlus className="size-4" />
        {showCreate ? "Close form" : "New user"}
      </Button>
    </div>
  );
}
