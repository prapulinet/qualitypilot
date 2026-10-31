import { validateStory } from "./scenarios.js";

// Adapter contract: POST {story}; receive {scenarios:[{title,steps,expected}]}.
// Configure a trusted gateway yourself. No provider-specific SDK is required.
export async function aiScenarios(
  input,
  { endpoint, token, fetchImpl = fetch } = {},
) {
  const story = validateStory(input);
  if (!endpoint || !token) throw new Error("AI gateway is not configured.");
  const url = new URL(endpoint);
  if (url.protocol !== "https:") throw new Error("AI gateway must use HTTPS.");
  const response = await fetchImpl(url, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ story }),
  });
  if (!response.ok) throw new Error("AI gateway request failed.");
  const payload = await response.json();
  if (
    !Array.isArray(payload.scenarios) ||
    payload.scenarios.length < 1 ||
    payload.scenarios.length > 20
  )
    throw new Error("Invalid AI scenario response.");
  const scenarios = payload.scenarios.map((s, i) => {
    if (
      !s ||
      typeof s.title !== "string" ||
      !s.title.trim() ||
      s.title.length > 200 ||
      !Array.isArray(s.steps) ||
      s.steps.length < 1 ||
      s.steps.length > 20 ||
      s.steps.some(
        (step) =>
          typeof step !== "string" || !step.trim() || step.length > 1000,
      ) ||
      typeof s.expected !== "string" ||
      !s.expected.trim() ||
      s.expected.length > 2000
    )
      throw new Error("Invalid AI scenario response.");
    return {
      id: `AI-${i + 1}`,
      title: s.title,
      steps: s.steps,
      expected: s.expected,
    };
  });
  return { source: "ai", story, reviewRequired: true, scenarios };
}
