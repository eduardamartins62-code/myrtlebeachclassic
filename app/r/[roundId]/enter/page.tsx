import ScoreEntryClient from "./ScoreEntryClient";

export default function ScoreEntryPage({
  params
}: {
  params: { roundId: string };
}) {
  return <ScoreEntryClient roundId={params.roundId} />;
}
