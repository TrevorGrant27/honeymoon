"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import type { ExperienceWithSponsors } from "@/types/database";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const preselectedAmount = searchParams.get("amount")
    ? parseInt(searchParams.get("amount")!, 10)
    : undefined;

  const [experience, setExperience] = useState<ExperienceWithSponsors | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/experiences/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (data.funded_cents >= data.price_cents) {
          setError("This experience is already fully funded!");
        }
        setExperience(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Experience not found.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-sand border-t-coral rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl block mb-4">😔</span>
          <p className="text-warm-brown text-lg">{error || "Something went wrong."}</p>
          <a
            href="/"
            className="inline-block mt-4 px-6 py-3 rounded-[14px] bg-gradient-to-r from-coral to-deep-coral text-white font-semibold"
          >
            Back to Experiences
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-sand border-b-2 border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-warm-brown hover:text-dark-brown transition-colors">
            &larr; Back to Experiences
          </a>
          <span className="font-display font-semibold text-dark-brown">
            Trevor &amp; Carly
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <CheckoutForm experience={experience} preselectedAmountCents={preselectedAmount} />
      </div>
    </main>
  );
}
