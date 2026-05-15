// Static mock data that is NOT returned by the API.
// All of this is clearly labelled so the team knows what's needed from the backend.

export const EXAMPLE_PROMPTS = [
  "Increase ARPU of mid-ARPU customers by 2% in 30 days.",
  "Reduce prepaid churn by 10% next quarter.",
  "Increase data consumption by 10% over the next quarter.",
  "Engage inactive prepaid customers this month.",
  "Recommend the best campaign opportunity for this month.",
];

// MOCKED: The real API does not expose internal tool call timing or names.
// Future work: expose a trace/audit log from the backend.
export const AGENT_TRACE_TEMPLATE = [
  { tool: "Thinking about the objective",        status: "ok",   ms: 420  },
  { tool: "Performing rule-book calculations",   status: "ok",   ms: 38   },
  { tool: "Finding the best segments",           status: "ok",   ms: 64   },
  { tool: "Reviewing ML models and their scores",status: "ok",   ms: 112  },
  { tool: "Offering selections",                 status: "ok",   ms: 56   },
  { tool: "Assembling the campaign plan",        status: "ok",   ms: 1280 },
  { tool: "Calculating projections",             status: "ok",   ms: 21   },
  { tool: "Generating campaign content",         status: "ok",   ms: 2140 },
  { tool: "Validating the campaign",             status: "warn", ms: 18   },
];

// Enrich trace notes from real API response data
export function buildAgentTrace(campaignData) {
  const notes = [
    `intent=${campaignData?.parsed?.campaign_intent || "—"} · target=${campaignData?.parsed?.target_segment_hint || "—"}`,
    "rulebook eligibility checked",
    `${campaignData?.segments?.length || "—"} segments · ${campaignData?.totalUsers?.toLocaleString() || "—"} eligible users`,
    "model_confidence avg 0.88",
    `Offers selected · ${[...new Set(campaignData?.segments?.map(s => s.tactic.offerId) || [])].length || "—"} unique offer(s)`,
    `Plan drafted · ${campaignData?.segments?.length || "—"} segment cards`,
    `Incremental: RO ${campaignData?.totalImpact?.toFixed(0) || "—"}`,
    `${campaignData?.contentDrafts?.length || "—"} message drafts · approval_required=true`,
    `${campaignData?.validations?.filter(v => v.level === "advisory").length || 0} advisories · ${campaignData?.validations?.filter(v => v.level === "error").length || 0} blocking`,
  ];

  return AGENT_TRACE_TEMPLATE.map((step, i) => ({
    ...step,
    note: notes[i] || "",
  }));
}

// MOCKED: Follow-up chat replies — the API has no /campaign/followup endpoint.
// These are canned responses. Future work: route these to real backend endpoints.
export function buildFollowupReplies(campaignData) {
  const segs = campaignData?.segments || [];
  const firstSeg = segs[0];
  const firstSegId = firstSeg?.id || "—";
  const firstSegName = firstSeg?.name || "—";

  return {
    "channel-why": {
      trace: [
        { tool: "Reviewing ML models and their scores", ms: 92,  status: "ok", note: `${firstSegId} · channel scores loaded` },
        { tool: "explain_channel_tool",                ms: 680, status: "ok", note: "Rationale generated" },
      ],
      traceTotal: "2 tools · 0.77 s",
      text: firstSeg
        ? `For **${firstSegId}**, **${capitalize(firstSeg.bestChannel)}** scored **${(firstSeg.channelScoresRaw[firstSeg.bestChannel] || 0).toFixed(2)}** as the highest channel. Send window ${firstSeg.bestTime} matches peak engagement. Fatigue risk is *${firstSeg.fatigueRisk}*.`
        : "Channel rationale not available.",
      artifacts: firstSeg
        ? [{ kind: "drawer", segId: firstSegId, drawerKind: "channel", label: "Open ML rationale →" }]
        : [],
    },
    "filter": {
      trace: [
        { tool: "Finding the best segments", ms: 41, status: "ok", note: "Filter: churn_risk > 0.08" },
      ],
      traceTotal: "1 tool · 41 ms",
      text: `${segs.filter(s => s.churnRisk >= 0.08).length} segment(s) have elevated churn risk. These may benefit from a retention-first approach before upsell.`,
      artifacts: segs.filter(s => s.churnRisk >= 0.08).map(s => ({ kind: "seg", id: s.id, label: s.name })),
    },
    "regen": {
      trace: [
        { tool: "Generating campaign content", ms: 1820, status: "ok", note: `${firstSegId} · drafts regenerated` },
        { tool: "Validating the campaign",     ms: 14,   status: "ok", note: "Re-flagged approval_required" },
      ],
      traceTotal: "2 tools · 1.83 s",
      text: `Drafts remain flagged \`approval_required=true\`.`,
      artifacts: [{ kind: "tab", id: "content", label: "Open Content drafts →" }],
    },
    "rulebook": {
      trace: [
        { tool: "Performing rule-book calculations", ms: 28, status: "ok", note: `intent=${campaignData?.parsed?.campaign_intent}` },
      ],
      traceTotal: "1 tool · 28 ms",
      text: segs.length
        ? `Rulebook matches: ${[...new Set(segs.map(s => `**${s.rulebookTrend}** → ${s.rulebookAction}`))].join("; ")}. All ${segs.length} segments have eligible intents for \`increase_arpu\`.`
        : "Rulebook info unavailable.",
      artifacts: [{ kind: "tab", id: "validation", label: "Open assumptions →" }],
    },
  };
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// MOCKED: Suggested follow-up chips — future work: generate these from LLM context.
export function buildFollowups(campaignData) {
  const firstSeg = campaignData?.segments?.[0];
  return [
    { id: "fu_push",  label: `Why ${campaignData?.segments?.[0]?.bestChannel || "push"} for ${firstSeg?.id || "S001"}?`, intent: "channel-why" },
    { id: "fu_inact", label: "Show high-churn segments only", intent: "filter" },
    { id: "fu_regen", label: `Regenerate content for ${firstSeg?.id || "S001"}`, intent: "regen" },
    { id: "fu_rule",  label: "Explain the rulebook basis", intent: "rulebook" },
  ];
}
