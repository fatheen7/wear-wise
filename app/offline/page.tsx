export default function OfflinePage() {
  return (
    <div className="app-shell items-center justify-center text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center mb-4">
        <span className="text-2xl">👔</span>
      </div>
      <h1 className="font-display text-xl mb-2">You&apos;re offline</h1>
      <p className="text-ink-soft text-sm">
        WearWise needs a connection to check today&apos;s weather. Your saved wardrobe and last
        outfit are still here — reconnect to refresh your recommendation.
      </p>
    </div>
  );
}
