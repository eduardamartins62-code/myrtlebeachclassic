import ScoreEntryClient from "./ScoreEntryClient";
import { requireScoreEntryAccess } from "@/lib/auth";

export default async function ScoreEntryPage({
  params
}: {
  params: { roundId: string };
}) {
  await requireScoreEntryAccess();
  return <ScoreEntryClient roundId={params.roundId} />;
}
