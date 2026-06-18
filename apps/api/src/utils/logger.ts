import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  type WriteStream,
} from "fs";
import { join } from "path";

const LOG_DIR = process.env.LOG_DIR ?? join(process.cwd(), "logs");
const KEEP_DAYS = 30;
const IS_TTY = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DDTHH:mm:ss.sss±HH:MM (local timezone) */
export function localISOString(d = new Date()): string {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `.${String(d.getMilliseconds()).padStart(3, "0")}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

function localDateStr(d = new Date()): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

const LEVELS: Record<number, string> = {
  10: "TRACE",
  20: "DEBUG",
  30: "INFO",
  40: "WARN",
  50: "ERROR",
  60: "FATAL",
};

const SKIP_KEYS = new Set(["level", "time", "pid", "hostname", "msg", "v"]);

function formatLine(raw: string): string {
  const line = raw.trimEnd();
  if (!line) return "\n";
  try {
    const obj = JSON.parse(line) as Record<string, unknown>;
    const level = LEVELS[obj.level as number] ?? String(obj.level ?? "?");

    // "2026-06-16T15:46:18.219+09:00" → "2026-06-16 15:46:18.219"
    const t = obj.time;
    const timeStr =
      typeof t === "string"
        ? t.substring(0, 23).replace("T", " ")
        : typeof t === "number"
          ? new Date(t).toISOString().substring(0, 23).replace("T", " ")
          : "?";

    const msg = String(obj.msg ?? "");

    const extras = Object.entries(obj)
      .filter(([k]) => !SKIP_KEYS.has(k))
      .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join(" ");

    return `[${timeStr}] ${level}: ${msg}${extras ? "  " + extras : ""}\n`;
  } catch {
    return raw.endsWith("\n") ? raw : raw + "\n";
  }
}

export class LogRotator {
  private stream!: WriteStream;
  private currentDate: string;
  private rotating = false;
  private buffer: string[] = [];
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
    this.currentDate = localDateStr();

    // 재시작 시 anduck.log가 이전 날짜면 즉시 백업
    const logPath = join(LOG_DIR, "anduck.log");
    if (existsSync(logPath)) {
      const fileDate = localDateStr(statSync(logPath).mtime);
      if (fileDate !== this.currentDate) {
        const bakPath = join(LOG_DIR, `anduck.${fileDate}.log`);
        if (!existsSync(bakPath)) renameSync(logPath, bakPath);
      }
    }

    this.openStream();
    this.timer = setInterval(() => this.checkRotate(), 60_000);
    this.timer.unref();
  }

  private openStream(): void {
    this.stream = createWriteStream(join(LOG_DIR, "anduck.log"), { flags: "a" });
  }

  private checkRotate(): void {
    const today = localDateStr();
    if (today !== this.currentDate) {
      this.rotate(today).catch((e) =>
        process.stderr.write(`[log-rotate] ${String(e)}\n`)
      );
    }
  }

  private async rotate(today: string): Promise<void> {
    if (this.rotating) return;
    this.rotating = true;
    const yesterday = this.currentDate;

    await new Promise<void>((res, rej) =>
      this.stream.end((e?: Error | null) => (e ? rej(e) : res()))
    );

    const src = join(LOG_DIR, "anduck.log");
    const dst = join(LOG_DIR, `anduck.${yesterday}.log`);
    if (existsSync(src)) renameSync(src, dst);

    this.currentDate = today;
    this.openStream();
    this.rotating = false;

    for (const c of this.buffer) this.stream.write(c);
    this.buffer = [];

    this.cleanup();
  }

  private cleanup(): void {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
      for (const f of readdirSync(LOG_DIR)) {
        const m = f.match(/^anduck\.(\d{4})(\d{2})(\d{2})\.log$/);
        if (!m) continue;
        if (new Date(+m[1], +m[2] - 1, +m[3]) < cutoff) {
          unlinkSync(join(LOG_DIR, f));
        }
      }
    } catch {
      // non-fatal
    }
  }

  // pino-compatible write signature
  write(chunk: string | Buffer, _enc?: string, cb?: (err?: Error | null) => void): boolean {
    const raw = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk;
    if (IS_TTY) process.stdout.write(raw);   // pino-pretty handles terminal formatting
    const line = formatLine(raw);            // plain text for file
    if (this.rotating) {
      this.buffer.push(line);
    } else {
      this.stream.write(line);
    }
    cb?.();
    return true;
  }

  flush(cb?: () => void): void {
    cb?.();
  }

  end(): void {
    if (this.timer) clearInterval(this.timer);
    this.stream.end();
  }
}
