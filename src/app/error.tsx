"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <p className="divider-ornament text-petal text-sm max-w-[200px] mx-auto mb-10">
          &hearts;
        </p>
        <h1 className="font-display font-semibold text-3xl text-dark-brown mb-4 italic">
          Something went wrong
        </h1>
        <p className="text-warm-brown text-base leading-relaxed mb-8 italic">
          We had trouble loading the page. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-8 py-3 rounded-full bg-rose text-white font-medium tracking-wider"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-8 py-3 rounded-full bg-white border border-border-soft text-dark-brown font-medium"
          >
            Go Home
          </a>
        </div>
      </div>
    </main>
  );
}
