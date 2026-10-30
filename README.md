# Tandem

A real-time collaborative todo board built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Firebase Firestore**.

Create a board, share the link, and everyone with that link can add, complete, and delete tasks together. Updates appear instantly on every connected screen through Firestore's `onSnapshot` listener.

## Features

- **Room-based boards** at `/room/[roomId]`
- **One-click board creation** with a short, URL-safe room ID
- **Instant synchronization** using Firestore `onSnapshot`
- **Add, complete, and delete** tasks
- **All / Active / Completed** filter tabs with live counts
- **Progress ring** and remaining-task count
- **Copy Share Link** button with a success toast
- **Responsive, modern UI** for desktop and mobile
- **Join an existing board** by pasting its URL on the home page

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firebase setup

The Firebase project credentials are configured in [`lib/firebase.ts`](./lib/firebase.ts).

For the board to load data, the Firebase project must have:

1. **Cloud Firestore enabled** in the Firebase Console. If the API is disabled, the board shows a connection message after a few seconds.
2. **Security rules deployed** so that anyone with a board link can read and write its tasks.

Deploy the included rules with the Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

Or copy the rules from [`firestore.rules`](./firestore.rules) into the Firestore Rules tab in the console.

> **Security note:** these rules are intentionally public because the app uses share-by-link access without accounts. Anyone who has a board URL can edit that board. Do not store sensitive information in it.

### Troubleshooting: "Missing or insufficient permissions"

This is a **rules** error, not a bug in the app's queries. Firestore returns
`permission-denied` when the rules deployed to the project don't match the paths
the board uses. The board reads and writes exactly this path:

```text
rooms/{roomId}/todos/{todoId}
```

and runs one query against the `todos` subcollection, ordered by `createdAt`:

```ts
collection(db, "rooms", roomId, "todos")   // + orderBy("createdAt", "asc")
```

`allow read` (or the explicit `allow get, list`) covers that query. If the board
shows **"Access blocked by Firestore rules"**, the deployed rules are stale or
locked down. Fix it by either:

- Running `npx firebase-tools deploy --only firestore:rules` from the project root, or
- Pasting [`firestore.rules`](./firestore.rules) into **Firestore → Rules** in the
  Firebase console and publishing.

Other causes of the same error:

- **App Check enforcement** is on for Cloud Firestore while the app has no App
  Check token. Turn enforcement off for local testing.
- The rules were edited in the console but never published.
- The app is pointing at a different project than the one whose rules you edited
  (check `projectId` in [`lib/firebase.ts`](./lib/firebase.ts)).

The board classifies these failures and shows a dedicated fallback panel instead
of an empty board, and it switches to a read-only state if reads are allowed but
writes are denied.

## Data model

```text
rooms/{roomId}/todos/{todoId}
  ├── text: string
  ├── completed: boolean
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp
```

Boards are created lazily when the first task is added.

## Optional: local Firestore emulator

The app can connect to the Firebase Emulator Suite during local development:

```bash
NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1:8080 npm run dev
```

Then start the emulator from the project root:

```bash
npx firebase-tools emulators:start --only firestore --project demo-tandem
```

## Scripts

```bash
npm run dev        # start the development server
npm run build      # create a production build
npm run start      # run the production build
npm run typecheck  # run TypeScript checks
```
