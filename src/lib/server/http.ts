import "server-only";
import { NextResponse } from "next/server";
import { OrderError } from "./errors";

export function json(data: unknown, status = 200, cache = "no-store") {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": cache },
  });
}

export function fail(message: string, status = 400) {
  return json({ error: message }, status);
}

/** Wraps a handler so thrown errors become JSON responses. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof OrderError) return fail(e.message, e.status);
      console.error(e);
      const msg = e instanceof Error ? e.message : "Something went wrong";
      return fail(msg.startsWith("Missing environment") ? msg : "Something went wrong, please try again", 500);
    }
  };
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new OrderError("Invalid request body");
  }
}
