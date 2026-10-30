const ROOM_ID_ALPHABET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Creates a short, URL-safe room ID with no ambiguous characters.
 */
export function generateRoomId(length = 10): string {
  const bytes = new Uint8Array(length);

  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(
    bytes,
    (byte) => ROOM_ID_ALPHABET[byte % ROOM_ID_ALPHABET.length],
  ).join("");
}

/**
 * Accepts either a room ID or a full board URL and returns the room ID.
 */
export function extractRoomId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const roomIndex = segments.indexOf("room");
    const candidate = roomIndex >= 0 ? segments[roomIndex + 1] : segments.at(-1);
    return candidate && /^[a-zA-Z0-9_-]{3,64}$/.test(candidate)
      ? candidate
      : null;
  } catch {
    return /^[a-zA-Z0-9_-]{3,64}$/.test(trimmed) ? trimmed : null;
  }
}
