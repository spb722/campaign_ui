export async function sendChatMessage(sessionId, message, campaignId) {
  const body = { session_id: sessionId, message };
  if (campaignId) body.campaign_id = campaignId;
  const res = await fetch("http://10.0.11.179:8000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}
