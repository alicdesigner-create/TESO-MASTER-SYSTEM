import { NextResponse } from "next/server";

// Wraps a route handler so that any thrown error (bad JSON body, a locked
// data file, a corrupted file with no backup, etc.) comes back as a JSON
// error response instead of an unhandled exception. Next.js turns unhandled
// exceptions into an HTML error page, which breaks apiFetch()'s JSON parsing
// on the client and surfaces as a generic "no se pudo ejecutar" message.
export function withErrorHandling<T extends unknown[]>(
  fn: (...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Error desconocido en el servidor.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
