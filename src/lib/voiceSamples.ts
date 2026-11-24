// Splits pasted chats into speakers, so a voice profile learns from one
// person. Handles "Name: message", WhatsApp's "[date, time] Name: message"
// and "date, time - Name: message", and the "Me:" / "Them:" lines that
// screenshots are read into. Lines without a speaker continue the previous
// message.

const LINE =
  /^(?:\[[^\]]{4,40}\]\s*|\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AaPp]\.?[Mm]\.?)?\s*[-–]\s*)?([^:\n]{1,40}?):\s+(.+)$/;

export interface ParsedMessage {
  speaker: string | null;
  text: string;
  /** The lines as written, for text that turns out not to be a chat. */
  raw: string;
}

export const parseMessages = (raw: string): ParsedMessage[] => {
  const messages: ParsedMessage[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = LINE.exec(trimmed);
    // A speaker name has few words; longer prefixes are just a colon in text.
    if (match && match[1].trim().split(/\s+/).length <= 4) {
      messages.push({
        speaker: match[1].trim(),
        text: match[2].trim(),
        raw: trimmed,
      });
    } else if (messages.length > 0 && messages[messages.length - 1].speaker) {
      const last = messages[messages.length - 1];
      last.text += ` ${trimmed}`;
      last.raw += `\n${trimmed}`;
    } else {
      messages.push({ speaker: null, text: trimmed, raw: trimmed });
    }
  }
  return messages;
};

/** Speakers by message count, most first. Empty unless the text is a chat. */
export const findSpeakers = (messages: ParsedMessage[]): string[] => {
  const counts = new Map<string, number>();
  let labelled = 0;
  for (const m of messages) {
    if (!m.speaker) continue;
    labelled += 1;
    counts.set(m.speaker, (counts.get(m.speaker) ?? 0) + 1);
  }
  if (counts.size < 2 || labelled < messages.length / 2) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([speaker]) => speaker);
};

/** The default voice to learn: yours, when screenshots say which is you. */
export const defaultSpeaker = (speakers: string[]): string | null =>
  speakers.includes("Me") ? "Me" : (speakers[0] ?? null);

/** One message per line from `speaker`; everything as written without one. */
export const samplesFor = (
  messages: ParsedMessage[],
  speaker: string | null,
): string =>
  speaker
    ? messages
        .filter((m) => m.speaker === speaker)
        .map((m) => m.text)
        .join("\n")
    : messages.map((m) => m.raw).join("\n");
