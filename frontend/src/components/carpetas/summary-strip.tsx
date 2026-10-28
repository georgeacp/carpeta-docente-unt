import { cn } from "@/utils/cn";

interface SummaryItem {
  label: string;
  value: string | number;
  hint: string;
  attention?: boolean;
}

export function SummaryStrip({
  items,
  loading = false,
}: {
  items: SummaryItem[];
  loading?: boolean;
}) {
  return (
    <dl
      aria-busy={loading}
      className="grid grid-cols-2 gap-x-6 gap-y-6 border-y border-card-border py-6 lg:grid-cols-4 lg:gap-8"
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-sm text-text-secondary">{item.label}</dt>
          <dd
            className={cn(
              "mt-2 text-3xl font-semibold tracking-tight tabular-nums text-text-primary",
              item.attention && "text-badge-warning-text",
            )}
          >
            {loading ? (
              <span className="inline-block h-9 w-16 rounded bg-background-gray-secondary motion-safe:animate-pulse">
                <span className="sr-only">Cargando</span>
              </span>
            ) : (
              item.value
            )}
          </dd>
          <dd className="mt-1 text-xs leading-5 text-text-tertiary">
            {item.hint}
          </dd>
        </div>
      ))}
    </dl>
  );
}
