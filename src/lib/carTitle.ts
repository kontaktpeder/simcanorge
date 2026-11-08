function collapseRepeatedPhrase(text: string): string {
  let words = text.split(" ").filter(Boolean);
  let changed = true;
  while (changed && words.length > 1) {
    changed = false;
    for (let size = Math.floor(words.length / 2); size >= 1; size--) {
      const left = words.slice(0, size).join(" ").toLocaleLowerCase("nb");
      const right = words.slice(size, size * 2).join(" ").toLocaleLowerCase("nb");
      if (left.length > 2 && left === right) {
        words = [...words.slice(0, size), ...words.slice(size * 2)];
        changed = true;
        break;
      }
    }
  }
  return words.join(" ");
}

/** Visible heading only. Does not rewrite stored car data. */
export function formatCarHeading(input: {
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | string | null;
  variant?: string | null;
  bodyType?: string | null;
}): string {
  const fromParts = [input.brand, input.model, input.year, input.variant, input.bodyType]
    .map((value) => (value == null ? "" : String(value).trim()))
    .filter(Boolean)
    .join(" ");
  const source = (input.title?.trim() || fromParts).replace(/\s+/g, " ");
  return collapseRepeatedPhrase(source);
}
