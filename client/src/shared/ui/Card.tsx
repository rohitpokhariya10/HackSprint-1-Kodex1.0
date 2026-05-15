import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 transition duration-200 hover:border-zinc-700/80 hover:bg-zinc-950",
        className
      )}
      {...props}
    />
  );
}
