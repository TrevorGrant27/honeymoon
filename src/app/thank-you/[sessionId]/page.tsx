"use client";

import { use, useEffect, useState } from "react";
import { Confetti } from "@/components/Confetti";

export default function ThankYouPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [copied, setCopied] = useState(false);

  // Verify payment and record it if the webhook hasn't already
  useEffect(() => {
    if (sessionId) {
      fetch(`/api/verify-payment/${sessionId}`).catch(() => {});
    }
  }, [sessionId]);

  function handleShare() {
    const url = window.location.origin;
    const text = "I just gifted an experience on Trevor & Carly's South of France honeymoon! Check it out:";
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
    <main className="min-h-screen bg-cream watercolor-wash flex items-center justify-center">
      <Confetti />

      <div className="relative max-w-md mx-auto px-4 text-center">
        <div className="divider-ornament text-champagne text-sm max-w-[200px] mx-auto mb-10">
          <span className="text-lavender">&#x269C;</span>
        </div>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl text-dark-brown mb-4 italic">
          Merci!
        </h1>
        <p className="text-warm-brown text-base leading-relaxed mb-8 italic">
          Your gift means the world to Trevor &amp; Carly.
          You&apos;re helping create an unforgettable memory in the South of France.
        </p>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-border-soft p-6 mb-5">
          <p className="text-warm-brown text-sm mb-3 italic">
            Your name will appear on the experience card for all to see.
          </p>
          <div className="bg-linen/60 rounded-xl p-3 inline-flex items-center gap-3 border border-border-soft">
            <div className="w-9 h-9 rounded-full bg-rose/15 flex items-center justify-center text-rose font-medium text-xs">
              You
            </div>
            <span className="text-dark-brown text-sm">Your Name &middot; Your Gift</span>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-border-soft p-5 mb-10">
          <p className="text-muted-brown text-sm italic">
            A confirmation has been sent to your email.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/"
            className="btn-primary flex-1 inline-block px-6 py-4 rounded-full bg-gradient-to-r from-rose to-deep-rose text-white font-medium text-base tracking-wider shadow-sm text-center"
          >
            Gift Another
          </a>
          <button
            onClick={handleShare}
            className="flex-1 px-6 py-4 rounded-full bg-white border border-border-soft text-dark-brown font-medium text-base hover:bg-linen transition-colors text-center"
          >
            {copied ? "Copied!" : "Share Registry"}
          </button>
        </div>
      </div>
    </main>
  );
}
