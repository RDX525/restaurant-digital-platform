"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Brain,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import type { AiInsightRecord } from "@/lib/intelligence/types";
import { getErrorMessage } from "@/lib/utils";
import { useActiveRestaurant } from "@/hooks/useActiveRestaurant";
import { DashboardResourceGate } from "@/components/dashboard/DashboardResourceGate";

const SAMPLE_QUESTIONS = [
  "What were my best-selling dishes?",
  "How much revenue did I make last week?",
  "Which day was weakest?",
  "How many returning customers did I have?",
];

export function IntelligenceDashboard() {
  const {
    restaurantId,
    loading: restaurantLoading,
    error: restaurantError,
  } = useActiveRestaurant();
  const [brief, setBrief] = useState<string | null>(null);
  const [insights, setInsights] = useState<AiInsightRecord[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [menuDraft, setMenuDraft] = useState({
    itemName: "",
    category: "",
    ingredients: "",
    notes: "",
    tone: "friendly" as "friendly" | "elegant" | "casual",
  });
  const [menuDescription, setMenuDescription] = useState<string | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const loadBrief = useCallback(async () => {
    if (!restaurantId) return;
    setLoadingBrief(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/intelligence/brief`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load brief");
      setBrief(payload.brief ?? null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingBrief(false);
    }
  }, [restaurantId]);

  const loadInsights = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/intelligence/insights?limit=10`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to load insights");
      setInsights(payload.insights ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    void loadBrief();
    void loadInsights();
  }, [loadBrief, loadInsights, restaurantId]);

  async function handleAsk(selectedQuestion?: string) {
    const prompt = (selectedQuestion ?? question).trim();
    if (prompt.length < 3) return;

    setAsking(true);
    setError(null);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/intelligence/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to ask restaurant");
      setAnswer(payload.answer ?? null);
      setQuestion(prompt);
      await loadInsights();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAsking(false);
    }
  }

  async function handleGenerateDescription() {
    if (!menuDraft.itemName.trim()) return;
    setGeneratingDescription(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/intelligence/menu-description`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(menuDraft),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to generate description");
      setMenuDescription(payload.draft ?? null);
      await loadInsights();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingDescription(false);
    }
  }

  if (restaurantLoading || restaurantError || !restaurantId) {
    return (
      <DashboardResourceGate
        loading={restaurantLoading}
        error={restaurantError}
        ready={Boolean(restaurantId)}
      >
        {null}
      </DashboardResourceGate>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="dashboard-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-pine-900/10 p-3 text-pine-900">
              <Brain className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-xl text-pine-900">Daily Restaurant Brief</h2>
              <p className="text-sm text-pine-600">
                Patterns and comparisons from verified paid-order data.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadBrief()}
            className="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
        </div>
        {loadingBrief ? (
          <p className="text-sm text-pine-600">Generating brief from verified metrics…</p>
        ) : (
          <p className="text-base leading-relaxed text-pine-800">{brief ?? "No brief available yet."}</p>
        )}
      </section>

      <section className="dashboard-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-pine-900/10 p-3 text-pine-900">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-xl text-pine-900">Ask Your Restaurant</h2>
            <p className="text-sm text-pine-600">
              Answers are grounded in approved database tools — never invented metrics.
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => void handleAsk(sample)}
              className="rounded-full border border-pine-200 px-3 py-1.5 text-sm text-pine-700 hover:bg-cream-50"
            >
              {sample}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about revenue, menu performance, customers…"
            className="input-field flex-1"
          />
          <button
            type="button"
            onClick={() => void handleAsk()}
            disabled={asking}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {asking ? "Analyzing…" : "Ask"}
          </button>
        </div>

        {answer ? (
          <div className="mt-4 rounded-2xl bg-cream-50 px-4 py-3 text-sm leading-relaxed text-pine-800">
            {answer}
          </div>
        ) : null}
      </section>

      <section className="dashboard-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl bg-pine-900/10 p-3 text-pine-900">
            <Wand2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-xl text-pine-900">Menu Description Draft</h2>
            <p className="text-sm text-pine-600">
              AI drafts copy for staff approval — nothing is published automatically.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={menuDraft.itemName}
            onChange={(event) => setMenuDraft((current) => ({ ...current, itemName: event.target.value }))}
            placeholder="Item name"
            className="input-field"
          />
          <input
            value={menuDraft.category}
            onChange={(event) => setMenuDraft((current) => ({ ...current, category: event.target.value }))}
            placeholder="Category (optional)"
            className="input-field"
          />
          <input
            value={menuDraft.ingredients}
            onChange={(event) => setMenuDraft((current) => ({ ...current, ingredients: event.target.value }))}
            placeholder="Ingredients (optional)"
            className="input-field sm:col-span-2"
          />
          <textarea
            value={menuDraft.notes}
            onChange={(event) => setMenuDraft((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Notes for the draft (optional)"
            className="input-field min-h-24 sm:col-span-2"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={menuDraft.tone}
            onChange={(event) =>
              setMenuDraft((current) => ({
                ...current,
                tone: event.target.value as "friendly" | "elegant" | "casual",
              }))
            }
            className="input-field w-auto"
          >
            <option value="friendly">Friendly tone</option>
            <option value="elegant">Elegant tone</option>
            <option value="casual">Casual tone</option>
          </select>
          <button
            type="button"
            onClick={() => void handleGenerateDescription()}
            disabled={generatingDescription || !menuDraft.itemName.trim()}
            className="btn-primary"
          >
            {generatingDescription ? "Drafting…" : "Generate draft"}
          </button>
        </div>

        {menuDescription ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-pine-800">
            <p className="mb-2 font-semibold text-amber-900">Draft — review before publishing</p>
            {menuDescription}
          </div>
        ) : null}
      </section>

      <section className="dashboard-card p-6">
        <h2 className="mb-4 font-display text-xl text-pine-900">Recent Insights</h2>
        {insights.length === 0 ? (
          <p className="text-sm text-pine-600">Insights will appear here as you use Intelligence.</p>
        ) : (
          <ul className="space-y-3">
            {insights.map((insight) => (
              <li key={insight.id} className="rounded-2xl border border-pine-100 px-4 py-3">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-pine-500">
                  <span>{insight.insight_type.replaceAll("_", " ")}</span>
                  <span>•</span>
                  <span>{new Date(insight.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm leading-relaxed text-pine-800">{insight.generated_text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
