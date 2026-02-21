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
    const text = "I just sponsored an experience on Trevor & Carly's honeymoon registry! Check it out:";
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

      <div className="max-w-lg mx-auto px-4 text-center">
        <span className="text-7xl block mb-6">🎉</span>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-dark-brown mb-4">
          Thank You!
        </h1>
        <p className="text-warm-brown text-lg leading-relaxed mb-4">
          Your sponsorship means the world to Trevor &amp; Carly. You&apos;re
          helping create an unforgettable honeymoon memory!
        </p>

        {/* Preview card */}
        <div className="bg-sand rounded-[20px] border-2 border-border p-6 mb-6">
          <p className="text-warm-brown text-sm mb-3">
            Your name will appear on the experience card so everyone can see your generous gift.
          </p>
          <div className="bg-cream rounded-xl p-4 inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center text-coral font-bold text-sm">
              You
            </div>
            <span className="text-dark-brown font-medium text-sm">Your Name &middot; Your Gift</span>
          </div>
        </div>

        {/* Email confirmation */}
        <div className="bg-sand rounded-[20px] border-2 border-border p-5 mb-6">
          <span className="text-2xl block mb-2">💌</span>
          <p className="text-warm-brown text-sm">
            A confirmation has been sent to your email.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <a
            href="/"
            className="btn-primary flex-1 inline-block px-6 py-4 rounded-[14px] bg-gradient-to-r from-coral to-deep-coral text-white font-semibold text-lg shadow-md text-center"
          >
            Sponsor Another
          </a>
          <button
            onClick={handleShare}
            className="flex-1 px-6 py-4 rounded-[14px] bg-sand border-2 border-border text-dark-brown font-semibold text-lg hover:bg-border transition-colors text-center"
          >
            {copied ? "Link Copied!" : "Share Registry"}
          </button>
        </div>
      </div>
    </main>
  );
}
