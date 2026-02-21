"use client";

import { useState } from "react";
import { formatCents } from "@/lib/utils";
import type { ExperienceWithSponsors } from "@/types/database";

interface CheckoutFormProps {
  experience: ExperienceWithSponsors;
  preselectedAmountCents?: number;
}

function getContextualPresets(remainingCents: number, minSplitCents: number): number[] {
  const presets: number[] = [];
  for (const pct of [0.25, 0.5, 0.75]) {
    const amt = Math.round(remainingCents * pct);
    const rounded = Math.round(amt / 500) * 500;
    if (rounded >= minSplitCents && rounded < remainingCents && !presets.includes(rounded)) {
      presets.push(rounded);
    }
  }
  if (!presets.includes(remainingCents)) {
    presets.push(remainingCents);
  }
  return presets;
}

export function CheckoutForm({ experience, preselectedAmountCents }: CheckoutFormProps) {
  const remainingCents = experience.price_cents - experience.funded_cents;
  const allowSplit = experience.allow_splitting && remainingCents > experience.min_split_cents;

  // If amount preselected from modal, skip straight to info step
  const hasPreselection = preselectedAmountCents && preselectedAmountCents > 0;
  const initialAmount = hasPreselection
    ? Math.min(preselectedAmountCents, remainingCents)
    : allowSplit
      ? 0
      : remainingCents;

  const [step, setStep] = useState<"amount" | "info">(
    hasPreselection || !allowSplit ? "info" : "amount"
  );
  const [amountCents, setAmountCents] = useState(initialAmount);
  const [customAmount, setCustomAmount] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const presets = allowSplit ? getContextualPresets(remainingCents, experience.min_split_cents) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (amountCents <= 0) {
      setError("Please select an amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience_id: experience.id,
          amount_cents: amountCents,
          display_name: displayName.trim(),
          photo_url: null,
          note: note.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Experience Header */}
      <div className="text-center mb-8">
        <span className="text-5xl block mb-3">{experience.emoji}</span>
        <h1 className="font-display font-bold text-2xl text-dark-brown mb-1">
          {experience.title}
        </h1>
        <p className="text-warm-brown">{formatCents(remainingCents)} remaining</p>
      </div>

      {/* Step 1: Amount Selection */}
      {step === "amount" && allowSplit && (
        <div className="bg-white rounded-[20px] border-2 border-border p-6 mb-6">
          <h2 className="font-display font-semibold text-lg text-dark-brown mb-4">
            Choose Your Contribution
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {presets.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setAmountCents(amt);
                  setCustomAmount("");
                }}
                className={`py-3 rounded-xl font-display font-bold text-lg transition-all ${
                  amountCents === amt
                    ? "bg-coral text-white shadow-md"
                    : "bg-sand text-dark-brown hover:bg-border"
                }`}
              >
                {amt === remainingCents ? `${formatCents(amt)} (All)` : formatCents(amt)}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-brown font-medium">
              $
            </span>
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                const cents = Math.round(parseFloat(e.target.value) * 100);
                if (cents >= experience.min_split_cents && cents <= remainingCents) {
                  setAmountCents(cents);
                } else {
                  setAmountCents(0);
                }
              }}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-cream border-2 border-border text-dark-brown focus:border-coral focus:outline-none transition-colors"
            />
          </div>
          <p className="text-xs text-muted-brown mt-2">
            Minimum contribution: {formatCents(experience.min_split_cents)}
          </p>

          <button
            onClick={() => {
              if (amountCents > 0) setStep("info");
              else setError("Please select a valid amount.");
            }}
            disabled={amountCents <= 0}
            className="btn-primary w-full mt-4 py-3 rounded-[14px] bg-gradient-to-r from-coral to-deep-coral text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue &mdash; {amountCents > 0 ? formatCents(amountCents) : "Select amount"}
          </button>
        </div>
      )}

      {/* Step 2: Sponsor Info */}
      {step === "info" && (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-[20px] border-2 border-border p-6 mb-6">
            <h2 className="font-display font-semibold text-lg text-dark-brown mb-4">
              Your Details
            </h2>

            {/* Amount summary */}
            {allowSplit && (
              <div className="flex items-center justify-between bg-sand rounded-xl px-4 py-3 mb-4">
                <span className="text-warm-brown">Your contribution</span>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-dark-brown">
                    {formatCents(amountCents)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep("amount")}
                    className="text-xs text-coral hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            {/* Display Name */}
            <label className="block mb-1 text-sm font-medium text-dark-brown">
              Your Name <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How it appears on the card"
              required
              className="w-full px-4 py-3 rounded-xl bg-cream border-2 border-border text-dark-brown focus:border-coral focus:outline-none transition-colors mb-4"
            />

            {/* Note */}
            <label className="block mb-1 text-sm font-medium text-dark-brown">
              Personal Note <span className="text-muted-brown">(optional, private)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A note for Trevor & Carly..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-cream border-2 border-border text-dark-brown focus:border-coral focus:outline-none transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="text-center text-red-600 text-sm mb-4">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 rounded-[14px] bg-gradient-to-r from-coral to-deep-coral text-white font-semibold text-lg shadow-md disabled:opacity-50"
          >
            {loading ? "Processing..." : `Proceed to Payment — ${formatCents(amountCents)}`}
          </button>
        </form>
      )}
    </div>
  );
}
