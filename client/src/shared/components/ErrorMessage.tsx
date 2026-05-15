import { AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function ErrorMessage({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="mb-4 h-8 w-8 text-red-400" />
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {message ? <p className="mt-2 max-w-md text-sm text-zinc-400">{message}</p> : null}
      {onRetry ? (
        <Button className="mt-5" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </Card>
  );
}
