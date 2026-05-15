# Data Requirements — Campaign Workspace

This document lists every data field used in the UI, its source, and what's needed from the backend to replace mocks.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Real — comes directly from `POST /campaign/parse` |
| 🔢 | Derived — calculated from API data in the frontend |
| 🟡 | Partially mocked — shape exists in API, but content is synthetic |
| ❌ | Fully mocked — not in API, needs a real endpoint or field |

---

## 1. Campaign Header (Hero section)

| Field | Source | Status |
|-------|--------|--------|
| `campaign_id` | `data.campaign_id` | ✅ |
| `campaign_title` | `data.campaign_title` | ✅ |
| `campaign_intent` | `data.campaign_intent` | ✅ |
| `status` (draft/live) | `data.status` | ✅ |
| `version` | `data.version` | ✅ |
| `time_window_value` | `data.parsed_objective.time_window_value` | ✅ |
| `business_context` | `data.parsed_objective.business_context` | ✅ |
| Blocking / advisory count | Derived from `data.validation` | 🔢 |

---

## 2. KPI Strip

| KPI | How it's computed | Status |
|-----|------------------|--------|
| Target base (eligible users) | `SUM(segment.customer_count)` across all segments | 🔢 |
| Avg ARPU (current) | Weighted avg: `SUM(count × avg_arpu) / SUM(count)` | 🔢 |
| Target ARPU | `avg_arpu × (1 + target_lift_value/100)` | 🔢 |
| Projected impact | `data.projection.total_projected_impact` | ✅ |
| Est. offer cost | `SUM(customer_count × offer.cost_per_user)` — **note:** this is cost of the offer per converter, NOT marketing send cost | 🔢 |
| **MISSING: Marketing send cost** | Cost to send push/SMS/WhatsApp per user — not in API | ❌ |
| **MISSING: ROAS** | Needs real marketing send cost, not offer cost | ❌ |

---

## 3. Segments Tab

| Field | Source | Status |
|-------|--------|--------|
| `segment_id`, `segment_name`, `rfm_segment` | `segment.*` | ✅ |
| `data_usage_segment`, `voice_usage_segment` | `segment.*` | ✅ |
| `data_usage_trend`, `voice_usage_trend` | `segment.*` | ✅ |
| `customer_count`, `avg_arpu` | `segment.*` | ✅ |
| `avg_data_gb`, `avg_voice_min` | `segment.*` | ✅ |
| `churn_risk_score`, `activity_score` | `segment.*` | ✅ |
| `current_pack_type`, `offer_affinity` | `segment.*` | ✅ |
| `opportunity`, `nbo_action` | `segment.*` | ✅ |
| Share of users (%) | Derived: `customer_count / total_customers` | 🔢 |
| Share of impact (%) | Derived: `projected_impact / total_impact` | 🔢 |
| `offer_name`, `offer_type`, `price` | `offer.*` | ✅ |
| `estimated_arpu_lift`, `cost_per_user` | `offer.*` | ✅ |
| `benefit`, `validity_days` | `offer.*` | ✅ |
| Channel scores (push, whatsapp, sms, email, ivr, outbound_call) | `ml_score.channel_scores` | 🟡 (mock ML) |
| `best_channel`, `secondary_channel` | `ml_score.*` | 🟡 (mock ML) |
| `best_time_window` | `ml_score.*` | 🟡 (mock ML) |
| `expected_ctr`, `expected_conversion` | `ml_score.*` | 🟡 (mock ML) |
| `fatigue_risk`, `model_confidence` | `ml_score.*` | 🟡 (mock ML) |
| `rulebook_fit_score`, `trend` | `rulebook_match.*` | ✅ |
| `allowed_action_families` | `rulebook_match.*` | ✅ |
| `why_this` explanation | `why_this` field | ✅ |
| `projected_impact` per segment | `projected_impact` | ✅ |
| `confidence` per segment | `confidence` | ✅ |

---

## 4. Plan Tab (Timeline + Heatmap)

