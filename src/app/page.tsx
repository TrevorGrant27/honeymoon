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

  // Stats
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

  // Split into available and fully funded
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coral/10 via-cream to-sand" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M30 5 C20 20, 5 20, 5 35 C5 50, 30 55, 30 55 C30 55, 55 50, 55 35 C55 20, 40 20, 30 5Z\" fill=\"%23E8927C\"/%3E%3C/svg%3E')", backgroundSize: "60px 60px" }} />
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="text-4xl">✈️</span>
            <span className="text-4xl">🌴</span>
            <span className="text-4xl">🌅</span>
          </div>
          <p className="text-warm-brown text-sm font-medium tracking-widest uppercase mb-4">
            The Honeymoon of
          </p>
          <h1 className="font-display font-bold text-5xl sm:text-7xl text-dark-brown mb-4 leading-tight">
            Trevor &amp; Carly
          </h1>
          <p className="text-warm-brown text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Help us create unforgettable memories on our honeymoon. Each
            experience below is a moment you can gift us — from sunset dinners
            to adventures we&apos;ll treasure forever.
          </p>
          <a
            href="#experiences"
            className="btn-primary inline-block px-8 py-4 rounded-[14px] bg-gradient-to-r from-coral to-deep-coral text-white font-semibold text-lg shadow-md"
          >
            Explore Our Trip
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-sand border-y-2 border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-dark-brown">
                {formatCents(stats.totalRaised)}
              </span>
              <p className="text-sm text-warm-brown">Raised</p>
            </div>
            <div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-dark-brown">
                {stats.sponsorCount}
              </span>
              <p className="text-sm text-warm-brown">Sponsors</p>
            </div>
            <div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-dark-brown">
                {stats.total > 0
                  ? getProgressPercentage(stats.totalRaised, stats.totalPrice)
                  : 0}
                %
              </span>
              <p className="text-sm text-warm-brown">Funded</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProgressBar
              funded={stats.totalRaised}
              total={stats.totalPrice}
              className="flex-1"
            />
            <span className="text-sm text-muted-brown whitespace-nowrap">
              {stats.funded} of {stats.total} sponsored
            </span>
          </div>
        </div>
      </section>

      {/* Experience Grid */}
      <section id="experiences" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-display font-bold text-3xl text-dark-brown text-center mb-8">
          Our Experiences
        </h2>

        <div className="mb-8">
          <CategoryFilter
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-sand border-t-coral rounded-full animate-spin" />
            <p className="text-warm-brown mt-4">Loading experiences...</p>
          </div>
        ) : available.length === 0 && fullyFunded.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🌴</span>
            <p className="text-warm-brown">
              No experiences found in this category.
            </p>
          </div>
        ) : (
          <>
            {/* Available experiences */}
            {available.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {available.map((exp) => (
                  <ExperienceCard
                    key={exp.id}
                    experience={exp}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}

            {/* Fully funded section - collapsible */}
            {fullyFunded.length > 0 && (
              <div className="mt-12">
                <button
                  onClick={() => setShowFunded(!showFunded)}
                  className="w-full flex items-center justify-center gap-3 py-3 text-muted-brown hover:text-warm-brown transition-colors"
                >
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {showFunded ? "Hide" : "Show"} {fullyFunded.length} fully sponsored experience{fullyFunded.length !== 1 ? "s" : ""}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showFunded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="h-px flex-1 bg-border" />
                </button>

                {showFunded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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

            {/* Show message if only funded items exist */}
            {available.length === 0 && fullyFunded.length > 0 && !showFunded && (
              <div className="text-center py-12">
                <span className="text-5xl block mb-4">🎉</span>
                <p className="text-warm-brown text-lg">
                  All experiences in this category are fully sponsored!
                </p>
              </div>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-muted-brown text-sm border-t-2 border-border">
        <p>
          Made with love for Trevor &amp; Carly&apos;s honeymoon adventure ✈️
        </p>
        <a
          href="/admin"
          className="inline-block mt-2 text-xs text-muted-brown/50 hover:text-warm-brown transition-colors"
        >
          Admin
        </a>
      </footer>

      {/* Experience Detail Modal */}
      <ExperienceDetail
        experience={selectedExperience}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onSponsor={handleSponsor}
      />
    </main>
  );
}
