import {
  LLM_CLASS_SYSTEM_PROMPT,
  buildClassGenerationUserPrompt,
  buildTemplateClassPack,
} from '@rcb/shared';
import { config } from '../config.js';

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error('LLM response did not contain JSON object');
}

export async function callLlmForClassPack(options: {
  theme: string;
  nameHint?: string;
  classIdPrefix?: string;
  cardCount?: number;
  userPrompt?: string;
  availableRelicIds: string[];
}): Promise<{ raw: unknown; usedFallback: boolean; prompt: string }> {
  const userPrompt = buildClassGenerationUserPrompt(options);
  const fullPrompt = `${LLM_CLASS_SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

  if (!config.llmApiKey) {
    const relicIds = options.availableRelicIds.slice(0, 2) as [string, string];
    if (relicIds.length < 2) {
      throw new Error('Need at least 2 relic ids for template generation');
    }
    const raw = buildTemplateClassPack({
      theme: options.theme,
      nameHint: options.nameHint,
      classIdPrefix: options.classIdPrefix,
      cardCount: options.cardCount,
      relicIds,
    });
    return { raw, usedFallback: true, prompt: fullPrompt };
  }

  const res = await fetch(config.llmApiBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llmApiKey}`,
    },
    body: JSON.stringify({
      model: config.llmModel,
      messages: [
        { role: 'system', content: LLM_CLASS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM returned empty content');

  try {
    const raw = extractJsonObject(content);
    return { raw, usedFallback: false, prompt: fullPrompt };
  } catch (err) {
    console.warn('[LLM] JSON parse failed, using template fallback:', err);
    const relicIds = options.availableRelicIds.slice(0, 2) as [string, string];
    const raw = buildTemplateClassPack({
      theme: options.theme,
      nameHint: options.nameHint,
      classIdPrefix: options.classIdPrefix,
      cardCount: options.cardCount,
      relicIds,
    });
    return { raw, usedFallback: true, prompt: fullPrompt };
  }
}
