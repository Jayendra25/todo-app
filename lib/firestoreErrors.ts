/**
 * Turns raw Firestore failures into copy the board UI can show.
 *
 * A rules rejection reaches the browser as `permission-denied`, which the
 * Firebase SDK reports as "Missing or insufficient permissions". That message
 * is easy to mistake for a network problem, so it gets its own branch and its
 * own fallback UI in `components/TodoBoard.tsx`.
 */

export type FirestoreErrorKind =
  | "permission"
  | "unavailable"
  | "index"
  | "database"
  | "unknown";

export type BoardError = {
  kind: FirestoreErrorKind;
  title: string;
  message: string;
};

function readCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }

  return "";
}

/** Error shown when the listener never gets its first snapshot in time. */
export function describeTimeoutError(): BoardError {
  return {
    kind: "unavailable",
    title: "Firestore isn't responding",
    message:
      "The board didn't finish loading. Check your connection, then try again. If it keeps happening, confirm Cloud Firestore is enabled for this project.",
  };
}

export function describeReadError(error: unknown): BoardError {
  switch (readCode(error)) {
    case "permission-denied":
      return {
        kind: "permission",
        title: "Access blocked by Firestore rules",
        message:
          "Firestore rejected this read with “Missing or insufficient permissions”. The rules deployed to this project don't allow reading this board's tasks, or App Check is enforcing attestation.",
      };
    case "unavailable":
      return {
        kind: "unavailable",
        title: "Can't reach Firestore",
        message:
          "The connection dropped before this board could load. Check your network, then try again.",
      };
    case "failed-precondition":
      return {
        kind: "index",
        title: "This board needs a Firestore index",
        message:
          "Firestore rejected the task query. Open the browser console, follow the index link Firestore prints, then try again.",
      };
    case "not-found":
      return {
        kind: "database",
        title: "No Firestore database found",
        message:
          "This Firebase project has no Cloud Firestore database yet. Create the default database in the Firebase console, then try again.",
      };
    default:
      return {
        kind: "unknown",
        title: "Couldn't load this board",
        message:
          "Something went wrong while loading tasks. Try again, and check the browser console for the underlying error.",
      };
  }
}

export function describeWriteError(error: unknown): BoardError {
  switch (readCode(error)) {
    case "permission-denied":
      return {
        kind: "permission",
        title: "Editing is blocked",
        message:
          "This project's security rules allow reading this board but not changing it.",
      };
    case "unavailable":
      return {
        kind: "unavailable",
        title: "Can't reach Firestore",
        message: "Your change wasn't saved because the connection dropped.",
      };
    default:
      return {
        kind: "unknown",
        title: "Couldn't save that change",
        message: "Something went wrong while saving. Please try again.",
      };
  }
}
