"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getSimilarBusinesses } from "@/lib/api";
import type { SimilarBusiness } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Zap, Building2, ExternalLink, AlertTriangle } from "lucide-react";

const STAGE_COLOR: Record<string, string> = {
  startup: "bg-green-900/30 text-green-300 border-green-500/30",
  "scale-up": "bg-blue-900/30 text-blue-300 border-blue-500/30",
  enterprise: "bg-purple-900/30 text-purple-300 border-purple-500/30",
};

interface Props {
  category: string;
  businessName: string;
  description: string;
  country: string;
  /** When true the component fetches on mount. Default true. */
  autoFetch?: boolean;
}

export default function SimilarBusinesses({
  category,
  businessName,
  description,
  country,
  autoFetch = true,
}: Props) {
  const [businesses, setBusinesses] = useState<SimilarBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  async function fetch() {
    if (!category || !businessName || !description) return;
    setLoading(true);
    setError(null);
    try {
      const { businesses: biz } = await getSimilarBusinesses({
        business_category: category,
        business_name: businessName,
        business_description: description,
        country,
      });
      setBusinesses(biz);
      setFetched(true);
    } catch {
      setError("Couldn't load similar businesses. Check your API connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoFetch) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="flex items-start gap-2 rounded-xl bg-red-900/20 border border-red-500/20 p-4 text-red-300 text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{error}</span>
    </div>
  );

  if (!fetched && !autoFetch) return (
    <button
      onClick={fetch}
      className="w-full rounded-xl border border-dashed border-indigo-500/40 py-6 text-indigo-400 hover:bg-indigo-900/20 transition text-sm"
    >
      🔍 Load similar businesses in {country}
    </button>
  );

  if (businesses.length === 0) return null;

  return (
    <div className="space-y-3">
      {businesses.map((b, i) => (
        <motion.div
          key={b.name}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-xl bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
              <span className="font-semibold text-white truncate">{b.name}</span>
              {b.founded_year && (
                <span className="text-gray-500 text-xs shrink-0">est. {b.founded_year}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {b.stage && (
                <Badge variant="outline" className={`text-xs ${STAGE_COLOR[b.stage] ?? ""}`}>
                  {b.stage}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs text-gray-400 border-white/10 gap-1">
                <Globe className="h-2.5 w-2.5" />{b.country}
              </Badge>
            </div>
          </div>

          <p className="text-gray-400 text-sm mt-1.5">{b.description}</p>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <div className="flex items-start gap-1.5 text-xs text-yellow-300/80 bg-yellow-900/10 border border-yellow-500/20 rounded-lg px-2 py-1">
              <Zap className="h-3 w-3 shrink-0 mt-0.5" />
              <span><span className="font-medium">Similar: </span>{b.similarity}</span>
            </div>
            <div className="flex items-start gap-1.5 text-xs text-indigo-300/80 bg-indigo-900/10 border border-indigo-500/20 rounded-lg px-2 py-1">
              <span><span className="font-medium">Their edge: </span>{b.key_differentiator}</span>
            </div>
          </div>

          {b.website && (
            <a
              href={`https://${b.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-indigo-400 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />{b.website}
            </a>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/** Standalone card wrapper for the dashboard */
export function SimilarBusinessesCard(props: Props) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          🏢 Similar Businesses in {props.country}
        </CardTitle>
        <p className="text-gray-400 text-xs">Companies already serving a similar market in your region</p>
      </CardHeader>
      <CardContent>
        <SimilarBusinesses {...props} />
      </CardContent>
    </Card>
  );
}