| Field | Source | Status |
|-------|--------|--------|
| Timeline steps | Derived from `data.followup_plan[].steps` strings | 🔢 |
| Timeline day labels (D 0, D 3 …) | Parsed from followup_plan step text | 🔢 |
| Segment per day assignment | Derived by aggregating across followup_plan entries | 🔢 |
| Send-window heatmap | Derived from `ml_score.best_time_window` | 🔢 |
| Quiet hours | **Hardcoded** as `22:00–08:00` — not returned by API | ❌ |
| **MISSING: Actual scheduled send dates** | API returns relative days only (D+N), not calendar dates | ❌ |
| **MISSING: Frequency cap config** | Not exposed in API response | ❌ |

---

## 5. Content Tab

| Field | Source | Status |
|-------|--------|--------|
| `segment_id`, `channel` | `content_plan.*` | ✅ |
| `draft_copy` | `content_plan.draft_copy` | ✅ |
| `tone`, `language` | `content_plan.*` | ✅ |
| `approval_required`, `approved` | `content_plan.*` | ✅ |
| `why_this_copy` | `content_plan.why_this_copy` | ✅ |
| `compliance_notes` | `content_plan.compliance_notes` | ✅ |
| **Draft title** | Generated from first sentence of `draft_copy` — not in API | ❌ |
| **Content regeneration** | Would need `POST /campaign/regenerate-content` — not available | ❌ |
| **A/B variant drafts** | Not in API | ❌ |

---

## 6. Validation Tab

| Field | Source | Status |
|-------|--------|--------|
| `rulebook_compliance` | `data.validation.rulebook_compliance` | ✅ |
| `projection_compliance` | `data.validation.projection_compliance` | ✅ |
| `content_compliance` | `data.validation.content_compliance` | ✅ |
| `errors[]` | `data.validation.errors` | ✅ |
| `warnings[]` (as advisories) | `data.risks[]` | ✅ |
| Assumptions | `data.parsed_objective.*` + `data.assumptions[]` | ✅ |
| **MISSING: Frequency cap check result** | Not in validation block | ❌ |
| **MISSING: Quiet hours check** | Not in validation block | ❌ |
| **MISSING: Segment overlap check** | Not in validation block | ❌ |

---

## 7. Chat / Agent Trace

| Field | Source | Status |
|-------|--------|--------|
| User message text | User input | ✅ |
| Agent reply text | Generated in frontend from API result | 🔢 |
| Tool trace (tool names, ms, notes) | **Fully mocked** — API doesn't expose internal tool calls | ❌ |
| Trace timing (`ms` per tool) | **Fully mocked** | ❌ |
| Follow-up intent routing | **Fully mocked** — needs a `/campaign/followup` or chat endpoint | ❌ |
| Suggested follow-ups | **Fully mocked** — generated from segment data in frontend | ❌ |
| Run history | **Not implemented** — would need a persistence layer | ❌ |

---

## 8. Export Tab

| Field | Source | Status |
|-------|--------|--------|
| Campaign summary JSON | Assembled from API data in frontend | 🔢 |
| `export_path` | `data.export_path` (currently null) | ✅ (null) |
| **PDF export** | Would need `POST /campaign/export` → returns PDF | ❌ |
| **One-pager HTML** | Not in API | ❌ |

---

## New API Endpoints Needed

| Endpoint | Purpose |
|----------|---------|
| `POST /campaign/followup` | Chat follow-up turns: "Why push?", "Filter inactive", etc. |
| `POST /campaign/regenerate-content` | Regenerate message drafts for a segment/channel |
| `POST /campaign/export` | Generate and return a PDF one-pager |
| `GET /campaign/history` | Retrieve past campaign runs for run history panel |
| `GET /campaign/rulebook` | Expose full rulebook rows for the validation/assumptions tab |

---

## Fields to Add to Existing `/campaign/parse` Response

| Field | Where | Why |
|-------|-------|-----|
| `marketing_send_cost_per_user` | Per segment or global | Enables real ROAS calculation |
| `quiet_hours` | Global or per segment | Currently hardcoded as 22:00–08:00 |
| `frequency_cap` | Global or per segment | Currently hardcoded as 4/30d |
| `rulebook_version` | Top-level | For audit trail |
| Content draft `title` (short) | Per `content_plan` entry | UI needs a display title, not just the full copy |
| `agent_trace` | Top-level | Expose internal tool calls and timing |
| `segment_overlap_check` | `validation` block | Ensure no customer appears in multiple segments |
