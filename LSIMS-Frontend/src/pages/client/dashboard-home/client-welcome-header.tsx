import { useAuthStore } from "@/stores/auth-store";

export function ClientWelcomeHeader() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">
        Welcome{user?.first_name ? `, ${user.first_name}` : ""}
      </h2>
      <p className="text-muted-foreground">
        Track your laboratory requests and sample status from here.
      </p>
    </div>
  );
}
