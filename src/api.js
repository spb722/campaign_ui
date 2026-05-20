export async function regenerateContent(campaignId, payload) {
  const res = await fetch(`/campaign/${campaignId}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Regenerate failed: ${res.status}`);
  return res.json();
}

export async function sendChatMessage(sessionId, message, campaignId) {
  const body = { session_id: sessionId, message };
  if (campaignId) body.campaign_id = campaignId;
  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}
