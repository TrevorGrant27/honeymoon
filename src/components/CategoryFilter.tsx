"use client";

import { getCategoryEmoji } from "@/lib/utils";
import type { Category } from "@/types/database";

const CATEGORIES: Array<{ value: Category | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "dining", label: "Dining" },
  { value: "hotels", label: "Hotels" },
  { value: "activities", label: "Activities" },
  { value: "transport", label: "Transport" },
  { value: "extras", label: "Extras" },
];

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="relative">
      <div className="flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:overflow-visible">
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onChange(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? "bg-coral/10 border-2 border-coral text-dark-brown"
                  : "bg-sand border-2 border-transparent text-warm-brown hover:border-border"
              }`}
            >
              {cat.value !== "all" && (
                <span className="mr-1.5">{getCategoryEmoji(cat.value)}</span>
              )}
              {cat.label}
            </button>
          );
        })}
      </div>
      {/* Fade edges on mobile */}
      <div className="pointer-events-none absolute top-0 right-0 bottom-2 w-8 bg-gradient-to-l from-cream to-transparent sm:hidden" />
    </div>
  );
}
