/**
 * LLM Service - Ollama wrapper for Epic & User Story generation (Jira format).
 * Connects to local Ollama instance running Gemma 3:1b.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:1b';

/**
 * Generate Jira-format Epics + User Stories from extracted page features.
 * @param {Object} pageData - Page data with extracted features
 * @returns {Promise<Object>} Epics with user stories
 */
async function generateUserStories(pageData) {
  const { metadata, interactive_elements, navigation, sections, states } = pageData;

  const prompt = buildPrompt(metadata, interactive_elements, navigation, sections, states);

  try {
    const response = await callOllama(prompt);
    const result = parseStoriesFromResponse(response, metadata);
    return result;
  } catch (err) {
    console.error('LLM generation failed:', err.message);
    return {
      page: metadata.url,
      title: metadata.title,
      epics: [],
      error: err.message
    };
  }
}

/**
 * Build Jira-format prompt for Gemma 3:1b.
 */
function buildPrompt(metadata, elements, navigation, sections, states) {
  const elementsSummary = elements.slice(0, 15).map(e =>
    `- ${e.type}: "${e.text || e.placeholder || e.label || 'unnamed'}" (${e.actionHint || e.inputType || e.role || ''})`
  ).join('\n');

  const sectionsSummary = sections.slice(0, 10).map(s =>
    `- ${s.level}: ${s.text}`
  ).join('\n');

  const navSummary = navigation.slice(0, 10).map(n =>
    `- ${n.text}`
  ).join('\n');

  return `Analyze this web page and generate Jira Epics with User Stories.

Page: ${metadata.title} (${metadata.url})

Interactive elements:
${elementsSummary || 'None found'}

Sections:
${sectionsSummary || 'None found'}

Navigation:
${navSummary || 'None found'}

${states.length > 0 ? `States: ${states.map(s => s.text).join(', ')}` : ''}

Generate output in this JSON format:
{
  "epics": [
    {
      "summary": "Brief summary of the Epic",
      "description": "Detailed description including business need and goals",
      "requirements": ["Requirement 1", "Requirement 2"],
      "scope": "Scope of the Epic",
      "dependencies": ["Dependency 1"],
      "risks": ["Risk 1"],
      "acceptance_criteria": ["Criteria 1", "Criteria 2"],
      "user_stories": [
        {
          "title": "Story Title",
          "story": "As a [user], I want [goal] so that [reason].",
          "description": "Detailed description with context and constraints.",
          "acceptance_criteria": ["AC 1", "AC 2"]
        }
      ]
    }
  ]
}

Rules:
- Group related user stories under a single Epic
- Each Epic must have summary, description, requirements, scope, dependencies, risks, acceptance_criteria
- Each User Story must follow: As a [type of user], I want [goal] so that [reason]
- Be concise but comprehensive
- Avoid duplicates
- Focus on real user intent
- Return valid JSON only`;
}

/**
 * Call the Ollama API for text generation.
 * @param {string} prompt - The prompt to send
 * @returns {Promise<string>} Generated text
 */
async function callOllama(prompt) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        num_predict: 2048
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.response || '';
}

/**
 * Parse Epics + User Stories from LLM response.
 * Attempts JSON parsing first, falls back to text extraction.
 */
function parseStoriesFromResponse(response, metadata) {
  // Try to extract JSON with epics
  const jsonMatch = response.match(/\{[\s\S]*"epics"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        page: metadata.url,
        title: metadata.title,
        epics: parsed.epics || []
      };
    } catch { /* fall through */ }
  }

  // Try old features format and convert
  const featuresMatch = response.match(/\{[\s\S]*"features"[\s\S]*\}/);
  if (featuresMatch) {
    try {
      const parsed = JSON.parse(featuresMatch[0]);
      const epics = (parsed.features || []).map(f => ({
        summary: f.name,
        description: `Features related to ${f.name} on ${metadata.title}`,
        requirements: [],
        scope: metadata.url,
        dependencies: [],
        risks: [],
        acceptance_criteria: [],
        user_stories: (f.user_stories || []).map(s => ({
          title: f.name,
          story: s,
          description: '',
          acceptance_criteria: []
        }))
      }));
      return { page: metadata.url, title: metadata.title, epics };
    } catch { /* fall through */ }
  }

  // Fallback: parse "As a..." patterns
  const storyPattern = /As a[n]?\s+(.+?),\s*I want(?:\s+to)?\s+(.+?),?\s*so that\s+(.+?)\.?$/gim;
  const stories = [];
  let match;
  while ((match = storyPattern.exec(response)) !== null) {
    stories.push({
      title: match[2].slice(0, 50),
      story: `As a ${match[1]}, I want ${match[2]}, so that ${match[3]}.`,
      description: '',
      acceptance_criteria: []
    });
  }

  return {
    page: metadata.url,
    title: metadata.title,
    epics: stories.length > 0
      ? [{
          summary: `${metadata.title} Features`,
          description: `Features extracted from ${metadata.url}`,
          requirements: [],
          scope: metadata.url,
          dependencies: [],
          risks: [],
          acceptance_criteria: [],
          user_stories: stories
        }]
      : [],
    rawResponse: response
  };
}

/**
 * Check if Ollama is available and the model is loaded.
 * @returns {Promise<Object>} Status info
 */
async function checkOllamaStatus() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const models = (data.models || []).map(m => m.name);
    return {
      available: true,
      models,
      hasModel: models.some(m => m.includes('gemma'))
    };
  } catch (err) {
    return { available: false, error: err.message };
  }
}

module.exports = { generateUserStories, checkOllamaStatus };
