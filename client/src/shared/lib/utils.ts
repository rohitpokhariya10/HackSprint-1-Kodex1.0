import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User } from "../types/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserName(user: User | string | undefined) {
  return typeof user === "object" && user ? user.name : "DevHub creator";
}

export function getUserId(user: User | string | undefined) {
  return typeof user === "object" && user ? user._id : user;
}

export function formatDate(value?: string) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function toCsv(value?: string[]) {
  return value?.join(", ") || "";
}

export function appendIfPresent(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return;
  formData.append(key, String(value));
}
