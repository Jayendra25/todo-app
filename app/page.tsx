"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import {
  ArrowUpRightIcon,
  BoltIcon,
  CheckIcon,
  LinkIcon,
  LoaderIcon,
  PlusIcon,
  SparklesIcon,
} from "@/components/Icons";
import { extractRoomId, generateRoomId } from "@/lib/rooms";

const mockTasks = [
  { label: "Book the cabin", done: true },
  { label: "Pick up road-trip snacks", done: true },
  { label: "Send the playlist", done: false },
  { label: "Pack the car", done: false },
];

const features = [
  {
    number: "01",
    title: "Create a board",
    description:
      "One click gives you a fresh space for the list in your head. No account, no onboarding, no friction.",
    icon: SparklesIcon,
    className: "bg-lime text-ink",
    iconClassName: "bg-ink/10 text-ink",
  },
  {
    number: "02",
    title: "Share the link",
    description:
      "Send the board URL to your people. Anyone with the link can jump in and start collaborating.",
    icon: LinkIcon,
    className: "bg-paper text-ink",
    iconClassName: "bg-ink/5 text-ink",
  },
  {
    number: "03",
    title: "Check things off",
    description:
      "Every add, tick and delete appears on every screen instantly. No refresh. No version confusion.",
    icon: BoltIcon,
    className: "bg-ink text-white",
    iconClassName: "bg-white/10 text-lime",
  },
];

