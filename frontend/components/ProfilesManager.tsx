"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listProfiles, updateProfile, deleteProfile, getCategories } from "@/lib/api";
import type { ProfileSummary } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil, Trash2, CheckCircle2, Plus, Building2, Globe,
  DollarSign, TrendingDown, Zap, Users, AlertTriangle,
} from "lucide-react";
import { useProfileStore } from "@/lib/store";

const COUNTRIES = ["Singapore", "Indonesia", "Malaysia", "Thailand", "Vietnam", "Philippines", "Myanmar", "Cambodia", "Laos", "Brunei"];

interface EditForm {
  business_name: string;
  business_category: string;
  business_description: string;
  country: string;
  monthly_revenue: string;
  monthly_burn: string;
  cash_reserve: string;
  team_size: string;
}

export default function ProfilesManager() {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { activeSessionId: activeId, setActiveSessionId } = useProfileStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ profiles: p }, { categories: c }] = await Promise.all([
        listProfiles(),
        getCategories(),
      ]);
      setProfiles(p);
      setCategories(c);
    } catch {
      setError("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(p: ProfileSummary) {
    setEditingId(p.session_id);
    setEditForm({
      business_name: p.business_name ?? "",
      business_category: p.business_category ?? "",
      business_description: p.business_description ?? "",
      country: p.country ?? "Singapore",
      monthly_revenue: String(p.monthly_revenue ?? ""),
      monthly_burn: String(p.monthly_burn ?? ""),
      cash_reserve: String(p.cash_reserve ?? ""),
      team_size: String(p.team_size ?? ""),
    });
  }

  async function handleSave() {
    if (!editingId || !editForm) return;
    setSaving(true);
    try {
      await updateProfile(editingId, {
        business_name: editForm.business_name || undefined,
        business_category: editForm.business_category || undefined,
        business_description: editForm.business_description || undefined,
        country: editForm.country || undefined,
        monthly_revenue: editForm.monthly_revenue ? Number(editForm.monthly_revenue) : undefined,
        monthly_burn: editForm.monthly_burn ? Number(editForm.monthly_burn) : undefined,
        cash_reserve: editForm.cash_reserve ? Number(editForm.cash_reserve) : undefined,
        team_size: editForm.team_size ? Number(editForm.team_size) : undefined,
      });
      setEditingId(null);
      setEditForm(null);
      await load();
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProfile(id);
      if (activeId === id) {
        // Pillar 2: clear from Zustand (also clears persisted localStorage)
        setActiveSessionId(null);
      }
      setDeletingId(null);
      await load();
    } catch {
      setError("Failed to delete profile");
    }
  }

  function switchTo(id: string) {
    // Pillar 2: update global store (auto-persists)
    setActiveSessionId(id);
    // Pillar 1: put session ID in the URL so the app is refresh-proof
    router.push(`/dashboard?session=${id}`);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-gray-400">
      <span className="animate-pulse">Loading profiles…</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-900/30 border border-red-500/30 p-3 text-red-300 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <button className="ml-auto underline" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Business Profiles</h2>
          <p className="text-gray-400 text-sm mt-1">{profiles.length} profile{profiles.length !== 1 ? "s" : ""} · switch between them to change your active Strategy Hub</p>
        </div>
        <Link href="/onboarding">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Plus className="h-4 w-4" /> New Profile
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {profiles.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-16 text-center text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold text-white mb-1">No profiles yet</p>
            <p className="text-sm mb-4">Create your first business profile to get started.</p>
            <Link href="/onboarding">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Plus className="h-4 w-4 mr-2" /> Create Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Profile cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => {
          const isActive = p.session_id === activeId;
          const runway =
            p.monthly_burn && p.cash_reserve
              ? Math.max(0, Math.floor(p.cash_reserve / (p.monthly_burn - (p.monthly_revenue ?? 0))))
              : null;

          return (
            <motion.div
              key={p.session_id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className={`relative flex flex-col bg-white/5 border transition-all ${isActive ? "border-indigo-500 ring-1 ring-indigo-500/40" : "border-white/10 hover:border-white/20"}`}>
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-indigo-600/30 text-indigo-300 border-indigo-500/30 text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg pr-16 leading-tight">
                    {p.business_name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {p.business_category && (
                      <Badge variant="outline" className="text-indigo-300 border-indigo-500/30 text-xs">
                        {p.business_category}
                      </Badge>
                    )}
                    {p.country && (
                      <Badge variant="outline" className="text-gray-400 border-white/10 text-xs gap-1">
                        <Globe className="h-2.5 w-2.5" />{p.country}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  {p.business_description && (
                    <p className="text-gray-400 text-xs line-clamp-2">{p.business_description}</p>
                  )}

                  {/* Financials */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {p.monthly_revenue !== undefined && p.monthly_revenue !== null && (
                      <div className="flex items-center gap-1 text-green-400">
                        <DollarSign className="h-3 w-3" />
                        <span>${(p.monthly_revenue).toLocaleString()}/mo</span>
                      </div>
                    )}
                    {p.monthly_burn !== undefined && p.monthly_burn !== null && (
                      <div className="flex items-center gap-1 text-red-400">
                        <TrendingDown className="h-3 w-3" />
                        <span>${(p.monthly_burn).toLocaleString()} burn</span>
                      </div>
                    )}
                    {p.cash_reserve !== undefined && p.cash_reserve !== null && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Zap className="h-3 w-3" />
                        <span>${(p.cash_reserve).toLocaleString()}</span>
                      </div>
                    )}
                    {p.team_size !== undefined && p.team_size !== null && (
                      <div className="flex items-center gap-1 text-indigo-400">
                        <Users className="h-3 w-3" />
                        <span>{p.team_size} ppl</span>
                      </div>
                    )}
                  </div>

                  {runway !== null && (
                    <div className={`text-xs rounded-lg p-2 text-center ${runway <= 6 ? "bg-red-900/20 text-red-400" : runway <= 12 ? "bg-yellow-900/20 text-yellow-400" : "bg-green-900/20 text-green-400"}`}>
                      {runway} months runway
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {!isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/20 text-xs"
                        onClick={() => switchTo(p.session_id)}
                      >
                        Switch to this
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-white/10 px-2"
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 px-2"
                      onClick={() => setDeletingId(p.session_id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingId && editForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-indigo-400" /> Edit Profile
                </h3>
                <button onClick={() => { setEditingId(null); setEditForm(null); }}
                  className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-gray-300 text-sm">Business Name</Label>
                    <Input
                      value={editForm.business_name}
                      onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g. AgroConnect"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Category</Label>
                    <Select
                      value={editForm.business_category}
                      onValueChange={(v) => setEditForm({ ...editForm, business_category: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10">
                        {categories.map((c) => (
                          <SelectItem key={c} value={c} className="text-gray-300 focus:bg-white/10 focus:text-white">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Country</Label>
                    <Select
                      value={editForm.country}
                      onValueChange={(v) => setEditForm({ ...editForm, country: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-gray-300 focus:bg-white/10 focus:text-white">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-gray-300 text-sm">Description</Label>
                    <Textarea
                      value={editForm.business_description}
                      onChange={(e) => setEditForm({ ...editForm, business_description: e.target.value })}
                      className="bg-white/5 border-white/10 text-white resize-none"
                      rows={3}
                      placeholder="What does your business do?"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Monthly Revenue ($)</Label>
                    <Input
                      type="number"
                      value={editForm.monthly_revenue}
                      onChange={(e) => setEditForm({ ...editForm, monthly_revenue: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Monthly Burn ($)</Label>
                    <Input
                      type="number"
                      value={editForm.monthly_burn}
                      onChange={(e) => setEditForm({ ...editForm, monthly_burn: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Cash Reserve ($)</Label>
                    <Input
                      type="number"
                      value={editForm.cash_reserve}
                      onChange={(e) => setEditForm({ ...editForm, cash_reserve: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-gray-300 text-sm">Team Size</Label>
                    <Input
                      type="number"
                      value={editForm.team_size}
                      onChange={(e) => setEditForm({ ...editForm, team_size: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <Button variant="ghost" className="text-gray-400 hover:text-white"
                  onClick={() => { setEditingId(null); setEditForm(null); }}>
                  Cancel
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl bg-gray-900 border border-red-500/30 shadow-2xl p-6 space-y-4"
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-900/30 p-2">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Delete Profile?</h3>
                  <p className="text-gray-400 text-sm">
                    {profiles.find((p) => p.session_id === deletingId)?.business_name ?? "This profile"} will be permanently removed.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" className="text-gray-400 hover:text-white"
                  onClick={() => setDeletingId(null)}>Cancel</Button>
                <Button
                  className="bg-red-600 hover:bg-red-500 text-white"
                  onClick={() => handleDelete(deletingId)}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
