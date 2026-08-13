import fs from "fs";
import path from "path";
import { Client, Project, Subscription, Website, Transaction, Quote, Invoice } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

// This project's data/ folder lives inside OneDrive. OneDrive briefly locks
// files while it syncs them (EBUSY/EPERM/EACCES on Windows), which makes an
// otherwise-fine read/write fail at random. Retry a few times with backoff
// before giving up, since the lock is normally gone within a few hundred ms.
function withRetry<T>(fn: () => T, attempts = 6, baseDelayMs = 100): T {
  for (let i = 0; i < attempts; i++) {
    try {
      return fn();
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      const transient = code === "EBUSY" || code === "EPERM" || code === "EACCES" || code === "ENOENT";
      if (!transient || i === attempts - 1) throw err;
      const sab = new SharedArrayBuffer(4);
      Atomics.wait(new Int32Array(sab), 0, 0, baseDelayMs * Math.pow(2, i));
    }
  }
  throw new Error("unreachable");
}

function readJSON<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const raw = withRetry(() => fs.readFileSync(filePath, "utf-8"));
  try {
    return JSON.parse(raw) as T[];
  } catch (err) {
    // Primary file is corrupted (e.g. a write was interrupted mid-sync).
    // Fall back to the last known-good backup rather than losing everything.
    const backupPath = path.join(DATA_DIR, "backups", filename);
    if (fs.existsSync(backupPath)) {
      const backupRaw = withRetry(() => fs.readFileSync(backupPath, "utf-8"));
      return JSON.parse(backupRaw) as T[];
    }
    throw new Error(`${filename} está dañado y no hay backup disponible: ${(err as Error).message}`);
  }
}

function writeJSON<T>(filename: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = filePath + ".tmp";
  const backupDir = path.join(DATA_DIR, "backups");

  // Write to a temp file first, then rename — an interrupted write (crash,
  // OneDrive lock, power loss) leaves the original file untouched instead
  // of a half-written / corrupted JSON file.
  withRetry(() => fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8"));

  // Keep a rolling backup of the previous version as extra insurance.
  if (fs.existsSync(filePath)) {
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    withRetry(() => fs.copyFileSync(filePath, path.join(backupDir, filename)));
  }

  withRetry(() => fs.renameSync(tmpPath, filePath));
}

// Clients
export const getClients = () => readJSON<Client>("clients.json");
export const saveClients = (data: Client[]) => writeJSON("clients.json", data);
export const getClientById = (id: string) => getClients().find((c) => c.id === id);

// Projects
export const getProjects = () => readJSON<Project>("projects.json");
export const saveProjects = (data: Project[]) => writeJSON("projects.json", data);
export const getProjectById = (id: string) => getProjects().find((p) => p.id === id);
export const getProjectsByClient = (clientId: string) =>
  getProjects().filter((p) => p.clientId === clientId);

// Subscriptions
export const getSubscriptions = () => readJSON<Subscription>("subscriptions.json");
export const saveSubscriptions = (data: Subscription[]) =>
  writeJSON("subscriptions.json", data);

// Websites
export const getWebsites = () => readJSON<Website>("websites.json");
export const saveWebsites = (data: Website[]) => writeJSON("websites.json", data);
export const getWebsitesByClient = (clientId: string) =>
  getWebsites().filter((w) => w.clientId === clientId);

// Transactions
export const getTransactions = () => readJSON<Transaction>("transactions.json");
export const saveTransactions = (data: Transaction[]) =>
  writeJSON("transactions.json", data);

// Quotes
export const getQuotes = () => readJSON<Quote>("quotes.json");
export const saveQuotes = (data: Quote[]) => writeJSON("quotes.json", data);
export const getQuoteById = (id: string) => getQuotes().find((q) => q.id === id);

// Invoices
export const getInvoices = () => readJSON<Invoice>("invoices.json");
export const saveInvoices = (data: Invoice[]) => writeJSON("invoices.json", data);
export const getInvoiceById = (id: string) => getInvoices().find((i) => i.id === id);

// ID generation
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Sequential number generators
export function nextQuoteNumber(): string {
  const quotes = getQuotes();
  const year = new Date().getFullYear();
  const max = quotes.reduce((acc, q) => {
    const parts = q.quoteNumber.split("-");
    const n = parseInt(parts[parts.length - 1], 10);
    return n > acc ? n : acc;
  }, 0);
  return `${year}-${String(max + 1).padStart(3, "0")}`;
}

export function nextInvoiceNumber(): string {
  const invoices = getInvoices();
  const year = new Date().getFullYear();
  const min = year === 2026 ? 17 : 0;
  const max = invoices.reduce((acc, i) => {
    const str = String(i.invoiceNumber);
    const parts = str.split("-");
    const n = parseInt(parts[parts.length - 1], 10);
    return !isNaN(n) && n > acc ? n : acc;
  }, min);
  return `${year}-${max + 1}`;
}
