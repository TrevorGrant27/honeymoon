"use client";

import { useState, useEffect, useMemo } from "react";
import { ExperienceCard } from "@/components/ExperienceCard";
import { ExperienceDetail } from "@/components/ExperienceDetail";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ProgressBar } from "@/components/ProgressBar";
import { formatCents, getProgressPercentage } from "@/lib/utils";
import type { ExperienceWithSponsors } from "@/types/database";

export default function HomePage() {
  const [experiences, setExperiences] = useState<ExperienceWithSponsors[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceWithSponsors | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showFunded, setShowFunded] = useState(false);

  useEffect(() => {
    fetch("/api/experiences")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setExperiences(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = experiences.length;
    const funded = experiences.filter(
      (e) => e.funded_cents >= e.price_cents
    ).length;
    const totalRaised = experiences.reduce(
      (sum, e) => sum + e.funded_cents,
      0
    );
    const totalPrice = experiences.reduce(
      (sum, e) => sum + e.price_cents,
      0
    );
    const sponsorCount = experiences.reduce(
      (sum, e) => sum + (e.sponsors?.length || 0),
      0
    );
    return { total, funded, totalRaised, totalPrice, sponsorCount };
  }, [experiences]);

  const hasGifts = stats.sponsorCount > 0;

  const { available, fullyFunded } = useMemo(() => {
    let list =
      selectedCategory === "all"
        ? experiences
        : experiences.filter((e) => e.category === selectedCategory);

    const avail = list
      .filter((e) => e.funded_cents < e.price_cents)
      .sort((a, b) => a.display_order - b.display_order);

    const funded = list
      .filter((e) => e.funded_cents >= e.price_cents)
      .sort((a, b) => a.display_order - b.display_order);

    return { available: avail, fullyFunded: funded };
  }, [experiences, selectedCategory]);

  function handleCardClick(exp: ExperienceWithSponsors) {
    setSelectedExperience(exp);
    setDetailOpen(true);
  }

  function handleSponsor(exp: ExperienceWithSponsors, amountCents?: number) {
    const url = amountCents
      ? `/checkout/${exp.id}?amount=${amountCents}`
      : `/checkout/${exp.id}`;
    window.location.href = url;
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden watercolor-wash">
        <div className="absolute inset-0 bg-gradient-to-b from-linen/80 via-blush-wash/40 to-cream" />
        <div className="relative max-w-3xl mx-auto px-4 pt-24 pb-20 sm:pt-32 sm:pb-24 text-center">
          <p className="font-display italic text-warm-brown text-lg sm:text-xl mb-4 tracking-widest">
            The Honeymoon of
          </p>
          <h1 className="font-display font-bold text-5xl sm:text-7xl lg:text-8xl text-dark-brown mb-3 leading-[1.05] italic">
            Trevor &amp; Carly
          </h1>
          <p className="divider-ornament text-petal text-sm max-w-[200px] mx-auto my-8">
            &hearts;
          </p>
          <p className="text-warm-brown text-base sm:text-lg max-w-lg mx-auto mb-12 leading-relaxed italic">
            Help us create unforgettable memories on our honeymoon.
            Each experience below is a moment you can gift us &mdash; from
            sunset dinners to adventures we&apos;ll treasure forever.
          </p>
        </div>
      </section>

      {/* Stats Bar — only shown once gifts exist */}
      {hasGifts && (
        <section className="border-y border-border-soft">
          <div className="max-w-3xl mx-auto px-4 py-7">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <span className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown">
                  {formatCents(stats.totalRaised)}
                </span>
                <p className="text-[11px] text-muted-brown mt-1.5 tracking-widest uppercase">Raised</p>
              </div>
              <div>
                <span className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown">
                  {stats.sponsorCount}
                </span>
                <p className="text-[11px] text-muted-brown mt-1.5 tracking-widest uppercase">Gifts</p>
              </div>
              <div>
                <span className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown">
                  {stats.total > 0
                    ? getProgressPercentage(stats.totalRaised, stats.totalPrice)
                    : 0}
                  %
                </span>
                <p className="text-[11px] text-muted-brown mt-1.5 tracking-widest uppercase">Funded</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar
                funded={stats.totalRaised}
                total={stats.totalPrice}
                className="flex-1"
              />
              <span className="text-[11px] text-muted-brown whitespace-nowrap">
                {stats.funded} of {stats.total} complete
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Experience Grid */}
      <section id="experiences" className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown text-center mb-2 italic">
          Our Experiences
        </h2>
        <p className="text-muted-brown text-center text-sm mb-12">
          Choose a memory to gift us
        </p>

        <div className="mb-12">
          <CategoryFilter
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-border border-t-rose rounded-full animate-spin" />
            <p className="text-muted-brown mt-4 text-sm italic">Loading experiences...</p>
          </div>
        ) : available.length === 0 && fullyFunded.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-brown italic">
              No experiences found in this category.
            </p>
          </div>
        ) : (
          <>
            {available.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {available.map((exp) => (
                  <ExperienceCard
                    key={exp.id}
                    experience={exp}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}

            {fullyFunded.length > 0 && (
              <div className="mt-16">
                <button
                  onClick={() => setShowFunded(!showFunded)}
                  className="w-full flex items-center justify-center gap-3 py-3 text-muted-brown hover:text-warm-brown transition-colors"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-petal to-transparent" />
                  <span className="text-[11px] font-medium whitespace-nowrap tracking-widest uppercase">
                    {showFunded ? "Hide" : "View"} {fullyFunded.length} fully gifted
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${showFunded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-petal to-transparent" />
                </button>

                {showFunded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                    {fullyFunded.map((exp) => (
                      <ExperienceCard
                        key={exp.id}
                        experience={exp}
                        onClick={handleCardClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {available.length === 0 && fullyFunded.length > 0 && !showFunded && (
              <div className="text-center py-12">
                <p className="font-display italic text-warm-brown text-lg">
                  Every experience in this category has been gifted!
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-12">
        <div className="divider-ornament text-petal text-sm max-w-[120px] mx-auto mb-6">
          &hearts;
        </div>
        <p className="font-display italic text-muted-brown text-sm">
          Made with love for Trevor &amp; Carly&apos;s adventure
        </p>
        <a
          href="/admin"
          className="inline-block mt-3 text-[11px] text-muted-brown/30 hover:text-warm-brown transition-colors"
        >
          Admin
        </a>
      </footer>

      <ExperienceDetail
        experience={selectedExperience}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSponsor={handleSponsor}
      />
    </main>
  );
}
