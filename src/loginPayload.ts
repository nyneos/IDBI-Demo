export interface UserNameData {
  userName: string;
}

export interface LoginJsResult {
  /** Normalized payload sent to the API (`userName` key). */
  data: UserNameData;
  /** Raw value returned from your script (before normalization). */
  raw: unknown;
  logs: string[];
}

/** Default JS — runs as an async function body (await / fetch / console all work). */
export const DEFAULT_LOGIN_JS = `const name = "Kanav";
console.log(name);

return {
  name
};
`;

const RUN_TIMEOUT_MS = 15_000;

function formatLogArg(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function createConsoleProxy(logs: string[]) {
  const capture =
    (level: 'log' | 'info' | 'warn' | 'error' | 'debug') =>
    (...args: unknown[]) => {
      const line = args.map(formatLogArg).join(' ');
      logs.push(level === 'log' ? line : `[${level}] ${line}`);
      globalThis.console[level](...args);
    };

  return {
    log: capture('log'),
    info: capture('info'),
    warn: capture('warn'),
    error: capture('error'),
    debug: capture('debug'),
    clear: () => {
      logs.length = 0;
      globalThis.console.clear();
    },
  };
}

/** Browser globals available inside the script. */
function buildSandbox(consoleProxy: ReturnType<typeof createConsoleProxy>) {
  return {
    console: consoleProxy,
    fetch: globalThis.fetch.bind(globalThis),
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    queueMicrotask: globalThis.queueMicrotask.bind(globalThis),
    URL: globalThis.URL,
    URLSearchParams: globalThis.URLSearchParams,
    Headers: globalThis.Headers,
    Request: globalThis.Request,
    Response: globalThis.Response,
    AbortController: globalThis.AbortController,
    AbortSignal: globalThis.AbortSignal,
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    Blob: globalThis.Blob,
    File: globalThis.File,
    FormData: globalThis.FormData,
    atob: globalThis.atob.bind(globalThis),
    btoa: globalThis.btoa.bind(globalThis),
    encodeURIComponent: globalThis.encodeURIComponent.bind(globalThis),
    decodeURIComponent: globalThis.decodeURIComponent.bind(globalThis),
    structuredClone: globalThis.structuredClone?.bind(globalThis),
    crypto: globalThis.crypto,
    performance: globalThis.performance,
    Math: globalThis.Math,
    Date: globalThis.Date,
    JSON: globalThis.JSON,
    Number: globalThis.Number,
    String: globalThis.String,
    Boolean: globalThis.Boolean,
    Array: globalThis.Array,
    Object: globalThis.Object,
    Map: globalThis.Map,
    Set: globalThis.Set,
    WeakMap: globalThis.WeakMap,
    WeakSet: globalThis.WeakSet,
    Promise: globalThis.Promise,
    Error: globalThis.Error,
    TypeError: globalThis.TypeError,
    RangeError: globalThis.RangeError,
    SyntaxError: globalThis.SyntaxError,
    RegExp: globalThis.RegExp,
    parseInt: globalThis.parseInt,
    parseFloat: globalThis.parseFloat,
    isNaN: globalThis.isNaN,
    isFinite: globalThis.isFinite,
    Infinity: globalThis.Infinity,
    NaN: globalThis.NaN,
    undefined: undefined,
  };
}

/**
 * Accepts any of:
 *   return "Kanav"
 *   return { name: "Kanav" }
 *   return { userName: "Kanav" }
 *   return { anything: "Kanav" }
 * First non-empty string value wins (object keys in order).
 */
function parseUserNameResult(result: unknown): UserNameData {
  if (typeof result === 'string' && result.trim()) {
    return { userName: result.trim() };
  }

  if (typeof result === 'number' || typeof result === 'boolean') {
    return { userName: String(result) };
  }

  if (result && typeof result === 'object' && !Array.isArray(result)) {
    const values = Object.values(result as Record<string, unknown>);
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return { userName: value.trim() };
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return { userName: String(value) };
      }
    }
  }

  if (Array.isArray(result)) {
    for (const value of result) {
      if (typeof value === 'string' && value.trim()) {
        return { userName: value.trim() };
      }
    }
  }

  throw new Error(
    'Your code must return a non-empty string, or an object/array containing one (any variable name).',
  );
}

function formatScriptError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err.trim();

  if (err && typeof err === 'object' && !Array.isArray(err)) {
    const values = Object.values(err as Record<string, unknown>);
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    }
  }

  if (Array.isArray(err)) {
    for (const value of err) {
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }

  return String(err);
}

/**
 * Runs editor source as a complete async function body.
 * Supports: await, fetch, console, timers, JSON, Date, Math, Promises, etc.
 *
 * Example:
 *   const name = "Kanav";
 *   console.log(name);
 *   return { name };
 */
export async function runLoginJs(source: string): Promise<LoginJsResult> {
  const logs: string[] = [];
  const consoleProxy = createConsoleProxy(logs);
  const sandbox = buildSandbox(consoleProxy);
  const paramNames = Object.keys(sandbox);
  const paramValues = Object.values(sandbox);

  let result: unknown;
  try {
    // Async IIFE so `await` / `return` work like normal JS in a function.
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...paramNames,
      `"use strict";\nreturn (async () => {\n${source}\n})();`,
    );

    const pending = fn(...paramValues) as Promise<unknown>;

    result = await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        globalThis.setTimeout(() => {
          reject(new Error(`Script timed out after ${RUN_TIMEOUT_MS / 1000}s`));
        }, RUN_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    throw new Error(`JS error: ${formatScriptError(err)}`);
  }

  return {
    data: parseUserNameResult(result),
    raw: result,
    logs,
  };
}
