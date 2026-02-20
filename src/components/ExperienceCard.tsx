"use client";

import { formatCents, getProgressPercentage } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";
import { AvatarStack } from "./Avatar";
import type { ExperienceWithSponsors } from "@/types/database";

interface ExperienceCardProps {
  experience: ExperienceWithSponsors;
  onClick: (experience: ExperienceWithSponsors) => void;
}

export function ExperienceCard({ experience, onClick }: ExperienceCardProps) {
  const isFullyFunded = experience.funded_cents >= experience.price_cents;
  const isPartiallyFunded = experience.funded_cents > 0 && !isFullyFunded;
  const remainingCents = experience.price_cents - experience.funded_cents;
  const pct = getProgressPercentage(experience.funded_cents, experience.price_cents);

  return (
    <button
      onClick={() => onClick(experience)}
      className={`experience-card w-full text-left rounded-[20px] overflow-hidden border-2 ${
        isFullyFunded
          ? "border-success/30 bg-gradient-to-br from-success/5 to-cream"
          : "border-border bg-gradient-to-br from-white to-cream"
      } shadow-sm hover:shadow-lg`}
    >
      {/* Image / Emoji Area */}
      <div
        className={`relative h-44 flex items-center justify-center ${
          isFullyFunded
            ? "bg-gradient-to-br from-success/10 to-success/5"
            : "bg-gradient-to-br from-sand to-cream"
        }`}
      >
        {experience.image_url ? (
          <img
            src={experience.image_url}
            alt={experience.title}
            className={`w-full h-full object-cover ${isFullyFunded ? "opacity-80" : ""}`}
          />
        ) : (
          <span className="text-6xl">{experience.emoji || "✨"}</span>
        )}

        {/* Status badges */}
        {isFullyFunded && (
          <div className="absolute top-3 right-3 bg-success text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            FULLY SPONSORED ✓
          </div>
        )}
        {isPartiallyFunded && (
          <div className="absolute top-3 right-3 bg-coral text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            {formatCents(remainingCents)} LEFT
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg text-dark-brown mb-1 leading-tight">
          {experience.title}
        </h3>
        <p className="text-warm-brown text-sm line-clamp-2 mb-3">
          {experience.description}
        </p>

        {/* Price & Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-display font-bold text-xl text-dark-brown">
            {formatCents(experience.price_cents)}
          </span>
          {(isPartiallyFunded || isFullyFunded) && (
            <span className="text-xs text-muted-brown font-medium">{pct}% funded</span>
          )}
        </div>

        {(isPartiallyFunded || isFullyFunded) && (
          <ProgressBar funded={experience.funded_cents} total={experience.price_cents} className="mb-3" />
        )}

        {/* Sponsors */}
        {experience.sponsors.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <AvatarStack sponsors={experience.sponsors} />
            <span className="text-xs text-muted-brown">
              {experience.sponsors.length === 1
                ? experience.sponsors[0].display_name
                : `${experience.sponsors.length} sponsors`}
            </span>
          </div>
        )}

        {/* CTA text */}
        {!isFullyFunded && (
          <div className="mt-3 text-center">
            <span className="text-sm font-medium text-coral">
              {isPartiallyFunded ? "Contribute" : "Sponsor This Experience"}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
