export type PlayerRow = {
  id: string;
  name: string;
  handicap: number;
};

export type ScoreRow = {
  player_id: string;
  hole_number: number;
  strokes: number;
};

export type LeaderboardRow = {
  playerId: string;
  name: string;
  grossTotal: number;
  netTotal: number;
  thru: number;
  toPar: number;
};

export type RankedLeaderboardRow = LeaderboardRow & {
  leaderDelta: number;
  position: string;
  rank: number;
};

const allocateHandicap = (handicap: number, holesEntered: number) => {
  if (holesEntered === 0) {
    return 0;
  }
  const base = Math.floor(handicap / 18);
  const remainder = handicap % 18;
  const extra = Math.min(remainder, holesEntered);
  return base * holesEntered + extra;
};

export const buildLeaderboard = (
  players: PlayerRow[],
  scores: ScoreRow[],
  handicapEnabled: boolean
): LeaderboardRow[] => {
  const scoresByPlayer = new Map<string, ScoreRow[]>();
  for (const score of scores) {
    if (!scoresByPlayer.has(score.player_id)) {
      scoresByPlayer.set(score.player_id, []);
    }
    scoresByPlayer.get(score.player_id)?.push(score);
  }

  return players.map((player) => {
    const playerScores = scoresByPlayer.get(player.id) ?? [];
    const grossTotal = playerScores.reduce(
      (total, score) => total + score.strokes,
      0
    );
    const thru = playerScores.reduce(
      (maxHole, score) => Math.max(maxHole, score.hole_number),
      0
    );
    const allocated = handicapEnabled
      ? allocateHandicap(player.handicap, thru)
      : 0;
    const netTotal = grossTotal - allocated;

    return {
      playerId: player.id,
      name: player.name,
      grossTotal,
      netTotal,
      thru,
      toPar: netTotal
    };
  });
};

export const rankLeaderboard = (rows: LeaderboardRow[]) => {
  const sorted = [...rows].sort((a, b) => a.netTotal - b.netTotal);
  if (sorted.length === 0) {
    return [];
  }
  const leader = sorted[0].netTotal;
  const counts = sorted.reduce((map, row, index) => {
    const current = map.get(row.netTotal);
    if (current) {
      current.count += 1;
      return map;
    }
    map.set(row.netTotal, { count: 1, firstIndex: index });
    return map;
  }, new Map<number, { count: number; firstIndex: number }>());

  return sorted.map((row, index) => {
    const bucket = counts.get(row.netTotal);
    const positionNumber = bucket ? bucket.firstIndex + 1 : index + 1;
    const isTied = bucket ? bucket.count > 1 : false;
    return {
      ...row,
      leaderDelta: row.netTotal - leader,
      rank: index + 1,
      position: isTied ? `T${positionNumber}` : `${positionNumber}`
    };
  });
};