function Avatar({
  initials,
  color,
  className = "",
}: {
  initials: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={`grid h-9 w-9 place-items-center rounded-full border-2 border-paper text-[11px] font-bold ${color} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [joinValue, setJoinValue] = useState("");
  const [joinError, setJoinError] = useState("");

  function createBoard() {
    if (creating) return;
    setCreating(true);
    router.push(`/room/${generateRoomId()}`);
  }

  function joinBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const roomId = extractRoomId(joinValue);

    if (!roomId) {
      setJoinError("Paste a board link or enter a valid board ID.");
      return;
    }

    setJoinError("");
    router.push(`/room/${roomId}`);
  }

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[820px] overflow-hidden">
        <div className="dot-grid absolute inset-0 opacity-50" />
        <div className="absolute -right-44 -top-52 h-[580px] w-[580px] rounded-full bg-lime/45 blur-3xl" />
        <div className="absolute -left-52 top-64 h-[420px] w-[420px] rounded-full bg-coral/15 blur-3xl" />
      </div>

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Logo />

        <nav className="hidden items-center gap-8 sm:flex">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            How it works
          </a>
          <button
            type="button"
            onClick={createBoard}
            disabled={creating}
            className="group inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(23,35,29,0.55)] transition-all hover:-translate-y-0.5 hover:bg-[#263a30] disabled:opacity-70"
          >
            {creating ? (
              <LoaderIcon className="h-4 w-4 animate-spin-slow" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            New board
          </button>
        </nav>

        <button
          type="button"
          onClick={createBoard}
          disabled={creating}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white sm:hidden"
          aria-label="Create a new board"
        >
          {creating ? (
            <LoaderIcon className="h-4 w-4 animate-spin-slow" />
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
          New
        </button>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[1.04fr_0.96fr] lg:gap-8 lg:px-10 lg:pb-32 lg:pt-20">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper/80 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              Real-time shared boards
            </div>

            <h1 className="mt-6 text-[clamp(3.4rem,8vw,6.3rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
              Get things
              <br />
              done,{" "}
              <span className="scribble-underline relative whitespace-nowrap">
                together.
              </span>
            </h1>

            <p className="mt-7 max-w-md text-[1.05rem] leading-7 text-muted sm:text-lg sm:leading-8">
              A shared to-do list that keeps up with your people. Create a
              board, send the link, and watch every check-off happen live.
            </p>

            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={createBoard}
                disabled={creating}
                className="group inline-flex h-14 items-center gap-3 rounded-full bg-ink pl-6 pr-2.5 text-base font-semibold text-white shadow-[0_18px_40px_-18px_rgba(23,35,29,0.75)] transition-all hover:-translate-y-0.5 hover:bg-[#263a30] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink disabled:opacity-75"
              >
                {creating ? "Opening your board" : "Create New Board"}
                <span className="grid h-9 w-9 place-items-center rounded-full bg-lime text-ink transition-transform duration-300 group-hover:rotate-45">
                  {creating ? (
                    <LoaderIcon className="h-4 w-4 animate-spin-slow" />
                  ) : (
                    <ArrowUpRightIcon className="h-4 w-4" strokeWidth={2.2} />
                  )}
                </span>
              </button>

              <div className="flex items-center gap-2.5 text-sm text-muted">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white shadow-sm ring-1 ring-ink/10">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                </span>
                No sign-up. No setup.
              </div>
            </div>

            <form
              onSubmit={joinBoard}
              className="mt-6 flex max-w-md items-center gap-2 rounded-2xl border border-ink/10 bg-paper/80 p-1.5 pl-3.5 shadow-sm backdrop-blur transition-colors focus-within:border-ink/30"
            >
              <LinkIcon className="h-4 w-4 shrink-0 text-muted" />
              <label htmlFor="join-board" className="sr-only">
                Join an existing board
              </label>
              <input
                id="join-board"
                value={joinValue}
                onChange={(event) => {
                  setJoinValue(event.target.value);
                  if (joinError) setJoinError("");
                }}
                placeholder="Have a board link? Paste it here"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-muted/75"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#263a30]"
              >
                Join
              </button>
            </form>
            {joinError && (
              <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                {joinError}
              </p>
            )}

            <div className="mt-9 flex items-center gap-3.5">
              <div className="flex -space-x-2.5">
                <Avatar
                  initials="MK"
                  color="bg-[#ffd3c4] text-[#7c2d12]"
                  className="border-cream"
                />
                <Avatar
                  initials="JL"
                  color="bg-[#c8e8ff] text-[#0c4a6e]"
                  className="border-cream"
                />
                <Avatar
                  initials="AR"
                  color="bg-[#e3d4ff] text-[#4c1d95]"
                  className="border-cream"
                />
              </div>
              <p className="text-xs leading-5 text-muted">
                Made for teams, friends
                <br className="hidden sm:block" /> and last-minute planners.
              </p>
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-[500px] animate-rise [animation-delay:140ms] lg:ml-auto"
            aria-hidden="true"
          >
            <div className="absolute -left-14 top-16 h-36 w-36 rounded-full bg-coral/20 blur-2xl" />
            <div className="absolute -right-4 top-1/2 h-44 w-44 rounded-full bg-lime/50 blur-3xl" />

            <div className="absolute -top-5 right-7 z-20 rotate-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-lime px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink shadow-[0_10px_30px_-12px_rgba(23,35,29,0.4)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                Live · synced
              </div>
            </div>

            <div className="relative -rotate-[2.2deg] rounded-[34px] border border-ink/10 bg-paper p-2.5 shadow-[0_45px_100px_-35px_rgba(23,35,29,0.5)] transition-transform duration-500 hover:rotate-0 sm:p-3">
              <div className="rounded-[27px] border border-ink/[0.06] bg-white p-5 sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
                      Shared board
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                      Cabin trip
                    </h2>
                  </div>
                  <div className="flex -space-x-2">
                    <Avatar
                      initials="MK"
                      color="bg-[#ffd3c4] text-[#7c2d12]"
                      className="h-8 w-8 border-white text-[10px]"
                    />
                    <Avatar
                      initials="JL"
                      color="bg-[#c8e8ff] text-[#0c4a6e]"
                      className="h-8 w-8 border-white text-[10px]"
                    />
                    <Avatar
                      initials="AR"
                      color="bg-[#e3d4ff] text-[#4c1d95]"
                      className="h-8 w-8 border-white text-[10px]"
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f4f1e9] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Progress
                    </p>
                    <p className="mt-0.5 text-sm font-semibold">2 of 4 done</p>
                  </div>
                  <div className="relative h-10 w-10 rounded-full bg-[conic-gradient(#17231d_50%,#dedacf_0)] p-[3px]">
                    <span className="grid h-full w-full place-items-center rounded-full bg-[#f4f1e9] text-[9px] font-bold">
                      50%
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {mockTasks.map((task, index) => (
                    <li
                      key={task.label}
                      className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[#faf8f3]"
                    >
                      <span
                        className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border ${
                          task.done
                            ? "border-ink bg-ink text-lime"
                            : "border-ink/20 bg-white text-transparent"
                        }`}
                      >
                        <CheckIcon className="h-3 w-3" strokeWidth={2.8} />
                      </span>
                      <span
                        className={`flex-1 text-sm ${
                          task.done
                            ? "text-muted/70 line-through decoration-muted/40"
                            : "font-medium text-ink"
                        }`}
                      >
                        {task.label}
                      </span>
                      {index === 2 && (
                        <span className="rounded-full bg-lime-soft px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800">
                          New
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-ink/15 bg-[#faf8f3] p-1.5 pl-3.5">
                  <PlusIcon className="h-4 w-4 text-muted" />
                  <span className="flex-1 text-xs text-muted/70">
                    Add a task…
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-white">
                    <ArrowUpRightIcon className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-ink/[0.07] pt-4 text-[10px] font-medium text-muted">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  </span>
                  Changes sync instantly for everyone
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 hidden rotate-[-4deg] items-center gap-2.5 rounded-2xl border border-ink/10 bg-white px-4 py-3 shadow-[0_18px_40px_-20px_rgba(23,35,29,0.4)] sm:flex lg:-left-7">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-lime text-ink">
                <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-xs font-semibold">Maya checked one off</p>
                <p className="text-[10px] text-muted">just now</p>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-2 hidden rotate-3 items-center gap-2 rounded-full border border-ink/10 bg-paper px-3.5 py-2 text-[10px] font-semibold shadow-lg sm:flex lg:-right-6">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              3 people here
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="relative border-t border-ink/10 bg-paper/65"
        >
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  How it works
                </p>
                <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl">
                  One link. Everyone in sync.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-muted md:text-right">
                Built for the lists that live in group chats — errands,
                projects, trips, and everything in between.
              </p>
            </div>

            <div className="mt-11 grid gap-4 md:grid-cols-3">
              {features.map((feature) => {
                const FeatureIcon = feature.icon;
                return (
                  <article
                    key={feature.number}
                    className={`group relative flex min-h-[250px] flex-col overflow-hidden rounded-[28px] border border-ink/10 p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7 ${feature.className}`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`grid h-11 w-11 place-items-center rounded-2xl ${feature.iconClassName}`}
                      >
                        <FeatureIcon className="h-5 w-5" />
                      </span>
                      <span
                        className={`text-xs font-bold tracking-[0.18em] ${
                          feature.number === "03"
                            ? "text-white/65"
                            : "text-ink/70"
                        }`}
                      >
                        {feature.number}
                      </span>
                    </div>
                    <div className="mt-auto pt-12">
                      <h3 className="text-xl font-semibold tracking-[-0.03em]">
                        {feature.title}
                      </h3>
                      <p
                        className={`mt-2 text-sm leading-6 ${
                          feature.number === "03"
                            ? "text-white/65"
                            : "text-ink/65"
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>
                    <span
                      className={`absolute -bottom-16 -right-14 h-40 w-40 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-80 ${
                        feature.number === "01"
                          ? "bg-white/60"
                          : feature.number === "02"
                            ? "bg-lime/50"
                            : "bg-lime/10"
                      }`}
                    />
                  </article>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col items-center justify-between gap-5 rounded-[28px] border border-ink/10 bg-white px-6 py-5 sm:flex-row sm:px-8">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime">
                  <BoltIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold tracking-[-0.02em]">
                    Your next list is one click away.
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Start a board and invite your people.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={createBoard}
                disabled={creating}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#263a30] sm:w-auto"
              >
                Create New Board
                <ArrowUpRightIcon className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8 lg:px-10">
          <Logo />
          <p className="text-xs text-muted">
            Less coordinating. More checking things off.
          </p>
        </div>
      </footer>
    </div>
  );
}
