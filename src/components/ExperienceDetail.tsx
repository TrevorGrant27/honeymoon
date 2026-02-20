"use client";

import { Modal } from "./Modal";
import { ProgressBar } from "./ProgressBar";
import { Avatar } from "./Avatar";
import { formatCents, getProgressPercentage, getCategoryLabel } from "@/lib/utils";
import type { ExperienceWithSponsors } from "@/types/database";

interface ExperienceDetailProps {
  experience: ExperienceWithSponsors | null;
  isOpen: boolean;
  onClose: () => void;
  onSponsor: (experience: ExperienceWithSponsors) => void;
}

export function ExperienceDetail({
  experience,
  isOpen,
  onClose,
  onSponsor,
}: ExperienceDetailProps) {
  if (!experience) return null;

  const isFullyFunded = experience.funded_cents >= experience.price_cents;
  const remainingCents = Math.max(0, experience.price_cents - experience.funded_cents);
  const pct = getProgressPercentage(experience.funded_cents, experience.price_cents);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
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
            onClick={() => onSponsor(experience)}
            className="btn-primary w-full py-4 rounded-[14px] bg-gradient-to-r from-coral to-deep-coral text-white font-semibold text-lg shadow-md"
          >
            Sponsor This Experience
          </button>
        )}
      </div>
    </Modal>
  );
}
