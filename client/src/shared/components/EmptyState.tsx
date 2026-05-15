import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export function EmptyState({
  title,
  text,
  actionLabel,
  actionTo,
}: {
  title: string;
  text?: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <Card className="mx-auto flex max-w-2xl flex-col items-center justify-center p-8 text-center sm:p-10">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <Sparkles className="h-6 w-6 text-zinc-300" />
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      {text ? <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400 sm:text-base">{text}</p> : null}
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="mt-6">
          <Button size="sm">{actionLabel}</Button>
        </Link>
      ) : null}
    </Card>
  );
}
