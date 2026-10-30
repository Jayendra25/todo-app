"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  describeReadError,
  describeTimeoutError,
  describeWriteError,
  type BoardError,
} from "@/lib/firestoreErrors";
import type { Filter, Todo } from "@/lib/types";
import { Logo } from "@/components/Logo";
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  LinkIcon,
  ListIcon,
  LockIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  WifiIcon,
} from "@/components/Icons";

type TodoBoardProps = {
  roomId: string;
};

type Toast = {
  message: string;
  type: "success" | "error";
};

/**
 * A task that has been painted locally but may not be acknowledged by
 * Firestore yet. The document ID is generated on the client with
 * `doc(todosCollection)`, so this row and the eventual snapshot share the same
 * ID — and therefore the same React key, so nothing remounts when the write
 * lands.
 */
type PendingAdd = {
  id: string;
  text: string;
};

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
];

const RULES_SNIPPET = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId}/todos/{todoId} {
      allow get, list, create, update, delete: if true;
    }
  }
}`;

const DEPLOY_COMMAND = "npx firebase-tools deploy --only firestore:rules";

export default function TodoBoard({ roomId }: TodoBoardProps) {
  // The snapshot is the source of truth. Optimistic overlays are layered on
  // top of it so the UI can respond before Firestore acknowledges a write.
  const [serverTodos, setServerTodos] = useState<Todo[]>([]);
  const [pendingAdds, setPendingAdds] = useState<PendingAdd[]>([]);
  const [pendingToggles, setPendingToggles] = useState<
    Record<string, boolean | undefined>
  >({});
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<BoardError | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedFix, setCopiedFix] = useState<"rules" | "command" | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fixTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todosCollection = useMemo(
    () => collection(db, "rooms", roomId, "todos"),
    [roomId],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);

    const todosQuery = query(todosCollection, orderBy("createdAt", "asc"));
    let receivedSnapshot = false;

    const connectionTimer = setTimeout(() => {
      if (receivedSnapshot) return;

      setError(describeTimeoutError());
      setLoading(false);
    }, 9000);

    const unsubscribe = onSnapshot(
      todosQuery,
      (snapshot) => {
        receivedSnapshot = true;
        clearTimeout(connectionTimer);

        const nextTodos = snapshot.docs.map((todoDoc) => {
          const data = todoDoc.data();

          return {
            id: todoDoc.id,
            text: typeof data.text === "string" ? data.text : "",
            completed: data.completed === true,
            createdAt: (data.createdAt as Timestamp | null | undefined) ?? null,
          };
        });

        setServerTodos(nextTodos);

        // Drop overlays the snapshot now reflects. A stale override left
        // behind would fight the server on every later render.
        const syncedById = new Map(nextTodos.map((todo) => [todo.id, todo]));

        setPendingAdds((current) =>
          current.filter((add) => {
            const synced = syncedById.get(add.id);

            // `serverTimestamp()` reads as null in the local snapshot, which
            // sorts the row to the top. Keep the optimistic copy pinned at the
            // bottom until the write is acknowledged and the value is real.
            return !synced || synced.createdAt === null;
          }),
        );

        setPendingDeletes((current) =>
          current.filter((id) => syncedById.has(id)),
        );

        setPendingToggles((current) => {
          const next = { ...current };
          let changed = false;

          for (const todo of nextTodos) {
            if (
              next[todo.id] !== undefined &&
              next[todo.id] === todo.completed
            ) {
              delete next[todo.id];
              changed = true;
            }
          }

          return changed ? next : current;
        });

        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        clearTimeout(connectionTimer);
        console.warn("Firestore listener error:", snapshotError);
        setError(describeReadError(snapshotError));
        setLoading(false);
      },
    );

    return () => {
      clearTimeout(connectionTimer);
      unsubscribe();
    };
  }, [todosCollection, retryNonce]);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);

    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);

    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (fixTimer.current) clearTimeout(fixTimer.current);
    };
  }, []);

  // Optimistic overlay: snapshot data, with local intent applied on top.
  const todos = useMemo<Todo[]>(() => {
    const deleted = new Set(pendingDeletes);
    const syncedById = new Map(serverTodos.map((todo) => [todo.id, todo]));
    const pendingAddIds = new Set(pendingAdds.map((add) => add.id));

    const synced = serverTodos
      .filter((todo) => !deleted.has(todo.id) && !pendingAddIds.has(todo.id))
      .map((todo) => {
        const override = pendingToggles[todo.id];

        return override === undefined ? todo : { ...todo, completed: override };
      });

    // New tasks render at the end until Firestore acknowledges them. Their
    // `createdAt` is the newest value, so that is also where they will settle.
    const optimistic = pendingAdds
      .filter((add) => !deleted.has(add.id))
      .map((add) => {
        const local = syncedById.get(add.id);
        const override = pendingToggles[add.id];

        return {
          id: add.id,
          text: add.text,
          // A toggle can land before the create is acknowledged. Prefer the
          // pending override, then the local snapshot, then the default.
          completed: override ?? local?.completed ?? false,
          createdAt: local?.createdAt ?? null,
        };
      });

    return [...synced, ...optimistic];
  }, [serverTodos, pendingAdds, pendingToggles, pendingDeletes]);

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos],
  );
  const activeCount = todos.length - completedCount;
  const progress =
    todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((todo) => !todo.completed);
    if (filter === "completed") return todos.filter((todo) => todo.completed);
    return todos;
  }, [filter, todos]);

  const counts: Record<Filter, number> = {
    all: todos.length,
    active: activeCount,
    completed: completedCount,
  };

  function showToast(message: string, type: Toast["type"] = "success") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  function handleWriteFailure(writeError: unknown) {
    const failure = describeWriteError(writeError);
    showToast(failure.message, "error");

    // Reads may still be allowed, so keep the board visible and switch the
    // composer into a read-only state instead of hiding everything.
    if (failure.kind === "permission") {
      setReadOnly(true);
      setNewTodo("");
    }
  }

  function retryConnection() {
    setError(null);
    setLoading(true);
    // Give writes another chance too: the rules may have been fixed since the
    // board was locked. If they are still denied, the next write re-locks it.
    setReadOnly(false);
    setRetryNonce((value) => value + 1);
  }

  function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = newTodo.trim();

    if (!text || readOnly) return;

    // Generate the document ID up front so the optimistic row already knows
    // its final identity. This is the whole reason for `setDoc` over `addDoc`.
    const todoRef = doc(todosCollection);

    // 1. Paint the task, 2. clear the composer, 3. sync in the background.
    setPendingAdds((current) => [...current, { id: todoRef.id, text }]);
    setNewTodo("");
    inputRef.current?.focus();

    void setDoc(todoRef, {
      text,
      completed: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((writeError) => {
      console.warn("Add todo error:", writeError);
      // Roll the row back out of the list; the server never accepted it.
      setPendingAdds((current) =>
        current.filter((add) => add.id !== todoRef.id),
      );
      handleWriteFailure(writeError);
    });
  }

  function toggleTodo(todo: Todo) {
    if (readOnly) return;

    const nextCompleted = !todo.completed;

    // Flip the checkbox now; the write catches up on its own.
    setPendingToggles((current) => ({
      ...current,
      [todo.id]: nextCompleted,
    }));

    void updateDoc(doc(db, "rooms", roomId, "todos", todo.id), {
      completed: nextCompleted,
      updatedAt: serverTimestamp(),
    }).catch((writeError) => {
      console.warn("Toggle todo error:", writeError);
      // Drop the override so the row falls back to whatever the server has.
      setPendingToggles((current) => {
        const next = { ...current };
        delete next[todo.id];
        return next;
      });
      handleWriteFailure(writeError);
    });
  }

  function removeTodo(todo: Todo) {
    if (readOnly) return;

    setPendingDeletes((current) => [...current, todo.id]);

    void deleteDoc(doc(db, "rooms", roomId, "todos", todo.id)).catch(
      (writeError) => {
        console.warn("Delete todo error:", writeError);
        // Un-hide the row; the document still exists on the server.
        setPendingDeletes((current) =>
          current.filter((id) => id !== todo.id),
        );
        handleWriteFailure(writeError);
      },
    );
  }

  async function writeToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await Promise.race([
          navigator.clipboard.writeText(text),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Clipboard request timed out")),
              1200,
            ),
          ),
        ]);
        return true;
      }
    } catch {
      // Clipboard permission can be denied even on HTTPS. Fall back below.
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (copyError) {
      console.error("Clipboard fallback error:", copyError);
      return false;
    }
  }

  async function copyShareLink() {
    const shareUrl = `${window.location.origin}/room/${roomId}`;

    if (!(await writeToClipboard(shareUrl))) {
      showToast(
        "Couldn't copy automatically. Please copy the URL from your browser.",
        "error",
      );
      return;
    }

    setCopied(true);
    showToast("Share link copied! Send it to your people.", "success");

    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2400);
  }

  async function copyFix(kind: "rules" | "command") {
    const text = kind === "rules" ? RULES_SNIPPET : DEPLOY_COMMAND;

    if (!(await writeToClipboard(text))) {
      showToast(
        "Couldn't copy automatically. Select the text and copy it manually.",
        "error",
      );
      return;
    }

    setCopiedFix(kind);
    showToast(
      kind === "rules"
        ? "Rules copied. Paste them into the Firebase console."
        : "Deploy command copied.",
      "success",
    );

    if (fixTimer.current) clearTimeout(fixTimer.current);
    fixTimer.current = setTimeout(() => setCopiedFix(null), 2400);
  }

  const emptyState =
    filter === "active"
      ? {
          title: "All caught up.",
          body: "No active tasks right now. Every item is checked off.",
        }
      : filter === "completed"
        ? {
            title: "Nothing checked off yet.",
            body: "Complete a task and it will show up here.",
          }
        : {
            title: "A fresh board, a fresh start.",
            body: "Add your first task above, then share the link with your people.",
          };

  const progressLabel =
    todos.length > 0
      ? `${completedCount} of ${todos.length} done`
      : error
        ? "Unavailable"
        : "No tasks yet";

  const progressHint =
    todos.length > 0
      ? activeCount === 0
        ? "Everything is checked off. Nice work."
        : `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left to go.`
      : error
        ? "Counts appear once this board can be read."
        : "Your first check-off is waiting.";

  const remainingLabel =
    activeCount === 0
      ? todos.length === 0
        ? error
          ? "Waiting for access"
          : "Ready when you are"
        : "All done — take a breath"
      : `${activeCount} ${activeCount === 1 ? "task" : "tasks"} remaining`;

  const statusLabel = error
    ? error.kind === "permission"
      ? "No access"
      : "Reconnecting"
    : isOnline
      ? "Live sync"
      : "Offline";
  const statusColor = error
    ? error.kind === "permission"
      ? "bg-red-500"
      : "bg-amber-500"
    : isOnline
      ? "bg-emerald-500"
      : "bg-amber-500";

  const errorIsPermission = error?.kind === "permission";
  const errorTone = errorIsPermission
    ? {
        panel: "border-red-200 bg-red-50",
        icon: "bg-red-100 text-red-700",
        title: "text-red-900",
        body: "text-red-800/85",
        action: "border-red-300 bg-white text-red-900 hover:bg-red-100",
        details: "border-red-200/70 bg-white/70 text-red-900/85",
      }
    : {
        panel: "border-amber-200 bg-amber-50",
        icon: "bg-amber-100 text-amber-700",
        title: "text-amber-900",
        body: "text-amber-800/85",
        action: "border-amber-300 bg-white text-amber-900 hover:bg-amber-100",
        details: "border-amber-200/70 bg-white/70 text-amber-900/85",
      };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-cream">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="absolute -right-40 -top-44 h-[460px] w-[460px] rounded-full bg-lime/40 blur-3xl" />
        <div className="absolute -left-40 top-40 h-80 w-80 rounded-full bg-coral/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          <Logo />
          <span className="hidden h-6 w-px bg-ink/15 sm:block" />
          <div className="hidden min-w-0 sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              Shared board
            </p>
            <p className="max-w-[160px] truncate text-xs text-ink/60">
              #{roomId}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div
              className={`hidden items-center gap-1.5 rounded-full border border-ink/10 bg-paper/80 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted md:flex`}
              title="Changes are synced in real time"
            >
              <span className="relative flex h-1.5 w-1.5">
                {!error && isOnline && (
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${statusColor}`}
                  />
                )}
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${statusColor}`}
                />
              </span>
              {statusLabel}
            </div>

            <button
              type="button"
              onClick={copyShareLink}
              className={`group inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-xs font-semibold text-white shadow-[0_8px_20px_-10px_rgba(23,35,29,0.55)] transition-all hover:-translate-y-0.5 sm:h-11 sm:px-4 ${
                copied
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-ink hover:bg-[#263a30]"
              }`}
            >
              {copied ? (
                <CheckIcon className="h-4 w-4" strokeWidth={2.4} />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {copied ? "Link copied" : "Copy Share Link"}
              </span>
              <span className="sm:hidden">{copied ? "Copied" : "Copy"}</span>
            </button>

            <Link
              href="/"
              className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-paper/70 text-muted transition-colors hover:bg-white hover:text-ink sm:h-11 sm:w-11"
              aria-label="Leave this board"
              title="Leave board"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4 animate-rise">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Shared board
            </p>
            <h1 className="mt-2 text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.06em] sm:text-5xl">
              Our to-do list<span className="text-coral">.</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted sm:text-[15px]">
              Add anything, check it off, and keep everyone moving in the same
              direction.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-ink/10 bg-paper/70 px-3.5 py-2 text-[10px] font-medium text-muted sm:flex">
            {readOnly ? (
              <LockIcon className="h-4 w-4" />
            ) : (
              <UsersIcon className="h-4 w-4" />
            )}
            {readOnly ? "View only — editing is locked" : "Anyone with the link can edit"}
          </div>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-ink/10 bg-white card-shadow animate-rise [animation-delay:80ms]">
          <div className="relative overflow-hidden border-b border-ink/[0.08] bg-gradient-to-br from-[#fbfaf6] via-white to-lime-soft/55 px-5 py-6 sm:px-8 sm:py-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-lime/35 blur-3xl" />

            <div className="relative flex items-start justify-between gap-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted">
                  Progress
                </p>
                <p className="mt-1.5 text-2xl font-semibold tracking-[-0.04em] sm:text-[1.7rem]">
                  {progressLabel}
                </p>
                <p className="mt-1 text-xs text-muted">{progressHint}</p>
              </div>

              <div
                className="relative grid h-[70px] w-[70px] shrink-0 place-items-center rounded-full p-[5px] sm:h-20 sm:w-20"
                style={{
                  background: `conic-gradient(#17231d ${progress}%, #e8e4d9 ${progress}% 100%)`,
                }}
                aria-label={`${progress}% complete`}
                role="img"
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-white">
                  <span className="text-lg font-semibold tracking-[-0.04em] sm:text-xl">
                    {progress}%
                  </span>
                  <span className="-mt-1 text-[7px] font-bold uppercase tracking-[0.16em] text-muted">
                    done
                  </span>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleAddTodo}
              className={`relative mt-6 flex items-center gap-2 rounded-2xl border border-ink/10 bg-white p-1.5 pl-3.5 shadow-[0_10px_30px_-22px_rgba(23,35,29,0.5)] transition-all focus-within:border-ink/30 focus-within:ring-4 focus-within:ring-lime/35 sm:pl-4 ${
                readOnly ? "opacity-70" : ""
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime-soft text-ink">
                <PlusIcon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <label htmlFor="new-todo" className="sr-only">
                Add a new task
              </label>
              <input
                ref={inputRef}
                id="new-todo"
                type="text"
                value={newTodo}
                onChange={(event) => setNewTodo(event.target.value)}
                placeholder={
                  readOnly
                    ? "This board is read-only"
                    : "What needs to get done?"
                }
                maxLength={280}
                autoComplete="off"
                disabled={readOnly}
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-muted/65 disabled:cursor-not-allowed sm:text-[15px]"
              />
              <button
                type="submit"
                disabled={readOnly || !newTodo.trim()}
                aria-label="Add task"
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-ink px-4 text-xs font-semibold text-white transition-all hover:bg-[#263a30] disabled:opacity-40 sm:px-5"
              >
                <PlusIcon className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Add task</span>
              </button>
            </form>

            {readOnly && (
              <p className="relative mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900">
                <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  This board is read-only. Firestore rules allow viewing it but
                  not editing it.
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-b border-ink/[0.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div
              className="flex w-full rounded-xl bg-[#f3f0e7] p-1 sm:w-auto"
              aria-label="Filter tasks"
            >
              {FILTERS.map((item) => {
                const selected = filter === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    aria-pressed={selected}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:flex-none ${
                      selected
                        ? "bg-white text-ink shadow-sm"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`min-w-4 rounded-full px-1 py-0.5 text-[9px] font-bold ${
                        selected
                          ? "bg-ink text-white"
                          : "bg-ink/[0.07] text-muted"
                      }`}
                    >
                      {counts[item.value]}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] font-medium text-muted">
              {remainingLabel}
            </p>
          </div>

          <div className="min-h-[270px] px-3 py-3 sm:px-5 sm:py-4">
            {error ? (
              <div
                role="alert"
                className={`mx-1 flex flex-col items-center rounded-2xl border px-5 py-8 text-center sm:px-8 ${errorTone.panel}`}
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${errorTone.icon}`}
                >
                  {errorIsPermission ? (
                    <LockIcon className="h-5 w-5" strokeWidth={2} />
                  ) : (
                    <WifiIcon className="h-5 w-5" strokeWidth={2} />
                  )}
                </span>
                <h2
                  className={`mt-4 text-base font-semibold tracking-[-0.02em] ${errorTone.title}`}
                >
                  {error.title}
                </h2>
                <p
                  className={`mt-1.5 max-w-md text-xs leading-5 ${errorTone.body}`}
                >
                  {error.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={retryConnection}
                    className={`rounded-lg border px-3.5 py-2 text-[11px] font-semibold transition-colors ${errorTone.action}`}
                  >
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className={`rounded-lg border px-3.5 py-2 text-[11px] font-semibold transition-colors ${errorTone.action}`}
                  >
                    Copy board link
                  </button>
                </div>

                {errorIsPermission && (
                  <details
                    className={`mt-4 w-full max-w-md rounded-xl border px-3.5 py-2.5 text-left ${errorTone.details}`}
                  >
                    <summary className="cursor-pointer text-[11px] font-semibold">
                      Project owner? Here&apos;s the fix
                    </summary>
                    <div className="mt-2 space-y-2 text-[11px] leading-5">
                      <p>
                        Paste this whole file into the{" "}
                        <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[10px]">
                          firestore.rules
                        </code>{" "}
                        editor in the Firebase console, then press Publish:
                      </p>

                      <div className="relative">
                        <pre className="overflow-x-auto rounded-lg bg-ink px-3 py-2 pr-16 font-mono text-[10px] leading-4 text-white/90">
                          {RULES_SNIPPET}
                        </pre>
                        <button
                          type="button"
                          onClick={() => copyFix("rules")}
                          className="absolute right-1.5 top-1.5 rounded-md border border-white/25 bg-white/10 px-2 py-1 text-[9px] font-semibold text-white transition-colors hover:bg-white/20"
                        >
                          {copiedFix === "rules" ? "Copied" : "Copy"}
                        </button>
                      </div>

                      <p>
                        Then run this command, or paste the same block into the
                        Rules tab of the Firebase console:
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[10px]">
                          {DEPLOY_COMMAND}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyFix("command")}
                          className="rounded-md border border-black/10 px-2 py-1 text-[9px] font-semibold transition-colors hover:bg-black/5"
                        >
                          {copiedFix === "command" ? "Copied" : "Copy"}
                        </button>
                      </div>

                      <p>
                        Also confirm App Check enforcement is off for Cloud
                        Firestore while you test.
                      </p>
                    </div>
                  </details>
                )}
              </div>
            ) : loading ? (
              <div className="space-y-2 px-1 py-1" aria-label="Loading tasks">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-3 rounded-2xl px-2 py-3.5"
                  >
                    <span className="h-6 w-6 rounded-full bg-ink/[0.07]" />
                    <span
                      className="h-3 rounded-full bg-ink/[0.07]"
                      style={{ width: `${54 + item * 12}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink/10 bg-[#fbfaf6] px-6 py-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lime-soft text-ink">
                  {filter === "active" ? (
                    <CheckIcon className="h-6 w-6" strokeWidth={2.2} />
                  ) : (
                    <ListIcon className="h-6 w-6" />
                  )}
                </span>
                <h2 className="mt-4 text-lg font-semibold tracking-[-0.03em]">
                  {emptyState.title}
                </h2>
                <p className="mt-1.5 max-w-xs text-xs leading-5 text-muted">
                  {emptyState.body}
                </p>
                {filter === "all" && !readOnly && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.focus()}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#263a30]"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add your first task
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredTodos.map((todo, index) => {
                  return (
                    <li
                      key={todo.id}
                      className="group flex animate-pop items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-[#faf8f3] sm:px-3"
                      style={{
                        animationDelay: `${Math.min(index * 35, 210)}ms`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo)}
                        disabled={readOnly}
                        aria-label={
                          todo.completed
                            ? `Mark "${todo.text}" as active`
                            : `Mark "${todo.text}" as completed`
                        }
                        aria-pressed={todo.completed}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                          todo.completed
                            ? "border-ink bg-ink text-lime"
                            : "border-ink/20 bg-white text-transparent hover:border-ink/50 hover:bg-lime-soft"
                        }`}
                      >
                        <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.8} />
                      </button>

                      <span
                        className={`min-w-0 flex-1 break-words py-1 text-sm leading-6 transition-colors sm:text-[15px] ${
                          todo.completed
                            ? "text-muted line-through decoration-muted/40"
                            : "font-medium text-ink"
                        }`}
                      >
                        {todo.text}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeTodo(todo)}
                        disabled={readOnly}
                        aria-label={`Delete "${todo.text}"`}
                        title="Delete task"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted/70 opacity-100 transition-all hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-ink/[0.08] bg-[#fbfaf6] px-5 py-4 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-2">
              <WifiIcon className="h-3.5 w-3.5" />
              <span>Changes sync instantly across everyone viewing this board.</span>
            </div>
            <span className="font-mono text-[9px] tracking-wide text-muted">
              BOARD · {roomId.slice(0, 12).toUpperCase()}
            </span>
          </div>
        </section>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-paper/65 px-4 py-3 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2.5 text-xs text-muted">
            <LinkIcon className="h-4 w-4 shrink-0" />
            <span>Share this board with anyone you want to plan with.</span>
          </div>
          <button
            type="button"
            onClick={copyShareLink}
            className="text-xs font-semibold text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:decoration-ink"
          >
            {copied ? "Link copied!" : "Copy Share Link"}
          </button>
        </div>
      </main>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast && (
          <div
            className={`flex animate-pop items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_20px_50px_-15px_rgba(23,35,29,0.45)] ${
              toast.type === "success"
                ? "bg-ink text-white"
                : "bg-red-700 text-white"
            }`}
            role="status"
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                toast.type === "success"
                  ? "bg-lime text-ink"
                  : "bg-white/15 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                <span className="text-sm font-bold">!</span>
              )}
            </span>
            <p className="text-xs font-medium">{toast.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
