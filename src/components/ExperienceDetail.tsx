"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { ProgressBar } from "./ProgressBar";
import { Avatar } from "./Avatar";
import { formatCents, getProgressPercentage, getCategoryLabel } from "@/lib/utils";
import type { ExperienceWithSponsors } from "@/types/database";

interface ExperienceDetailProps {
  experience: ExperienceWithSponsors | null;
  isOpen: boolean;
  onClose: () => void;
  onSponsor: (experience: ExperienceWithSponsors, amountCents?: number) => void;
}

function getContextualPresets(remainingCents: number, minSplitCents: number): number[] {
  const presets: number[] = [];
  for (const pct of [0.25, 0.5, 0.75]) {
    const amt = Math.round(remainingCents * pct);
    // Round to nearest $5 (500 cents)
    const rounded = Math.round(amt / 500) * 500;
    if (rounded >= minSplitCents && rounded < remainingCents && !presets.includes(rounded)) {
      presets.push(rounded);
    }
  }
  // Always include full amount
  if (!presets.includes(remainingCents)) {
    presets.push(remainingCents);
  }
  return presets;
}

export function ExperienceDetail({
  experience,
  isOpen,
  onClose,
  onSponsor,
}: ExperienceDetailProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");

  if (!experience) return null;

  const isFullyFunded = experience.funded_cents >= experience.price_cents;
  const remainingCents = Math.max(0, experience.price_cents - experience.funded_cents);
  const pct = getProgressPercentage(experience.funded_cents, experience.price_cents);
  const allowSplit = experience.allow_splitting && remainingCents > experience.min_split_cents;
  const presets = allowSplit ? getContextualPresets(remainingCents, experience.min_split_cents) : [remainingCents];

  function handleSponsorClick() {
    const amount = allowSplit ? selectedAmount : remainingCents;
    if (amount > 0) {
      onSponsor(experience!, amount);
    } else {
      onSponsor(experience!);
    }
  }

  function handleClose() {
    setSelectedAmount(0);
    setCustomAmount("");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {/* Hero */}
      <div className="relative h-56 sm:h-72 flex items-center justify-center bg-gradient-to-br from-sand to-cream rounded-t-[28px] overflow-hidden">
        {experience.image_url ? (
          <img
            src={experience.image_url}
            alt={experience.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-8xl">{experience.emoji || "✨"}</span>
        )}
      </div>

      <div className="p-6 sm:p-8">
        {/* Category */}
        <span className="inline-block text-xs font-medium text-warm-brown bg-sand px-3 py-1 rounded-full mb-3">
          {getCategoryLabel(experience.category)}
        </span>

        {/* Title & Description */}
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-dark-brown mb-3">
          {experience.title}
        </h2>
        <p className="text-warm-brown leading-relaxed mb-6">{experience.description}</p>

        {/* Price & Progress */}
        <div className="bg-sand rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-display font-bold text-2xl text-dark-brown">
                {formatCents(experience.price_cents)}
              </span>
              {experience.funded_cents > 0 && (
                <span className="text-sm text-muted-brown ml-2">
                  ({formatCents(experience.funded_cents)} funded)
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-warm-brown">{pct}%</span>
          </div>
          <ProgressBar funded={experience.funded_cents} total={experience.price_cents} />
          {!isFullyFunded && (
            <p className="text-sm text-muted-brown mt-2">
              {formatCents(remainingCents)} remaining
            </p>
          )}
        </div>

        {/* Inline amount selection for splittable experiences */}
        {!isFullyFunded && allowSplit && (
          <div className="mb-6">
            <h3 className="font-display font-semibold text-lg text-dark-brown mb-3">
              Choose Your Gift Amount
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {presets.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`py-3 rounded-xl font-display font-bold text-lg transition-all ${
                    selectedAmount === amt
                      ? "bg-coral text-white shadow-md"
                      : "bg-sand text-dark-brown hover:bg-border"
                  }`}
                >
                  {amt === remainingCents ? `${formatCents(amt)} (All)` : formatCents(amt)}
                </button>
              ))}
            </div>
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
                    setSelectedAmount(cents);
                  } else {
                    setSelectedAmount(0);
                  }
                }}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-cream border-2 border-border text-dark-brown focus:border-coral focus:outline-none transition-colors"
              />
            </div>
            <p className="text-xs text-muted-brown mt-1.5">
              Min {formatCents(experience.min_split_cents)}
            </p>
          </div>
        )}

        {/* Sponsors List */}
        {experience.sponsors.length > 0 && (
          <div className="mb-6">
            <h3 className="font-display font-semibold text-lg text-dark-brown mb-3">
              Sponsors
            </h3>
            <div className="space-y-3">
              {experience.sponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center gap-3">
                  <Avatar
                    name={sponsor.display_name}
                    photoUrl={sponsor.photo_url}
                    size={40}
                  />
                  <div>
                    <span className="font-medium text-dark-brown">
                      {sponsor.display_name}
                    </span>
                    <span className="text-sm text-muted-brown ml-2">
                      {formatCents(sponsor.amount_cents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {isFullyFunded ? (
          <div className="text-center py-4 bg-success/10 rounded-2xl">
            <span className="text-success font-display font-bold text-lg">
              Fully Sponsored ✓
            </span>
            <p className="text-sm text-warm-brown mt-1">
              Thank you to all the sponsors!
            </p>
          </div>
        ) : (
          <button
            onClick={handleSponsorClick}
            disabled={allowSplit && selectedAmount <= 0}
            className="btn-primary w-full py-4 rounded-[14px] bg-gradient-to-r from-coral to-deep-coral text-white font-semibold text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {allowSplit && selectedAmount > 0
              ? `Gift ${formatCents(selectedAmount)}`
              : allowSplit
                ? "Select an amount above"
                : `Gift ${formatCents(remainingCents)}`}
          </button>
        )}
      </div>
    </Modal>
  );
}
