export function validateStory(story) {
  if (typeof story !== 'string' || story.trim().length < 15 || story.length > 4000) {
    throw new Error('Story must contain 15–4000 characters.');
  }
  return story.trim();
}

// A transparent baseline. These templates are not AI-generated test cases.
export function baselineScenarios(input) {
  const story = validateStory(input);
  const cases = [
    ['positive', 'Complete the primary workflow', 'Use valid prerequisites and inputs', 'The documented acceptance criteria are met'],
    ['negative', 'Reject invalid input', 'Submit malformed or missing required values', 'A useful validation error appears and state remains unchanged'],
    ['boundary', 'Check minimum and maximum values', 'Exercise each documented limit and its adjacent values', 'Limits are enforced consistently'],
    ['access', 'Check unauthorized access', 'Attempt the workflow without the required permission', 'Access is denied without exposing protected data']
  ];
  return { source: 'baseline', story, reviewRequired: true, scenarios: cases.map(([category, title, steps, expected], i) => ({ id: `QP-${i + 1}`, category, title, steps: [steps], expected })) };
}
