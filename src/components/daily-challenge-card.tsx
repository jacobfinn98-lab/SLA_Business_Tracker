"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface DailyChallengeCardProps {
  id: string;
  title: string;
  description: string;
  rpValue: number;
  submissionStatus: "none" | "pending" | "approved" | "rejected";
}

export function DailyChallengeCard({
  id,
  title,
  description,
  rpValue,
  submissionStatus,
}: DailyChallengeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localStatus, setLocalStatus] = useState(submissionStatus);

  async function handleSubmit() {
    if (!acknowledged || localStatus !== "none") return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/challenge-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: id, goodFaithAcknowledged: true }),
      });
      if (res.ok) {
        setLocalStatus("pending");
        setExpanded(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const statusColor = {
    none: "border-gray-200 bg-white",
    pending: "border-yellow-300 bg-yellow-50",
    approved: "border-green-300 bg-green-50",
    rejected: "border-red-300 bg-red-50",
  }[localStatus];

  const StatusIcon =
    localStatus === "approved"
      ? CheckCircle2
      : Circle;

  return (
    <div className={`rounded-xl border-2 ${statusColor} transition-colors`}>
      <button
        onClick={() => setExpanded((x) => !x)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon
            size={20}
            className={
              localStatus === "approved"
                ? "text-green-500 shrink-0"
                : localStatus === "pending"
                ? "text-yellow-500 shrink-0"
                : "text-gray-300 shrink-0"
            }
          />
          <span className="font-semibold text-gray-900 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-sla-gold bg-sla-gold/10 rounded-full px-2 py-0.5">
            {rpValue} RP
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
          <p className="text-sm text-gray-600">{description}</p>

          {localStatus === "none" && (
            <>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 accent-sla-gold"
                />
                <span className="text-sm text-gray-700">
                  I confirm in good faith that I completed this challenge today.
                </span>
              </label>
              <button
                onClick={handleSubmit}
                disabled={!acknowledged || submitting}
                className="flex items-center gap-2 bg-sla-navy text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-sla-navy-light transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Submit for Approval
              </button>
            </>
          )}

          {localStatus === "pending" && (
            <p className="text-sm text-yellow-700 font-medium">
              Pending mentor review
            </p>
          )}
          {localStatus === "approved" && (
            <p className="text-sm text-green-700 font-medium">
              Approved — {rpValue} RP credited
            </p>
          )}
          {localStatus === "rejected" && (
            <p className="text-sm text-red-700 font-medium">
              Rejected — contact your mentor
            </p>
          )}
        </div>
      )}
    </div>
  );
}
