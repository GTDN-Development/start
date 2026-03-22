import { clsx, type ClassValue } from "clsx";
import { startTransition } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function runAsyncTransition<T>(action: () => Promise<T>): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    startTransition(() => {
      action().then(resolve).catch(reject);
    });
  });
}
