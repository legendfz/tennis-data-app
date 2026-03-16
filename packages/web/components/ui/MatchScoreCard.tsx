import { cn } from "@/lib/cn";

interface PlayerInfo {
  name: string;
  country?: string;
  seed?: number;
}

interface MatchScoreCardProps {
  /** First player */
  player1: PlayerInfo;
  /** Second player */
  player2: PlayerInfo;
  /**
   * Set scores as a 2D array: outer index = set number, inner index = [p1score, p2score].
   * e.g. [[6,4],[7,5]] means p1 won 6-4, 7-5
   */
  sets: number[][];
  /** Whether the match is currently live */
  isLive?: boolean;
  /** Current game score string (e.g. "30-15") */
  currentGame?: string;
  className?: string;
}

/** Determine which player won based on sets won */
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

/**
 * Full-width card displaying a tennis match with set scores.
 * Highlights the winner in bold and dims the loser.
 * Shows a pulsing green dot for live matches.
 */
export function MatchScoreCard({
  player1,
  player2,
  sets,
  isLive = false,
  currentGame,
  className,
}: MatchScoreCardProps) {
  const winner = isLive ? null : getWinner(sets);

  const players = [player1, player2];

  return (
    <div
      className={cn(
        "w-full rounded-card bg-background-surface p-4",
        className
      )}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="mb-3 flex items-center gap-2">
          <span className="animate-pulse-live inline-block size-2 rounded-full bg-result-win" />
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

      {/* Score rows */}
      <div className="flex flex-col gap-2">
        {players.map((player, pi) => {
          const isWinner = winner === pi;
          const isLoser = winner !== null && winner !== pi;

          return (
            <div key={pi} className="flex items-center justify-between">
              {/* Player info */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {player.country && (
                  <span className="text-sm" aria-label={player.country}>
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

              {/* Set scores */}
              <div className="flex items-center gap-3">
                {sets.map(([p1score, p2score], setIdx) => {
                  const score = pi === 0 ? p1score : p2score;
                  const opponentScore = pi === 0 ? p2score : p1score;
                  const wonSet = score > opponentScore;
                  return (
                    <span
                      key={setIdx}
                      className={cn(
                        "w-5 text-center font-mono text-sm tabular-nums",
                        wonSet
                          ? isLoser
                            ? "text-text-disabled"
                            : "font-bold text-text-primary"
                          : "text-text-disabled"
                      )}
                    >
                      {score}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
