"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchGlossaryTerms,
  fetchCategories,
  createGlossaryTerm,
  deleteGlossaryTerm,
} from "@/lib/api";
import type { GlossaryTerm } from "@/lib/types";

interface GlossaryPanelProps {
  refreshTrigger?: number;
}

export default function GlossaryPanel({ refreshTrigger }: GlossaryPanelProps) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTerms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchGlossaryTerms(
        search || undefined,
        selectedCategory || undefined
      );
      setTerms(data);
    } catch {
      setError("Failed to load glossary terms");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadTerms();
    loadCategories();
  }, [loadTerms, loadCategories, refreshTrigger]);

  const handleAdd = async () => {
    if (!newTerm.trim() || !newDefinition.trim()) return;
    try {
      await createGlossaryTerm({
        term: newTerm.trim(),
        definition: newDefinition.trim(),
        category: newCategory.trim() || "general",
        source: "manual",
      });
      setNewTerm("");
      setNewDefinition("");
      setNewCategory("");
      setIsAdding(false);
      loadTerms();
      loadCategories();
    } catch {
      setError("Failed to add term");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this glossary term?")) return;
    try {
      await deleteGlossaryTerm(id);
      loadTerms();
      loadCategories();
    } catch {
      setError("Failed to delete term");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg">📖 Glossary</h2>
            <p className="text-emerald-100 text-sm">
              {terms.length} term{terms.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            {isAdding ? "Cancel" : "+ Add Term"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="p-4 border-b border-gray-200 bg-emerald-50">
          <input
            type="text"
            placeholder="Term"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
          />
          <textarea
            placeholder="Definition"
            value={newDefinition}
            onChange={(e) => setNewDefinition(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-gray-900"
          />
          <input
            type="text"
            placeholder="Category (optional)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
          />
          <button
            onClick={handleAdd}
            disabled={!newTerm.trim() || !newDefinition.trim()}
            className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Glossary
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="p-4 border-b border-gray-100 space-y-2">
        <input
          type="text"
          placeholder="Search terms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
        />
        {categories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Terms List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-sm">{error}</div>
        ) : terms.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg mb-2">📭</p>
            <p className="text-sm">No glossary terms yet.</p>
            <p className="text-xs mt-1">
              Ask questions in the chat to start building your glossary!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {terms.map((term) => (
              <div
                key={term.id}
                className="p-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {term.term}
                      </h3>
                      {term.category && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                          {term.category}
                        </span>
                      )}
                      {term.source === "chatbox" && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          💬 from chat
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                      {term.definition}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(term.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    title="Delete term"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
