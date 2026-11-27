import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const METRIC_TOOL_NAMES = Object.freeze([
  "fengweilou_get_restaurant_facts",
  "fengweilou_list_dishes",
  "fengweilou_list_stories",
  "fengweilou_search_guide",
  "fengweilou_recommend",
]);

const METRIC_EVENTS = new Set(["handshake_success", "tools_list_success", "tool_call_success"]);
const TOOL_NAME_SET = new Set(METRIC_TOOL_NAMES);
const DEFAULT_RETENTION_DAYS = 90;
const DEFAULT_FLUSH_DELAY_MS = 250;

function emptyCounters() {
  return {
    handshake_success: 0,
    tools_list_success: 0,
    tool_call_success_total: 0,
    tools: Object.fromEntries(METRIC_TOOL_NAMES.map((name) => [name, 0])),
  };
}

function emptyDay() {
  return { real: emptyCounters(), synthetic: emptyCounters() };
}

function dateKey(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const fields = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

function validCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function normalizeCounters(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const sourceTools = source.tools && typeof source.tools === "object" && !Array.isArray(source.tools) ? source.tools : {};
  return {
    handshake_success: validCount(source.handshake_success),
    tools_list_success: validCount(source.tools_list_success),
    tool_call_success_total: validCount(source.tool_call_success_total),
    tools: Object.fromEntries(METRIC_TOOL_NAMES.map((name) => [name, validCount(sourceTools[name])])),
  };
}

function normalizeStore(value) {
  const days = value?.days && typeof value.days === "object" && !Array.isArray(value.days) ? value.days : {};
  const normalized = { schemaVersion: 1, days: {} };
  for (const [day, counters] of Object.entries(days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(day)) continue;
    normalized.days[day] = {
      real: normalizeCounters(counters?.real),
      synthetic: normalizeCounters(counters?.synthetic),
    };
  }
  return normalized;
}

function retentionCutoff(now, retentionDays) {
  return dateKey(new Date(now.getTime() - (retentionDays - 1) * 24 * 60 * 60 * 1000));
}

export class AggregateMetrics {
  constructor({ enabled = false, directory, retentionDays = DEFAULT_RETENTION_DAYS, flushDelayMs = DEFAULT_FLUSH_DELAY_MS, now = () => new Date() } = {}) {
    this.enabled = enabled;
    this.directory = directory;
    this.file = directory ? join(directory, "daily.json") : undefined;
    this.retentionDays = Number.isInteger(retentionDays) && retentionDays > 0 ? retentionDays : DEFAULT_RETENTION_DAYS;
    this.flushDelayMs = Number.isInteger(flushDelayMs) && flushDelayMs >= 0 ? flushDelayMs : DEFAULT_FLUSH_DELAY_MS;
    this.now = now;
    this.store = { schemaVersion: 1, days: {} };
    this.loaded = false;
    this.loading = undefined;
    this.timer = undefined;
    this.revision = 0;
    this.persistedRevision = 0;
    this.writeChain = Promise.resolve();
  }

  async load() {
    if (!this.enabled || this.loaded) return;
    if (!this.directory) throw new Error("FENGWEILOU_METRICS_DIR_REQUIRED");
    if (!this.loading) {
      this.loading = (async () => {
        await mkdir(this.directory, { recursive: true, mode: 0o750 });
        try {
          this.store = normalizeStore(JSON.parse(await readFile(this.file, "utf8")));
        } catch (error) {
          if (error?.code !== "ENOENT") console.error(JSON.stringify({ event: "metrics_load_failed", code: "INVALID_OR_UNREADABLE_METRICS" }));
          this.store = { schemaVersion: 1, days: {} };
        }
        this.prune(this.now());
        this.loaded = true;
      })();
    }
    await this.loading;
  }

  prune(now) {
    const cutoff = retentionCutoff(now, this.retentionDays);
    for (const day of Object.keys(this.store.days)) if (day < cutoff) delete this.store.days[day];
  }

  async record(event, { synthetic = false, toolName } = {}) {
    if (!this.enabled || !METRIC_EVENTS.has(event)) return;
    if (event === "tool_call_success" && !TOOL_NAME_SET.has(toolName)) return;
    await this.load();
    const now = this.now();
    this.prune(now);
    const day = dateKey(now);
    this.store.days[day] ??= emptyDay();
    const counters = this.store.days[day][synthetic ? "synthetic" : "real"];
    if (event === "handshake_success") counters.handshake_success += 1;
    if (event === "tools_list_success") counters.tools_list_success += 1;
    if (event === "tool_call_success") {
      counters.tool_call_success_total += 1;
      counters.tools[toolName] += 1;
    }
    this.revision += 1;
    this.scheduleFlush();
  }

  scheduleFlush() {
    if (this.timer || !this.enabled) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.flush().catch(() => {
        console.error(JSON.stringify({ event: "metrics_flush_failed", code: "AGGREGATE_WRITE_UNAVAILABLE" }));
      });
    }, this.flushDelayMs);
    this.timer.unref?.();
  }

  async flush() {
    if (!this.enabled) return;
    await this.load();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.writeChain = this.writeChain.then(async () => {
      if (this.persistedRevision === this.revision) return;
      const revision = this.revision;
      const payload = `${JSON.stringify(normalizeStore(this.store), null, 2)}\n`;
      const temporary = join(this.directory, `.daily.json.${process.pid}.${revision}.tmp`);
      await writeFile(temporary, payload, { encoding: "utf8", mode: 0o600 });
      await rename(temporary, this.file);
      await chmod(this.file, 0o600);
      this.persistedRevision = revision;
    });
    await this.writeChain;
    if (this.persistedRevision !== this.revision) await this.flush();
  }
}

function enabledFromEnv(value) {
  return value === "1" || value?.toLowerCase() === "true";
}

export function createMetricsFromEnv(env = process.env) {
  const retentionDays = Number.parseInt(env.FENGWEILOU_METRICS_RETENTION_DAYS ?? `${DEFAULT_RETENTION_DAYS}`, 10);
  return new AggregateMetrics({
    enabled: enabledFromEnv(env.FENGWEILOU_METRICS_ENABLED),
    directory: env.FENGWEILOU_METRICS_DIR,
    retentionDays,
  });
}

export const aggregateMetrics = createMetricsFromEnv();
