import type { Metadata } from "next";
import TodoBoard from "@/components/TodoBoard";

type RoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { roomId } = await params;

  return {
    title: `Shared board ${roomId.slice(0, 6)}`,
    description:
      "A live, shared to-do list. Add tasks, check them off, and collaborate in real time.",
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return <TodoBoard roomId={roomId} />;
}
