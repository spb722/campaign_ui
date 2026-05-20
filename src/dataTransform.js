// Maps the /campaign/parse API response to UI data shapes.

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

function fmtCurrency(val) {
  if (val === undefined || val === null) return "—";
  return `RO ${Number(val).toFixed(2)}`;
}

function buildChannels(mlScore) {
  const scores = mlScore.channel_scores;
  const best = mlScore.best_channel;
  const secondary = mlScore.secondary_channel;

  // Take top 3 channels by score
  const sorted = Object.entries(scores)
    .filter(([ch]) => ["push", "whatsapp", "sms"].includes(ch)) // show only these 3
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return sorted.map(([ch, score]) => ({
    ch: capitalize(ch === "whatsapp" ? "WhatsApp" : ch),
    window: mlScore.channel_time_windows?.[ch] ??
      (ch === best ? mlScore.best_time_window : "10:00-18:00"),
    score,
    primary: ch === best,
  }));
}

function buildTimeline(followupPlan) {
  const events = new Map();

  followupPlan.forEach((fp) => {
    fp.steps.forEach((step) => {
      const match = step.match(/^Day (\d+): (.+)/);
      if (match) {
        const day = parseInt(match[1], 10);
        const desc = match[2];
        if (!events.has(day)) {
          events.set(day, { day, desc, segCount: 1 });
        } else {
          events.get(day).segCount++;
        }
      }
    });
  });

  const toneFor = (day) => {
    if (day === 0) return "accent";
    if (day === 10) return "warn";
    return "ink";
  };

  return Array.from(events.values())
    .sort((a, b) => a.day - b.day)
    .map((e) => ({
      d: `D ${e.day}`,
      label: capitalize(e.desc),
      sub: `${e.segCount} segment${e.segCount !== 1 ? "s" : ""}`,
      tone: toneFor(e.day),
    }));
}

export function buildValidations(validation) {
  const items = [];

  // Status from compliance fields
  const complianceMap = {
    rulebook_compliance: { ok: "RULEBOOK", msg: "All segments map to a valid rulebook action." },
    projection_compliance: { ok: "PROJECTION", msg: "Projection formula verified: eligible × conversion × lift." },
    content_compliance: { ok: "CONTENT_DRAFT", msg: "All content drafts flagged approval_required=true." },
  };

  Object.entries(complianceMap).forEach(([key, meta]) => {
    if (validation[key] === "passed") {
      items.push({ level: "ok", code: meta.ok, msg: meta.msg });
    }
  });

  // Hard errors
  (validation.errors || []).forEach((err, i) => {
    items.push({ level: "error", code: `ERR_${i + 1}`, msg: err });
  });

  return items;
}

function buildAssumptions(data) {
  const p = data.parsed_objective || {};
  const base = [
    { k: "campaign_intent", v: p.campaign_intent || "—", src: "parsed_objective" },
    { k: "target_metric", v: p.target_metric || "—", src: "parsed_objective" },
    { k: "target_lift", v: p.target_lift_value != null ? `${p.target_lift_value}${p.target_lift_unit === "percent" ? "%" : " " + (p.target_lift_unit || "")}` : "—", src: "parsed_objective" },
    { k: "time_window", v: p.time_window_value != null ? `${p.time_window_value} ${p.time_window_unit || "days"}` : "—", src: "parsed_objective" },
    { k: "parse_confidence", v: p.confidence != null ? p.confidence.toFixed(2) : "—", src: "parsed_objective" },
    { k: "projection_formula", v: "eligible_users × expected_conversion × expected_arpu_lift", src: "projection" },
    { k: "business_context", v: p.business_context || "—", src: "parsed_objective" },
  ];

  (data.assumptions || []).forEach((a) => {
    base.push({ k: "note", v: a, src: "campaign_plan" });
  });

  return base;
}

function draftTitle(copy) {
  // Use first sentence up to 50 chars
  const first = copy.split(/[.!?]/)[0].trim();
  return first.length <= 55 ? first : first.slice(0, 52) + "…";
}

export function buildContentDrafts(contentPlan, segMap) {
  return contentPlan.map((cp) => ({
    segmentId: cp.segment_id,
    segmentName: segMap[cp.segment_id] || cp.segment_id,
    channel: capitalize(cp.channel === "whatsapp" ? "WhatsApp" : cp.channel),
    title: draftTitle(cp.draft_copy),
    body: cp.draft_copy,
    tone: cp.tone,
    approved: cp.approved,
    approvalRequired: cp.approval_required,
    whyCopy: cp.why_this_copy,
    complianceNotes: cp.compliance_notes || [],
  }));
}

