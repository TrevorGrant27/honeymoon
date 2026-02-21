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
      .then((res) => res.json())
      .then((data) => {
        setExperiences(data);
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
      <section className="relative overflow-hidden bg-gradient-to-b from-sand via-cream to-cream">
        <div className="relative max-w-3xl mx-auto px-4 pt-20 pb-16 sm:pt-28 sm:pb-20 text-center">
          <p className="font-display italic text-warm-brown text-lg sm:text-xl mb-3 tracking-wide">
            The Honeymoon of
          </p>
          <h1 className="font-display font-bold text-5xl sm:text-7xl text-dark-brown mb-2 leading-[1.1]">
            Trevor &amp; Carly
          </h1>
          <p className="divider-ornament text-muted-brown text-sm max-w-xs mx-auto my-6">
            &hearts;
          </p>
          <p className="text-warm-brown text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Help us create unforgettable memories on our honeymoon.
            Each experience below is a moment you can gift us — from
            sunset dinners to adventures we&apos;ll treasure forever.
          </p>
          <a
            href="#experiences"
            className="btn-primary inline-block px-10 py-4 rounded-full bg-rose text-white font-medium text-base tracking-wide shadow-sm"
          >
            Explore Our Registry
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <span className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown">
                {formatCents(stats.totalRaised)}
              </span>
              <p className="text-xs text-muted-brown mt-1 tracking-wide uppercase">Raised</p>
            </div>
            <div>
              <span className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown">
                {stats.sponsorCount}
              </span>
              <p className="text-xs text-muted-brown mt-1 tracking-wide uppercase">Gifts</p>
            </div>
            <div>
              <span className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown">
                {stats.total > 0
                  ? getProgressPercentage(stats.totalRaised, stats.totalPrice)
                  : 0}
                %
              </span>
              <p className="text-xs text-muted-brown mt-1 tracking-wide uppercase">Funded</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProgressBar
              funded={stats.totalRaised}
              total={stats.totalPrice}
              className="flex-1"
            />
            <span className="text-xs text-muted-brown whitespace-nowrap">
              {stats.funded} of {stats.total} complete
            </span>
          </div>
        </div>
      </section>

      {/* Experience Grid */}
      <section id="experiences" className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="font-display font-semibold text-2xl sm:text-3xl text-dark-brown text-center mb-2">
          Our Experiences
        </h2>
        <p className="text-muted-brown text-center text-sm mb-10">
          Choose a memory to gift us
        </p>

        <div className="mb-10">
          <CategoryFilter
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-border border-t-rose rounded-full animate-spin" />
            <p className="text-muted-brown mt-4 text-sm">Loading experiences...</p>
          </div>
        ) : available.length === 0 && fullyFunded.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-brown">
              No experiences found in this category.
            </p>
          </div>
        ) : (
          <>
            {available.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
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
              <div className="mt-14">
                <button
                  onClick={() => setShowFunded(!showFunded)}
                  className="w-full flex items-center justify-center gap-3 py-3 text-muted-brown hover:text-warm-brown transition-colors"
                >
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium whitespace-nowrap tracking-wide uppercase">
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
                  <div className="h-px flex-1 bg-border" />
                </button>

                {showFunded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 mt-8">
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
      <footer className="text-center py-10 border-t border-border">
        <p className="font-display italic text-muted-brown text-sm">
          Made with love for Trevor &amp; Carly&apos;s adventure
        </p>
        <a
          href="/admin"
          className="inline-block mt-3 text-xs text-muted-brown/40 hover:text-warm-brown transition-colors"
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
