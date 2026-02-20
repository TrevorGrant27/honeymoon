"use client";

import { use } from "react";
import { Confetti } from "@/components/Confetti";

export default function ThankYouPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  // Use the params (sessionId can be used later for verification)
  use(params);

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
        <p className="text-muted-brown mb-8">
          Your name and photo will appear on the experience card so everyone can
          see your generous gift.
        </p>

        <div className="bg-sand rounded-[20px] border-2 border-border p-6 mb-8">
          <span className="text-3xl block mb-3">💌</span>
          <p className="text-warm-brown text-sm">
            A confirmation has been sent to your email. If you have any
            questions, reach out to Trevor &amp; Carly directly.
          </p>
        </div>

        <a
          href="/"
          className="btn-primary inline-block px-8 py-4 rounded-[14px] bg-gradient-to-r from-coral to-deep-coral text-white font-semibold text-lg shadow-md"
        >
          Back to Experiences
        </a>
      </div>
    </main>
  );
}
