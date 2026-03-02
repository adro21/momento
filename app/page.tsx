export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-display text-5xl font-bold tracking-tight text-text-primary">
        MOMENTO
      </h1>
      <p className="mt-4 font-mono text-sm text-text-secondary">
        Cinematic git history timelapse
      </p>
      <button className="mt-8 rounded-lg bg-amber px-6 py-3 font-display text-sm font-semibold text-surface transition-all hover:bg-amber-soft hover:shadow-lg hover:shadow-amber-glow">
        New Capture
      </button>
    </main>
  );
}
