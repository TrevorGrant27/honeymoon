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

  useEffect(() => {
    fetch("/api/experiences")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load experiences");
        return res.json();
      })
      .then((data) => {
        setExperiences(Array.isArray(data) ? data : []);
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
      {/* Hero — Provençal golden light */}
      <section className="relative overflow-hidden hero-provence">
        <div className="absolute inset-0 watercolor-wash" />

        {/* Decorative accent lines */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-champagne/40 to-transparent" />

        <div className="relative max-w-3xl mx-auto px-4 pt-28 pb-24 sm:pt-36 sm:pb-28 text-center">
          <p className="text-muted-brown text-xs sm:text-sm mb-6 tracking-[0.35em] uppercase">
            The Honeymoon of
          </p>
          <h1 className="font-display font-bold text-5xl sm:text-7xl lg:text-8xl text-dark-brown mb-4 leading-[1.05] italic">
            Trevor &amp; Carly
          </h1>
          <div className="divider-ornament text-champagne text-sm max-w-[200px] mx-auto my-8">
            <span className="text-lavender">&#x269C;</span>
          </div>
          <p className="text-warm-brown text-base sm:text-lg max-w-lg mx-auto leading-relaxed italic">
            Help us create unforgettable memories on our honeymoon.
            Each experience below is a moment you can gift us &mdash; from
            sunset dinners to adventures we&apos;ll treasure forever.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </section>

      {/* Stats Bar */}
      {hasGifts && (
        <section className="bg-linen/60 border-b border-border-soft">
          <div className="max-w-3xl mx-auto px-4 py-7">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <span className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown">
                  {formatCents(stats.totalRaised)}
                </span>
                <p className="text-[11px] text-muted-brown mt-1.5 tracking-[0.2em] uppercase">Raised</p>
              </div>
              <div>
                <span className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown">
                  {stats.sponsorCount}
                </span>
                <p className="text-[11px] text-muted-brown mt-1.5 tracking-[0.2em] uppercase">Gifts</p>
              </div>
              <div>
                <span className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown">
                  {stats.total > 0
                    ? getProgressPercentage(stats.totalRaised, stats.totalPrice)
                    : 0}
                  %
                </span>
                <p className="text-[11px] text-muted-brown mt-1.5 tracking-[0.2em] uppercase">Funded</p>
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
      <section id="experiences" className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {available.map((exp) => (
                <ExperienceCard
                  key={exp.id}
                  experience={exp}
                  onClick={handleCardClick}
                />
              ))}
              {fullyFunded.map((exp) => (
                <ExperienceCard
                  key={exp.id}
                  experience={exp}
                  onClick={handleCardClick}
                />
              ))}
            </div>

            {available.length === 0 && fullyFunded.length > 0 && (
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
      <footer className="text-center py-14 bg-linen/40">
        <div className="divider-ornament text-champagne text-sm max-w-[120px] mx-auto mb-6">
          <span className="text-lavender">&#x269C;</span>
        </div>
        <p className="font-display italic text-muted-brown text-sm">
          Made with love for Trevor &amp; Carly&apos;s adventure
        </p>
        <a
          href="/admin"
          className="inline-block mt-4 text-[11px] text-muted-brown/20 hover:text-warm-brown transition-colors"
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
