import LeaderboardClient from "./LeaderboardClient";

export default function LeaderboardPage({
  params
}: {
  params: { roundId: string };
}) {
  return <LeaderboardClient roundId={params.roundId} />;
}
