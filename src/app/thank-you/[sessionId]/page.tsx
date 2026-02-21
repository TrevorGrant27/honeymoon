"use client";

import { use, useState } from "react";
import { Confetti } from "@/components/Confetti";

export default function ThankYouPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  use(params);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = window.location.origin;
    const text = "I just gifted an experience on Trevor & Carly's honeymoon registry! Check it out:";
    if (navigator.share) {
      navigator.share({ title: "Trevor & Carly's Honeymoon", text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      <Confetti />

      <div className="max-w-md mx-auto px-4 text-center">
        <p className="divider-ornament text-muted-brown text-sm max-w-xs mx-auto mb-8">
          &hearts;
        </p>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl text-dark-brown mb-4">
          Thank You
        </h1>
        <p className="text-warm-brown text-base leading-relaxed mb-6">
          Your gift means the world to Trevor &amp; Carly.
          You&apos;re helping create an unforgettable honeymoon memory.
        </p>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-5">
          <p className="text-warm-brown text-sm mb-3">
            Your name will appear on the experience card for all to see.
          </p>
          <div className="bg-sand/50 rounded-xl p-3 inline-flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose/15 flex items-center justify-center text-rose font-medium text-xs">
              You
            </div>
            <span className="text-dark-brown text-sm">Your Name &middot; Your Gift</span>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-8">
          <p className="text-muted-brown text-sm">
            A confirmation has been sent to your email.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/"
            className="btn-primary flex-1 inline-block px-6 py-4 rounded-full bg-rose text-white font-medium text-base tracking-wide shadow-sm text-center"
          >
            Gift Another
          </a>
          <button
            onClick={handleShare}
            className="flex-1 px-6 py-4 rounded-full bg-white border border-border text-dark-brown font-medium text-base hover:bg-sand transition-colors text-center"
          >
            {copied ? "Copied!" : "Share Registry"}
          </button>
        </div>
      </div>
    </main>
  );
}
