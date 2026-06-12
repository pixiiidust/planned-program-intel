export function systemInstruction(instruction: string): string {
  return `${instruction}\n\nRespond with JSON only, matching the given schema. Use no digits or numerals anywhere in the text values.`;
}

export function parseJsonText(text: string, source: string): unknown {
  const stripped = stripMarkdownCodeFence(text);
  try {
    return JSON.parse(stripped) as unknown;
  } catch (error) {
    throw new Error(`${source} returned unparseable JSON: ${excerpt(stripped)}`, { cause: error });
  }
}

export function stripMarkdownCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1]!.trim() : trimmed;
}

export function excerpt(text: string, maxLength = 500): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
