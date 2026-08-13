// Wrapper around fetch() for write operations (POST/PUT/DELETE).
// Throws when the request fails so callers can keep the form open and
// keep the user's entered data instead of silently discarding it.
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa que Teso System siga corriendo e intenta de nuevo.");
  }
  if (!res.ok) {
    let message = `El servidor respondió con un error (${res.status}).`;
    try {
      const data = await res.clone().json();
      if (data?.error) message = data.error;
    } catch {
      // response wasn't JSON — keep default message
    }
    throw new Error(message);
  }
  return res;
}
