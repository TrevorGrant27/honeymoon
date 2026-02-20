"use client";

import { getInitials, getAvatarColor } from "@/lib/utils";

interface AvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, photoUrl, size = 32, className = "" }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`rounded-full object-cover border-[2.5px] border-cream ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center border-[2.5px] border-cream text-white font-medium ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}

interface AvatarStackProps {
  sponsors: Array<{ display_name: string; photo_url: string | null }>;
  maxDisplay?: number;
  size?: number;
}

export function AvatarStack({ sponsors, maxDisplay = 4, size = 32 }: AvatarStackProps) {
  const displayed = sponsors.slice(0, maxDisplay);
  const remaining = sponsors.length - maxDisplay;

  return (
    <div className="flex items-center">
      {displayed.map((sponsor, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -10, zIndex: maxDisplay - i }}>
          <Avatar name={sponsor.display_name} photoUrl={sponsor.photo_url} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="rounded-full flex items-center justify-center border-[2.5px] border-cream bg-sand text-warm-brown font-medium"
          style={{
            width: size,
            height: size,
            marginLeft: -10,
            fontSize: size * 0.34,
            zIndex: 0,
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
