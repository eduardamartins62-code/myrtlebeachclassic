export type EventRound = {
  id: string;
  round_number: number;
  course_par: number;
  handicap_enabled: boolean;
};

export type PlayerRow = {
  id: string;
  name: string;
  handicap: number;
  starting_score: number;
};

export type ScoreRow = {
  round_id: string;
  player_id: string;
  hole_number: number;
  strokes: number;
};

export type RoundSummary = {
  gross: number;
  net: number;
  holesEntered: number;
  netToPar: number | null;
  parForHoles: number;
};

export type RoundLeaderboardRow = {
  playerId: string;
  name: string;
  grossTotal: number;
  netTotal: number;
  netToPar: number | null;
  holesEntered: number;
};

export type RankedRoundRow = RoundLeaderboardRow & {
  position: string;
  rank: number;
};

export type TripStandingRow = {
  playerId: string;
  name: string;
  startingScore: number;
  roundResults: (number | null)[];
  grossTotal: number | null;
  netTotal: number;
};

export type RankedTripStandingRow = TripStandingRow & {
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

const calculateParForHoles = (coursePar: number, holesEntered: number) => {
  if (holesEntered === 0) {
    return 0;
  }
  const parPerHole = coursePar / 18;
  // Assumes par is evenly distributed across holes and rounds to the nearest integer.
  return Math.round(parPerHole * holesEntered);
};

const summarizeRound = (
  round: EventRound,
  player: PlayerRow,
  scores: ScoreRow[]
): RoundSummary => {
  const gross = scores.reduce((total, score) => total + score.strokes, 0);
  const holesEntered = new Set(scores.map((score) => score.hole_number)).size;
  const allocated = round.handicap_enabled
    ? allocateHandicap(player.handicap, holesEntered)
    : 0;
  const net = gross - allocated;
  const parForHoles = calculateParForHoles(round.course_par, holesEntered);
  const netToPar = holesEntered > 0 ? net - parForHoles : null;

  return {
    gross,
    net,
    holesEntered,
    netToPar,
    parForHoles
  };
};

export const buildRoundLeaderboard = (
  players: PlayerRow[],
  scores: ScoreRow[],
  round: EventRound
): RoundLeaderboardRow[] => {
  const scoresByPlayer = new Map<string, ScoreRow[]>();
  for (const score of scores) {
    if (!scoresByPlayer.has(score.player_id)) {
      scoresByPlayer.set(score.player_id, []);
    }
    scoresByPlayer.get(score.player_id)?.push(score);
  }

  return players.map((player) => {
    const playerScores = scoresByPlayer.get(player.id) ?? [];
    const summary = summarizeRound(round, player, playerScores);

    return {
      playerId: player.id,
      name: player.name,
      grossTotal: summary.gross,
      netTotal: summary.net,
      netToPar: summary.netToPar,
      holesEntered: summary.holesEntered
    };
  });
};

export const rankRoundLeaderboard = (rows: RoundLeaderboardRow[]) => {
  const sorted = [...rows].sort((a, b) => {
    const aValue = a.netToPar ?? Number.POSITIVE_INFINITY;
    const bValue = b.netToPar ?? Number.POSITIVE_INFINITY;
    return aValue - bValue;
  });

  const counts = sorted.reduce((map, row, index) => {
    const value = row.netToPar ?? Number.POSITIVE_INFINITY;
    const current = map.get(value);
    if (current) {
      current.count += 1;
      return map;
    }
    map.set(value, { count: 1, firstIndex: index });
    return map;
  }, new Map<number, { count: number; firstIndex: number }>());

  return sorted.map((row, index) => {
    const value = row.netToPar ?? Number.POSITIVE_INFINITY;
    const bucket = counts.get(value);
    const positionNumber = bucket ? bucket.firstIndex + 1 : index + 1;
    const isTied = bucket ? bucket.count > 1 : false;
    return {
      ...row,
      rank: index + 1,
      position: isTied ? `T${positionNumber}` : `${positionNumber}`
    };
  });
};

export const buildTripStandings = (
  players: PlayerRow[],
  rounds: EventRound[],
  scores: ScoreRow[]
): TripStandingRow[] => {
  const scoresByRoundPlayer = new Map<string, ScoreRow[]>();
  for (const score of scores) {
    const key = `${score.round_id}-${score.player_id}`;
    if (!scoresByRoundPlayer.has(key)) {
      scoresByRoundPlayer.set(key, []);
    }
    scoresByRoundPlayer.get(key)?.push(score);
  }

  return players.map((player) => {
    let grossTotal = 0;
    let grossHoles = 0;
    const roundResults = rounds.map((round) => {
      const key = `${round.id}-${player.id}`;
      const playerScores = scoresByRoundPlayer.get(key) ?? [];
      const summary = summarizeRound(round, player, playerScores);
      grossTotal += summary.gross;
      grossHoles += summary.holesEntered;
      return summary.netToPar;
    });

    const netTotal =
      player.starting_score +
      roundResults.reduce((total, value) => total + (value ?? 0), 0);

    return {
      playerId: player.id,
      name: player.name,
      startingScore: player.starting_score,
      roundResults,
      grossTotal: grossHoles > 0 ? grossTotal : null,
      netTotal
    };
  });
};

export const rankTripStandings = (rows: TripStandingRow[]) => {
  const sorted = [...rows].sort((a, b) => a.netTotal - b.netTotal);
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
      rank: index + 1,
      position: isTied ? `T${positionNumber}` : `${positionNumber}`
    };
  });
};