export function transformApiResponse(apiData) {
  const data = apiData?.data;
  if (!data) throw new Error("API response missing `data` field.");

  const segs = Array.isArray(data.recommended_segments) ? data.recommended_segments : [];
  if (segs.length === 0) throw new Error("No recommended segments returned. Try a more specific prompt.");

  const totalUsers = segs.reduce((s, r) => s + (r.segment?.customer_count || 0), 0);
  const totalImpact = data.projection?.total_projected_impact ?? 0;
  const weightedArpu = totalUsers > 0
    ? segs.reduce((s, r) => s + (r.segment?.avg_arpu || 0) * (r.segment?.customer_count || 0), 0) / totalUsers
    : 0;
  const liftPct = (data.parsed_objective?.target_lift_value || 0) / 100;
  const targetArpu = weightedArpu * (1 + liftPct);
  const estCost = segs.reduce((s, r) => s + (r.segment?.customer_count || 0) * (r.offer?.cost_per_user || 0), 0);

  // Segment name map for content drafts
  const segMap = {};
  segs.forEach((r) => { segMap[r.segment.segment_id] = r.segment.segment_name; });

  const segments = segs.map((r) => {
    const seg = r.segment;
    const ml = r.ml_score;
    const offer = r.offer;
    const rb = r.rulebook_match;

    return {
      id: seg.segment_id,
      name: seg.segment_name,
      profile: seg.rfm_segment,
      usage: [
        `${capitalize(seg.data_usage_segment)} data`,
        `${capitalize(seg.voice_usage_segment)} voice`,
      ],
      trend: seg.voice_usage_trend,
      dataTrend: seg.data_usage_trend,
      pack: capitalize(seg.current_pack_type),
      users: seg.customer_count.toLocaleString(),
      customerCount: seg.customer_count,
      sharePct: Math.round((seg.customer_count / totalUsers) * 100),
      impactPct: Math.round((r.projected_impact / totalImpact) * 100),
      currentArpu: `RO ${seg.avg_arpu.toFixed(2)}`,
      avgArpu: seg.avg_arpu,
      lift: `+RO ${offer.estimated_arpu_lift.toFixed(2)}`,
      arputLiftVal: offer.estimated_arpu_lift,
      conv: `${(ml.expected_conversion * 100).toFixed(1)}%`,
      convRate: ml.expected_conversion,
      revLift: `RO ${r.projected_impact.toFixed(0)}`,
      projectedImpact: r.projected_impact,
      confidence: r.confidence,
      tactic: {
        name: offer.offer_name,
        desc: offer.description,
        cost: `RO ${offer.cost_per_user}/u`,
        price: offer.price,
        benefit: offer.benefit,
        validityDays: offer.validity_days,
        offerId: offer.offer_id,
      },
      rulebook: `${rb.trend} → ${rb.typical_action}`,
      rulebookTrend: rb.trend,
      rulebookAction: rb.typical_action,
      allowedFamilies: rb.allowed_action_families,
      channels: buildChannels(ml),
      channelScoresRaw: ml.channel_scores,
      channelTimeWindows: ml.channel_time_windows ?? {},
      fallbackUsed: ml.fallback_used ?? false,
      bestChannel: ml.best_channel,
      bestTime: ml.best_time_window,
      fatigue: capitalize(ml.fatigue_risk),
      fatigueRisk: ml.fatigue_risk,
      modelConfidence: ml.model_confidence,
      expectedCtr: ml.expected_ctr,
      whyThis: r.why_this,
      opportunity: seg.opportunity,
      nboAction: seg.nbo_action,
      churnRisk: seg.churn_risk_score,
      activityScore: seg.activity_score,
    };
  });

  const kpis = [
    { label: "Target base", value: totalUsers.toLocaleString(), sub: "eligible users", tone: "neutral" },
    { label: "Avg ARPU", value: `RO ${weightedArpu.toFixed(2)}`, sub: "weighted avg · current", tone: "neutral" },
    { label: "Target ARPU", value: `RO ${targetArpu.toFixed(2)}`, sub: `+${data.parsed_objective?.target_lift_value ?? 0}% lift target`, tone: "neutral" },
    { label: "Projected impact", value: `RO ${totalImpact.toLocaleString("en", { maximumFractionDigits: 0 })}`, sub: "incremental revenue, 30d", tone: "hero" },
    { label: "Est. offer cost", value: `RO ${estCost.toLocaleString("en", { maximumFractionDigits: 0 })}`, sub: "cost per user × conversions", tone: "neutral" },
  ];

  const contentDrafts = buildContentDrafts(data.content_plan || [], segMap);

  const validations = buildValidations(data.validation || {});

  const assumptions = buildAssumptions(data);

  const planTimeline = buildTimeline(data.followup_plan || []);

  return {
    campaignId: data.campaign_id,
    campaignTitle: data.campaign_title,
    campaignIntent: data.campaign_intent,
    summary: data.summary,
    parsed: data.parsed_objective,
    status: data.status,
    version: data.version,
    segments,
    kpis,
    contentDrafts,
    validations,
    assumptions,
    planTimeline,
    projection: data.projection,
    totalUsers,
    totalImpact,
    weightedArpu,
    targetArpu,
    estCost,
    liftPct,
    apiWarnings: apiData.warnings || [],
  };
}
