import { Button } from "@/components/tailgrids/core/button";

interface FolderListStateProps {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function FolderListState({
  title,
  description,
  retryLabel,
  onRetry,
}: FolderListStateProps) {
  return (
    <div role="status" className="px-6 py-14 text-center">
      <p className="font-medium text-text-primary">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
        {description}
      </p>
      {onRetry && (
        <Button appearance="outline" onPress={onRetry} className="mt-5">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
