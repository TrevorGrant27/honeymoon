"use client";

import { useState, useEffect } from "react";
import { formatCents, getProgressPercentage } from "@/lib/utils";
import { ProgressBar } from "@/components/ProgressBar";
import { AvatarStack } from "@/components/Avatar";
import type { ExperienceWithSponsors, DashboardStats } from "@/types/database";

const EMOJI_OPTIONS = [
  "🍽️", "🥂", "🍷", "☕", "🧁", "🏨", "🏰", "🌅", "🎡", "🗼",
  "🎭", "🚗", "✈️", "🚂", "⛵", "🎁", "💐", "📸", "🎶", "💆",
  "🏖️", "🎿", "🏔️", "🌊", "🏛️", "🎨", "🛍️", "🍕", "🧀", "✨",
];

type Tab = "experiences" | "sponsors";

interface SponsorWithExperience {
  id: string;
  experience_id: string;
  display_name: string;
  photo_url: string | null;
  note: string | null;
  amount_cents: number;
  email: string;
  stripe_session_id: string;
  created_at: string;
  experience_title: string;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("experiences");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [experiences, setExperiences] = useState<ExperienceWithSponsors[]>([]);
  const [sponsors, setSponsors] = useState<SponsorWithExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("dining");
  const [formPrice, setFormPrice] = useState("");
  const [formEmoji, setFormEmoji] = useState("✨");
  const [formAllowSplitting, setFormAllowSplitting] = useState(true);
  const [formMinSplit, setFormMinSplit] = useState("50");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, expRes, sponRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/experiences"),
        fetch("/api/admin/sponsors"),
      ]);

      if (statsRes.status === 401 || expRes.status === 401) {
        window.location.href = "/admin";
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData && !statsData.error) setStats(statsData);
      }
      if (expRes.ok) {
        const expData = await expRes.json();
        if (Array.isArray(expData)) setExperiences(expData);
      }
      if (sponRes.ok) {
        const sponData = await sponRes.json();
        if (Array.isArray(sponData)) setSponsors(sponData);
      }
    } catch {
      console.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormTitle("");
    setFormDescription("");
    setFormCategory("dining");
    setFormPrice("");
    setFormEmoji("✨");
    setFormImageUrl("");
    setFormAllowSplitting(true);
    setFormMinSplit("50");
    setFormActive(true);
    setEditingId(null);
    setFormError("");
  }

  function openEditForm(exp: ExperienceWithSponsors) {
    setFormTitle(exp.title);
    setFormDescription(exp.description);
    setFormCategory(exp.category);
    setFormPrice((exp.price_cents / 100).toString());
    setFormEmoji(exp.emoji);
    setFormImageUrl(exp.image_url || "");
    setFormAllowSplitting(exp.allow_splitting);
    setFormMinSplit((exp.min_split_cents / 100).toString());
    setFormActive(exp.is_active);
    setEditingId(exp.id);
    setShowForm(true);
  }

  function duplicateExperience(exp: ExperienceWithSponsors) {
    resetForm();
    setFormTitle(`${exp.title} (Copy)`);
    setFormDescription(exp.description);
    setFormCategory(exp.category);
    setFormPrice((exp.price_cents / 100).toString());
    setFormEmoji(exp.emoji);
    setFormImageUrl(exp.image_url || "");
    setFormAllowSplitting(exp.allow_splitting);
    setFormMinSplit((exp.min_split_cents / 100).toString());
    setFormActive(exp.is_active);
    setShowForm(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSaving(true);
    setFormError("");

    const payload = {
      title: formTitle,
      description: formDescription,
      category: formCategory,
      price_cents: Math.round(parseFloat(formPrice) * 100),
      emoji: formEmoji,
      image_url: formImageUrl.trim() || null,
      allow_splitting: formAllowSplitting,
      min_split_cents: Math.round(parseFloat(formMinSplit) * 100),
      is_active: formActive,
    };

    const url = editingId
      ? `/api/admin/experiences/${editingId}`
      : "/api/admin/experiences";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        loadData();
      } else {
        const data = await res.json().catch(() => null);
        setFormError(data?.error || "Failed to save experience. Please try again.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    }
    setFormSaving(false);
  }

  async function handleDelete(exp: ExperienceWithSponsors) {
    if (!confirm(`Delete "${exp.title}"? This will also remove all sponsor contributions for this experience. This cannot be undone.`)) {
      return;
    }
    await fetch(`/api/admin/experiences/${exp.id}`, { method: "DELETE" });
    loadData();
  }

  async function toggleActive(exp: ExperienceWithSponsors) {
    await fetch(`/api/admin/experiences/${exp.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !exp.is_active }),
    });
    loadData();
  }

  const filteredExperiences = experiences.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-sand border-t-rose rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b-2 border-border sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display font-bold text-xl text-dark-brown">
            Admin Dashboard
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border-2 border-border p-5">
              <p className="text-sm text-warm-brown mb-1">Total Raised</p>
              <p className="font-display font-bold text-2xl text-dark-brown">
                {formatCents(stats.total_raised_cents)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-border p-5">
              <p className="text-sm text-warm-brown mb-1">Sponsors</p>
              <p className="font-display font-bold text-2xl text-dark-brown">
                {stats.total_sponsors}
              </p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-border p-5">
              <p className="text-sm text-warm-brown mb-1">Fully Funded</p>
              <p className="font-display font-bold text-2xl text-dark-brown">
                {stats.fully_funded_count}
              </p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-border p-5">
              <p className="text-sm text-warm-brown mb-1">Avg Gift</p>
              <p className="font-display font-bold text-2xl text-dark-brown">
                {formatCents(stats.average_gift_cents)}
              </p>
            </div>
          </div>
        )}

        {/* Overall Progress */}
        {stats && (
          <div className="bg-white rounded-2xl border-2 border-border p-5 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-warm-brown font-medium">
                Overall Funding Progress
              </span>
              <span className="text-sm text-muted-brown">
                {stats.fully_funded_count} of {stats.total_experiences} experiences funded
              </span>
            </div>
            <ProgressBar
              funded={stats.total_raised_cents}
              total={
                experiences.reduce((sum, e) => sum + e.price_cents, 0) || 1
              }
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-sand rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setTab("experiences")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "experiences"
                ? "bg-white text-dark-brown shadow-sm"
                : "text-warm-brown hover:text-dark-brown"
            }`}
          >
            Experiences ({experiences.length})
          </button>
          <button
            onClick={() => setTab("sponsors")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === "sponsors"
                ? "bg-white text-dark-brown shadow-sm"
                : "text-warm-brown hover:text-dark-brown"
            }`}
          >
            Sponsors ({sponsors.length})
          </button>
        </div>

        {/* Experiences Tab */}
        {tab === "experiences" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border-2 border-border text-dark-brown focus:border-rose focus:outline-none"
              />
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="btn-primary px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose to-deep-rose text-white font-semibold whitespace-nowrap"
              >
                + Add Experience
              </button>
            </div>

            {/* Experience Form Modal */}
            {showForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-dark-brown/40">
                <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-cream rounded-[28px] shadow-2xl p-6">
                  <h2 className="font-display font-bold text-xl text-dark-brown mb-5">
                    {editingId ? "Edit Experience" : "Add Experience"}
                  </h2>
                  <form onSubmit={handleFormSubmit}>
                    {/* Emoji Picker */}
                    <label className="block mb-1 text-sm font-medium text-dark-brown">
                      Icon
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {EMOJI_OPTIONS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setFormEmoji(e)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                            formEmoji === e
                              ? "bg-rose/20 border-2 border-rose"
                              : "bg-sand border-2 border-transparent hover:bg-border"
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>

                    <label className="block mb-1 text-sm font-medium text-dark-brown">
                      Image URL <span className="text-muted-brown italic font-normal">(optional — overrides icon)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-border text-dark-brown focus:border-rose focus:outline-none mb-3"
                    />
                    {formImageUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden border-2 border-border h-32">
                        <img
                          src={formImageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <label className="block mb-1 text-sm font-medium text-dark-brown">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-border text-dark-brown focus:border-rose focus:outline-none mb-3"
                    />

                    <label className="block mb-1 text-sm font-medium text-dark-brown">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-border text-dark-brown focus:border-rose focus:outline-none mb-3 resize-none"
                    />

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-dark-brown">
                          Category *
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-border text-dark-brown focus:border-rose focus:outline-none"
                        >
                          <option value="dining">Dining</option>
                          <option value="hotels">Hotels</option>
                          <option value="activities">Activities</option>
                          <option value="transport">Transport</option>
                          <option value="extras">Extras</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-medium text-dark-brown">
                          Price (USD) *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          step="0.01"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-border text-dark-brown focus:border-rose focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Splitting */}
                    <div className="flex items-center gap-3 mb-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formAllowSplitting}
                          onChange={(e) =>
                            setFormAllowSplitting(e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-border rounded-full peer peer-checked:bg-rose transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                      <span className="text-sm text-dark-brown">
                        Allow Splitting
                      </span>
                    </div>

                    {formAllowSplitting && (
                      <div className="mb-3">
                        <label className="block mb-1 text-sm font-medium text-dark-brown">
                          Minimum Contribution (USD)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formMinSplit}
                          onChange={(e) => setFormMinSplit(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-border text-dark-brown focus:border-rose focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-5">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formActive}
                          onChange={(e) => setFormActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-border rounded-full peer peer-checked:bg-rose transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                      <span className="text-sm text-dark-brown">
                        Visible to Guests
                      </span>
                    </div>

                    {formError && (
                      <p className="text-red-600 text-sm text-center mb-3">{formError}</p>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          resetForm();
                        }}
                        className="flex-1 py-3 rounded-xl bg-sand text-warm-brown font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formSaving}
                        className="btn-primary flex-1 py-3 rounded-xl bg-gradient-to-r from-rose to-deep-rose text-white font-semibold disabled:opacity-50"
                      >
                        {formSaving
                          ? "Saving..."
                          : editingId
                          ? "Save Changes"
                          : "Create Experience"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Experiences Table */}
            <div className="bg-white rounded-2xl border-2 border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-sand text-left">
                      <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                        Experience
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                        Sponsors
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                        Active
                      </th>
                      <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExperiences.map((exp, i) => (
                      <tr
                        key={exp.id}
                        className={`border-t border-border ${
                          !exp.is_active ? "opacity-50" : ""
                        } ${i % 2 === 1 ? "bg-cream/50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{exp.emoji}</span>
                            <span className="font-medium text-dark-brown text-sm">
                              {exp.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-warm-brown capitalize">
                          {exp.category}
                        </td>
                        <td className="px-4 py-3 text-sm font-display font-semibold text-dark-brown">
                          {formatCents(exp.price_cents)}
                        </td>
                        <td className="px-4 py-3 w-32">
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              funded={exp.funded_cents}
                              total={exp.price_cents}
                              animated={false}
                              className="flex-1"
                            />
                            <span className="text-xs text-muted-brown">
                              {getProgressPercentage(
                                exp.funded_cents,
                                exp.price_cents
                              )}
                              %
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {exp.sponsors.length > 0 ? (
                            <AvatarStack
                              sponsors={exp.sponsors}
                              size={28}
                              maxDisplay={3}
                            />
                          ) : (
                            <span className="text-xs text-muted-brown">
                              None
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(exp)}
                            className="relative inline-flex items-center cursor-pointer"
                          >
                            <div
                              className={`w-10 h-5 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${
                                exp.is_active
                                  ? "bg-rose after:translate-x-5"
                                  : "bg-border"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEditForm(exp)}
                              className="text-sm text-rose hover:text-deep-rose font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => duplicateExperience(exp)}
                              className="text-sm text-warm-brown hover:text-dark-brown font-medium"
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleDelete(exp)}
                              className="text-sm text-red-500 hover:text-red-700 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredExperiences.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">🌴</span>
                  <p className="text-warm-brown">
                    No experiences yet. Add your first one!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sponsors Tab */}
        {tab === "sponsors" && (
          <div className="bg-white rounded-2xl border-2 border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-sand text-left">
                    <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-warm-brown uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sponsors.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-t border-border ${
                        i % 2 === 1 ? "bg-cream/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-dark-brown text-sm">
                          {s.display_name}
                        </span>
                        {s.note && (
                          <p className="text-xs text-muted-brown mt-0.5 truncate max-w-[200px]">
                            &ldquo;{s.note}&rdquo;
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-warm-brown">
                        {s.experience_title}
                      </td>
                      <td className="px-4 py-3 text-sm font-display font-semibold text-dark-brown">
                        {formatCents(s.amount_cents)}
                      </td>
                      <td className="px-4 py-3 text-sm text-warm-brown">
                        {s.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-brown">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sponsors.length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📣</span>
                <p className="text-warm-brown">
                  No sponsors yet. Share your registry link to get started!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
