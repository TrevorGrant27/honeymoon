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
      <div className="relative h-52 sm:h-64 flex items-center justify-center bg-gradient-to-br from-sand/60 to-cream rounded-t-2xl overflow-hidden">
        {experience.image_url ? (
          <img
            src={experience.image_url}
            alt={experience.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-7xl">{experience.emoji || "✨"}</span>
        )}
      </div>

      <div className="p-6 sm:p-8">
        {/* Category */}
        <span className="inline-block text-[10px] font-medium tracking-wide uppercase text-muted-brown bg-sand px-3 py-1 rounded-full mb-4">
          {getCategoryLabel(experience.category)}
        </span>

        <h2 className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown mb-3">
          {experience.title}
        </h2>
        <p className="text-warm-brown leading-relaxed mb-6">{experience.description}</p>

        {/* Price & Progress */}
        <div className="bg-sand/50 rounded-xl p-5 mb-6 border border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-display font-semibold text-xl text-dark-brown">
                {formatCents(experience.price_cents)}
              </span>
              {experience.funded_cents > 0 && (
                <span className="text-xs text-muted-brown ml-2">
                  ({formatCents(experience.funded_cents)} funded)
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-warm-brown">{pct}%</span>
          </div>
          <ProgressBar funded={experience.funded_cents} total={experience.price_cents} />
          {!isFullyFunded && (
            <p className="text-xs text-muted-brown mt-2">
              {formatCents(remainingCents)} remaining
            </p>
          )}
        </div>

        {/* Inline amount selection */}
        {!isFullyFunded && allowSplit && (
          <div className="mb-6">
            <h3 className="font-display font-medium text-base text-dark-brown mb-3">
              Choose your gift amount
            </h3>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {presets.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`py-3 rounded-xl font-display font-semibold text-base transition-all border ${
                    selectedAmount === amt
                      ? "bg-rose text-white border-rose shadow-sm"
                      : "bg-white text-dark-brown border-border hover:border-rose/40"
                  }`}
                >
                  {amt === remainingCents ? `${formatCents(amt)} (All)` : formatCents(amt)}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-brown">
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
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-white border border-border text-dark-brown focus:border-rose focus:outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] text-muted-brown mt-1.5">
              Min {formatCents(experience.min_split_cents)}
            </p>
          </div>
        )}

        {/* Sponsors List */}
        {experience.sponsors.length > 0 && (
          <div className="mb-6">
            <h3 className="font-display font-medium text-base text-dark-brown mb-3">
              Gifted by
            </h3>
            <div className="space-y-2.5">
              {experience.sponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center gap-3">
                  <Avatar
                    name={sponsor.display_name}
                    photoUrl={sponsor.photo_url}
                    size={36}
                  />
                  <div>
                    <span className="text-sm font-medium text-dark-brown">
                      {sponsor.display_name}
                    </span>
                    <span className="text-xs text-muted-brown ml-2">
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
          <div className="text-center py-4 bg-sage/10 rounded-xl border border-sage/20">
            <span className="text-sage font-display font-semibold text-base">
              Fully Gifted
            </span>
            <p className="text-xs text-warm-brown mt-1">
              Thank you to everyone who contributed!
            </p>
          </div>
        ) : (
          <button
            onClick={handleSponsorClick}
            disabled={allowSplit && selectedAmount <= 0}
            className="btn-primary w-full py-4 rounded-full bg-rose text-white font-medium text-base tracking-wide shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
