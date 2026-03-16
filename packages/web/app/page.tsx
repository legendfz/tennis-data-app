export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212] text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          🎾 TennisHQ
        </h1>
        <p className="mt-4 text-lg text-white/60">
          Live scores, player stats, H2H — the tennis app you deserve.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <span className="rounded-full bg-[#2E7D32] px-4 py-2 text-sm font-medium">
            ATP
          </span>
          <span className="rounded-full bg-[#2E7D32] px-4 py-2 text-sm font-medium">
            WTA
          </span>
          <span className="rounded-full bg-[#2E7D32] px-4 py-2 text-sm font-medium">
            Grand Slams
          </span>
        </div>
        <p className="mt-12 text-sm text-white/38">
          Coming soon — Backend API at port 3001
        </p>
      </div>
    </main>
  );
}
