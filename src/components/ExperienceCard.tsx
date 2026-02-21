"use client";

import { formatCents, getProgressPercentage } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";
import { AvatarStack } from "./Avatar";
import type { ExperienceWithSponsors } from "@/types/database";

interface ExperienceCardProps {
  experience: ExperienceWithSponsors;
  onClick: (experience: ExperienceWithSponsors) => void;
}

function getUrgencyText(experience: ExperienceWithSponsors): string | null {
  const pct = getProgressPercentage(experience.funded_cents, experience.price_cents);
  const isFullyFunded = experience.funded_cents >= experience.price_cents;
  if (isFullyFunded) return null;

  if (pct >= 75) return "Almost there";
  if (experience.sponsors.length > 0 && pct >= 50)
    return `${experience.sponsors.length} gift${experience.sponsors.length > 1 ? "s" : ""} so far`;
  return null;
}

export function ExperienceCard({ experience, onClick }: ExperienceCardProps) {
  const isFullyFunded = experience.funded_cents >= experience.price_cents;
  const isPartiallyFunded = experience.funded_cents > 0 && !isFullyFunded;
  const remainingCents = experience.price_cents - experience.funded_cents;
  const pct = getProgressPercentage(experience.funded_cents, experience.price_cents);
  const urgency = getUrgencyText(experience);

  return (
    <button
      onClick={() => onClick(experience)}
      className={`experience-card w-full text-left rounded-2xl overflow-hidden border ${
        isFullyFunded
          ? "border-sage/30 bg-white"
          : "border-border bg-white"
      } shadow-sm`}
    >
      {/* Image / Emoji Area */}
      <div
        className={`relative h-44 flex items-center justify-center ${
          isFullyFunded
            ? "bg-sage/5"
            : "bg-gradient-to-br from-sand/50 to-cream"
        }`}
      >
        {experience.image_url ? (
          <img
            src={experience.image_url}
            alt={experience.title}
            className={`w-full h-full object-cover ${isFullyFunded ? "opacity-75" : ""}`}
          />
        ) : (
          <span className="text-5xl">{experience.emoji || "✨"}</span>
        )}

        {isFullyFunded && (
          <div className="absolute top-3 right-3 bg-sage/90 text-white text-[10px] font-medium tracking-wide uppercase px-3 py-1.5 rounded-full">
            Fully Gifted
          </div>
        )}
        {isPartiallyFunded && (
          <div className="absolute top-3 right-3 bg-white/90 text-rose text-[10px] font-medium tracking-wide uppercase px-3 py-1.5 rounded-full border border-rose/20">
            {formatCents(remainingCents)} left
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-base text-dark-brown mb-1.5 leading-snug">
          {experience.title}
        </h3>
        <p className="text-warm-brown text-sm line-clamp-2 mb-4 leading-relaxed">
          {experience.description}
        </p>

        <div className="flex items-baseline justify-between mb-2">
          <span className="font-display font-semibold text-lg text-dark-brown">
            {formatCents(experience.price_cents)}
          </span>
          {(isPartiallyFunded || isFullyFunded) && (
            <span className="text-[11px] text-muted-brown">{pct}% funded</span>
          )}
        </div>

        {(isPartiallyFunded || isFullyFunded) && (
          <ProgressBar funded={experience.funded_cents} total={experience.price_cents} className="mb-3" />
        )}

        {urgency && (
          <p className="text-[11px] font-medium text-rose italic mb-2">{urgency}</p>
        )}

        {experience.sponsors.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <AvatarStack sponsors={experience.sponsors} size={28} />
            <span className="text-[11px] text-muted-brown">
              {experience.sponsors.length === 1
                ? experience.sponsors[0].display_name
                : `${experience.sponsors.length} gifts`}
            </span>
          </div>
        )}

        {!isFullyFunded && (
          <div className="mt-4">
            <span className="block w-full py-2.5 rounded-full bg-rose text-white text-sm font-medium text-center tracking-wide">
              {isPartiallyFunded ? "Contribute" : "Gift This"}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
