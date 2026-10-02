import fs from "fs";
import path from "path";
import { DEFAULT_QUOTE_DEFAULTS, QuoteDefaults } from "./quoteDefaults";

const defaultsPath = path.join(process.cwd(), "data", "quoteDefaults.json");

export function getQuoteDefaults(): QuoteDefaults {
  if (!fs.existsSync(defaultsPath)) return DEFAULT_QUOTE_DEFAULTS;
  try {
    const saved = JSON.parse(fs.readFileSync(defaultsPath, "utf8")) as Partial<QuoteDefaults>;
    return {
      pricing: { ...DEFAULT_QUOTE_DEFAULTS.pricing, ...saved.pricing },
      templates: Array.isArray(saved.templates) ? saved.templates : DEFAULT_QUOTE_DEFAULTS.templates,
    };
  } catch {
    return DEFAULT_QUOTE_DEFAULTS;
  }
}

export function saveQuoteDefaults(defaults: QuoteDefaults): void {
  const tempPath = `${defaultsPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(defaults, null, 2), "utf8");
  fs.renameSync(tempPath, defaultsPath);
}
