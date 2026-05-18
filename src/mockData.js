// Static mock data that is NOT returned by the API.
// All of this is clearly labelled so the team knows what's needed from the backend.

export const EXAMPLE_PROMPTS = [
  "Increase ARPU of mid-ARPU customers by 2% in 30 days.",
  "Reduce prepaid churn by 10% next quarter.",
  "Increase data consumption by 10% over the next quarter.",
  "Engage inactive prepaid customers this month.",
  "Recommend the best campaign opportunity for this month.",
];

const ACTIVITY_LABELS = {
  understanding_request: [
    "Understanding request",
    "Reading the user request",
    "Interpreting the request",
    "Identifying user intent",
    "Parsing the latest message",
  ],
  finding_context: [
    "Finding relevant campaign context",
    "Looking up current campaign context",
    "Retrieving related campaign details",
    "Finding the right campaign data",
    "Locating relevant context",
  ],
  reviewing_info: [
    "Reviewing available info",
    "Checking available data",
    "Reviewing campaign details",
    "Inspecting available signals",
    "Reading relevant plan information",
  ],
  reasoning_options: [
    "Reasoning over options",
    "Comparing available options",
    "Evaluating possible choices",
    "Weighing alternatives",
    "Reviewing possible next steps",
  ],
  preparing_response: [
    "Preparing response",
    "Composing the response",
    "Summarizing the result",
    "Preparing the answer",
    "Building the response",
  ],
  updating_state: [
    "Updating campaign state",
    "Applying requested changes",
    "Updating the campaign plan",
    "Saving the latest campaign changes",
    "Refreshing campaign state",
  ],
  validating_changes: [
    "Validating changes",
    "Checking updated plan",
    "Running validation checks",
    "Reviewing guardrails",
    "Checking campaign constraints",
  ],
};

function randomLabel(group) {
  const labels = ACTIVITY_LABELS[group];
  return labels[Math.floor(Math.random() * labels.length)];
}

function getActivityGroups(response) {
  const type = response?.response_type;

  if (type === "campaign_plan") {
    return ["understanding_request", "finding_context", "reviewing_info", "reasoning_options", "updating_state", "validating_changes", "preparing_response"];
  }
  if (type === "plan_updated") {
    return ["understanding_request", "finding_context", "updating_state", "reasoning_options", "validating_changes", "preparing_response"];
  }
  if (type === "answer") {
    const isDrilldown = response.ui_action?.set_active_view === "segment_drilldown";
    const isOfferOrComparison = /offer|alternative|next best/i.test(response.message || "");
    if (isDrilldown || isOfferOrComparison) {
      return ["understanding_request", "finding_context", "reviewing_info", "reasoning_options", "preparing_response"];
    }
    return ["understanding_request", "finding_context", "reviewing_info", "preparing_response"];
  }
  if (type === "clarification") {
    return ["understanding_request", "reviewing_info", "preparing_response"];
  }
  if (type === "export_ready") {
    return ["understanding_request", "finding_context", "reviewing_info", "validating_changes", "preparing_response"];
  }
  return ["understanding_request", "preparing_response"];
}

export function buildActivitySteps(response) {
  return getActivityGroups(response).map((group) => ({
    tool: randomLabel(group),
    status: "ok",
    ms: null,
    note: "",
  }));
}

export function buildLoadingSteps() {
  return [
    "understanding_request",
    "finding_context",
    "reviewing_info",
    "reasoning_options",
    "preparing_response",
  ].map((group) => ({
    tool: randomLabel(group),
    status: "ok",
    ms: null,
    note: "",
  }));
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
