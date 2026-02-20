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

  // Filtered & sorted
  const filtered = useMemo(() => {
    let list =
      selectedCategory === "all"
        ? experiences
        : experiences.filter((e) => e.category === selectedCategory);

    // Sort: available first, then partially funded, then fully funded
    list = [...list].sort((a, b) => {
      const aFull = a.funded_cents >= a.price_cents ? 1 : 0;
      const bFull = b.funded_cents >= b.price_cents ? 1 : 0;
      if (aFull !== bFull) return aFull - bFull;
      return a.display_order - b.display_order;
    });

    return list;
  }, [experiences, selectedCategory]);

  function handleCardClick(exp: ExperienceWithSponsors) {
    setSelectedExperience(exp);
    setDetailOpen(true);
  }

  function handleSponsor(exp: ExperienceWithSponsors) {
    window.location.href = `/checkout/${exp.id}`;
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coral/10 via-cream to-sand" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">🌴</span>
            <p className="text-warm-brown">
              No experiences found in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((exp) => (
              <ExperienceCard
                key={exp.id}
                experience={exp}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-muted-brown text-sm border-t-2 border-border">
        <p>
          Made with love for Trevor &amp; Carly&apos;s honeymoon adventure ✈️
        </p>
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
