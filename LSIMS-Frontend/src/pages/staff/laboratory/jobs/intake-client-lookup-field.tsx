import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  quickRegisterWalkInClient,
} from "@/features/accounts/api";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/ui";
import {
  CLIENT_SEARCH_MIN_LENGTH,
  matchesClientSearch,
} from "@/lib/staff/receptionist/client-search";
import type { AdminUserRow } from "@/types/account-admin";

const LAB_CLIENTS_QUERY_KEY = ["lab-clients-picker"] as const;

function clientDisplayName(c: AdminUserRow): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return name || c.email;
}

type Props = {
  clients: AdminUserRow[];
  clientId: string;
  onClientIdChange: (id: string) => void;
};

export function IntakeClientLookupField({ clients, clientId, onClientIdChange }: Props) {
  const queryClient = useQueryClient();
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInFirstName, setWalkInFirstName] = useState("");
  const [walkInLastName, setWalkInLastName] = useState("");
  const [walkInOrg, setWalkInOrg] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  );

  const searchQuery = [emailInput.trim(), phoneInput.trim()].filter(Boolean).join(" ");

  const matchingClients = useMemo(() => {
    if (selectedClient) return [];
    if (searchQuery.length < CLIENT_SEARCH_MIN_LENGTH) return [];
    return clients.filter((c) => {
      const name = clientDisplayName(c);
      return matchesClientSearch(searchQuery, {
        organization: c.organization_name,
        name: name !== c.email ? name : undefined,
        email: c.email,
        phone: c.phone,
      });
    });
  }, [clients, searchQuery, selectedClient]);

  const selectClient = (client: AdminUserRow) => {
    onClientIdChange(client.id);
    setEmailInput(client.email);
    setPhoneInput(client.phone ?? "");
    setShowWalkIn(false);
    setRegisterError(null);
  };

  const clearSelection = () => {
    onClientIdChange("");
    setShowWalkIn(false);
    setRegisterError(null);
  };

  const registerMut = useMutation({
    mutationFn: quickRegisterWalkInClient,
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: LAB_CLIENTS_QUERY_KEY });
      selectClient(user);
      toast.success("Walk-in client registered.");
      setShowWalkIn(false);
      setWalkInFirstName("");
      setWalkInLastName("");
      setWalkInOrg("");
    },
    onError: (e) => {
      const msg = getApiErrorMessage(e);
      setRegisterError(msg);
      if (msg.toLowerCase().includes("email")) {
        toast.error("Client already exists — select them from the search results.");
      } else {
        toast.error(msg);
      }
    },
  });

  const handleRegisterWalkIn = () => {
    setRegisterError(null);
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      toast.error("Email is required to register a walk-in client.");
      return;
    }
    if (!walkInFirstName.trim()) {
      toast.error("First name is required for walk-in registration.");
      return;
    }
    registerMut.mutate({
      email,
      phone: phoneInput.trim() || undefined,
      first_name: walkInFirstName.trim(),
      last_name: walkInLastName.trim() || undefined,
      organization_name: walkInOrg.trim() || undefined,
    });
  };

  if (selectedClient) {
    return (
      <div className="space-y-2">
        <Label>Client</Label>
        <div className="flex items-start justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
          <div className="min-w-0 text-sm">
            <p className="font-medium">{clientDisplayName(selectedClient)}</p>
            <p className="truncate text-muted-foreground">{selectedClient.email}</p>
            {selectedClient.phone ? (
              <p className="text-muted-foreground">{selectedClient.phone}</p>
            ) : null}
            {selectedClient.organization_name ? (
              <p className="text-xs text-muted-foreground">{selectedClient.organization_name}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Clear client selection"
            onClick={clearSelection}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="intake-client-email">Client email</Label>
        <Input
          id="intake-client-email"
          type="email"
          autoComplete="off"
          placeholder="Search or enter email…"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value);
            setRegisterError(null);
          }}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="intake-client-phone">Client phone</Label>
        <PhoneInput
          id="intake-client-phone"
          value={phoneInput}
          onChange={(v) => {
            setPhoneInput(v);
            setRegisterError(null);
          }}
        />
      </div>

      {matchingClients.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Matching registered clients</p>
          <ul className="max-h-40 divide-y divide-border overflow-y-auto rounded-lg border border-border text-sm">
            {matchingClients.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                  onClick={() => selectClient(c)}
                >
                  <span className="font-medium">{clientDisplayName(c)}</span>
                  <span className="text-xs text-muted-foreground">
                    {[c.email, c.phone].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : searchQuery.length >= CLIENT_SEARCH_MIN_LENGTH ? (
        <p className="text-xs text-muted-foreground">No registered client matches this email or phone.</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Type at least {CLIENT_SEARCH_MIN_LENGTH} characters in email or phone to search registered clients.
        </p>
      )}

      {!showWalkIn ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowWalkIn(true)}
        >
          <UserPlus className="size-4" />
          Register new client (walk-in)
        </Button>
      ) : (
        <div
          className={cn(
            "space-y-3 rounded-lg border border-dashed border-border bg-muted/10 p-3",
            registerError && "border-destructive/40",
          )}
        >
          <p className="text-sm font-medium">Register walk-in client</p>
          <p className="text-xs text-muted-foreground">
            Creates an external account at the desk. Email is required; a secure password is generated
            automatically.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="walkin-first-name">First name</Label>
              <Input
                id="walkin-first-name"
                value={walkInFirstName}
                onChange={(e) => setWalkInFirstName(e.target.value)}
                placeholder="Required"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="walkin-last-name">Last name</Label>
              <Input
                id="walkin-last-name"
                value={walkInLastName}
                onChange={(e) => setWalkInLastName(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="walkin-org">Organization (optional)</Label>
              <Input
                id="walkin-org"
                value={walkInOrg}
                onChange={(e) => setWalkInOrg(e.target.value)}
              />
            </div>
          </div>
          {registerError ? (
            <p className="text-xs text-destructive">{registerError}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={registerMut.isPending}
              onClick={handleRegisterWalkIn}
            >
              {registerMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Register & select client"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={registerMut.isPending}
              onClick={() => {
                setShowWalkIn(false);
                setRegisterError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { LAB_CLIENTS_QUERY_KEY };
