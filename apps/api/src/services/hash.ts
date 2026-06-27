export async function sha256Hex(value: unknown): Promise<string> {
  const canonical = JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
