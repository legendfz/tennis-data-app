import { cn } from "@/lib/cn";

interface PlayerInfo {
  name: string;
  country?: string;
  seed?: number;
}

/**
 * Match status:
 * - live: in-progress match
 * - completed: finished normally
 * - upcoming: scheduled, not yet started
 * - retired: player retired mid-match (show "ret." badge)
 * - walkover: opponent withdrew before match (show "W/O")
 * - suspended: play suspended (show yellow badge)
 * - default: player defaulted
 */
type MatchStatus =
  | "live"
  | "completed"
  | "upcoming"
  | "retired"
  | "walkover"
  | "suspended"
  | "default";

interface MatchScoreCardProps {
  /** First player */
  player1: PlayerInfo;
  /** Second player */
  player2: PlayerInfo;
  /**
   * Set scores as a 2D array: outer index = set number,
   * inner = [p1score, p2score, tiebreakScore?].
   * e.g. [[6,4],[7,6,4]] means p1 won 6-4, 7-6(4)
   */
  sets: number[][];
  /** Match status — defaults to "completed" */
  status?: MatchStatus;
  /** Current game score string for live matches (e.g. "30-15") */
  currentGame?: string;
  /** Scheduled time string for upcoming matches (e.g. "14:00") */
  scheduledTime?: string;
  className?: string;
}

/** Determine which player won based on sets won (returns 0, 1, or null) */
function getWinner(sets: number[][]): 0 | 1 | null {
  let p1Sets = 0;
  let p2Sets = 0;
  for (const [p1, p2] of sets) {
    if (p1 > p2) p1Sets++;
    else if (p2 > p1) p2Sets++;
  }
  if (p1Sets > p2Sets) return 0;
  if (p2Sets > p1Sets) return 1;
  return null;
}

/** Formats a set score tuple, appending tiebreak in parens when present. */
function formatSetScore(set: number[], playerIndex: 0 | 1): string {
  const score = set[playerIndex];
  const opponentScore = set[playerIndex === 0 ? 1 : 0];
  const tiebreak = set[2];

  if (score === undefined) return "";

  // Show tiebreak for the player who won the set at 7 (standard tiebreak)
  // or for any set ending in a tiebreak (both scores are close)
  const wonSet = score > opponentScore;
  if (tiebreak !== undefined && wonSet) {
    return `${score}(${tiebreak})`;
  }
  return String(score);
}

/**
 * Full-width card displaying a tennis match with set scores.
 * Handles live, completed, upcoming, retired, walkover, suspended, and default statuses.
 * Supports tiebreak scores rendered as "7-6(4)".
 */
export function MatchScoreCard({
  player1,
  player2,
  sets,
  status = "completed",
  currentGame,
  scheduledTime,
  className,
}: MatchScoreCardProps) {
  const isLive = status === "live";
  const isUpcoming = status === "upcoming";
  const isWalkover = status === "walkover";
  const isRetired = status === "retired";
  const isSuspended = status === "suspended";

  // Winner styling only applies for completed/retired/default
  const showWinner = status === "completed" || status === "retired" || status === "default";
  const winner = showWinner ? getWinner(sets) : null;

  const players = [player1, player2];

  return (
    <div
      className={cn(
        "w-full rounded-card bg-background-surface p-4",
        className
      )}
    >
      {/* Status header */}
      {isLive && (
        <div className="mb-3 flex items-center gap-2">
          <span className="animate-pulse inline-block size-2 rounded-full bg-result-win" />
          <span className="text-xs font-semibold uppercase tracking-wide text-result-win">
            Live
          </span>
          {currentGame && (
            <span className="ml-1 font-mono text-xs text-text-secondary">
              {currentGame}
            </span>
          )}
        </div>
      )}

      {isSuspended && (
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-chip bg-accent-gold/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent-gold">
            Suspended
          </span>
        </div>
      )}

      {isUpcoming && scheduledTime && (
        <div className="mb-3">
          <span className="text-xs text-text-secondary">{scheduledTime}</span>
        </div>
      )}

      {/* Score rows */}
      <div className="flex flex-col gap-2">
        {players.map((player, pi) => {
          const isWinner = winner === pi;
          const isLoser = winner !== null && winner !== pi;

          return (
            <div key={pi} className="flex items-center justify-between gap-2">
              {/* Player info */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {player.country && (
                  <span className="shrink-0 text-sm" aria-label={player.country}>
                    {player.country}
                  </span>
                )}
                <span
                  className={cn(
                    "truncate text-sm",
                    isWinner && "font-bold text-text-primary",
                    isLoser && "font-normal text-text-disabled",
                    !isWinner && !isLoser && "font-medium text-text-primary"
                  )}
                >
                  {player.name}
                </span>
                {player.seed != null && (
                  <span className="shrink-0 text-xs text-text-secondary">
                    [{player.seed}]
                  </span>
                )}
              </div>

              {/* Score area */}
              {isWalkover ? (
                // Only render W/O once, on the first row
                pi === 0 ? (
                  <span className="font-mono text-sm font-semibold text-text-secondary">
                    W/O
                  </span>
                ) : null
              ) : isUpcoming ? null : (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {sets.map((set, setIdx) => {
                    const rawScore = pi === 0 ? set[0] : set[1];
                    const opponentRaw = pi === 0 ? set[1] : set[0];
                    const wonSet = rawScore > opponentRaw;
                    const formatted = formatSetScore(set, pi as 0 | 1);

                    // "ret." badge after the last set of the retiring player's row
                    const isLastSet = setIdx === sets.length - 1;

                    return (
                      <span key={setIdx} className="flex items-center gap-1">
                        <span
                          className={cn(
                            "font-mono text-sm tabular-nums",
                            // Width adapts: tiebreak scores are longer
                            set[2] !== undefined ? "min-w-[3rem]" : "w-5",
                            "text-center",
                            wonSet
                              ? isLoser
                                ? "text-text-disabled"
                                : "font-bold text-text-primary"
                              : "text-text-disabled"
                          )}
                        >
                          {formatted}
                        </span>
                        {isRetired && isLastSet && (
                          <span className="text-xs text-text-secondary">ret.</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
