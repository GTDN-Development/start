import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if code is running in a browser environment
 *
 * @returns True if code is running in a browser environment, false otherwise
 */
export const isBrowser = typeof document !== "undefined";

/**
 * Combines multiple function callbacks into a single function that calls each in sequence.
 * Safely handles undefined or null callbacks by skipping them.
 *
 * @param callbacks - Array of callback functions, undefined, or null values
 * @returns A function that executes all provided callbacks in sequence
 *
 * @example
 * <button onClick={chain(props.onClick, handleClick)}>Click me</button>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function chain(...callbacks: any[]): (...args: any[]) => void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any[]) => {
    // eslint-disable-next-line prefer-const
    for (let callback of callbacks) {
      if (typeof callback === "function") {
        callback(...args);
      }
    }
  };
}

/**
 * Creates a delay by returning a Promise that resolves after the specified duration.
 * Useful for creating pauses in async functions or adding delays in animations.
 *
 * @param duration - Time to wait in milliseconds
 * @returns Promise that resolves after the specified duration
 *
 * @example
 * await wait(1000); // Wait for 1 second
 * await wait(500);  // Wait for 500ms
 */
export function wait(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/**
 * Formats a date into a localized string
 *
 * @param date - Date to format (Date object or string)
 * @param language - Locale to use (defaults to 'en-US')
 * @param options - Optional formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  language: string = "en-US",
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(date).toLocaleDateString(
    language,
    options || { year: "numeric", month: "short", day: "numeric" }
  );
}

/**
 * Filters out invalid React children from React.ReactNode
 * @param children - React children to filter
 * @returns Array of valid React elements
 */
export function getValidChildren(children: React.ReactNode) {
  return React.Children.toArray(children).filter(React.isValidElement);
}

/**
 * Randomly shuffles array items using Fisher-Yates algorithm
 *
 * @param array - Array to shuffle
 * @returns A new array with items randomly shuffled
 *
 * @example
 * const numbers = [1, 2, 3, 4, 5];
 * const shuffled = shuffleArray(numbers);
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
