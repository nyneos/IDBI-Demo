export type Token =
  | { type: 'number'; value: string }
  | { type: 'field'; value: string }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: string }
  | { type: 'function'; value: string }
  | { type: 'comma'; value: string };

export type ExpressionNode =
  | { kind: 'number'; value: number }
  | { kind: 'field'; name: string }
  | { kind: 'unary'; op: '-'; arg: ExpressionNode }
  | { kind: 'binary'; op: string; left: ExpressionNode; right: ExpressionNode }
  | { kind: 'call'; name: string; args: ExpressionNode[] };

const FUNCTIONS = ['SUM', 'AVG', 'MIN', 'MAX', 'COUNT', 'IF', 'ROUND', 'ABS'] as const;

export function tokenize(formula: string): Token[] {
  const src = formula.replace(/^=/, '').trim();
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'comma', value: ch });
      i += 1;
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i += 1;
      continue;
    }
    if ('+-*/><=!'.includes(ch)) {
      let op = ch;
      if ((ch === '>' || ch === '<' || ch === '!' || ch === '=') && src[i + 1] === '=') {
        op += '=';
        i += 1;
      }
      tokens.push({ type: 'operator', value: op });
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let n = ch;
      i += 1;
      while (i < src.length && /[0-9.]/.test(src[i]!)) {
        n += src[i];
        i += 1;
      }
      tokens.push({ type: 'number', value: n });
      continue;
    }
    if (ch === '[' || /[A-Za-z_]/.test(ch)) {
      if (ch === '[') {
        i += 1;
        let name = '';
        while (i < src.length && src[i] !== ']') {
          name += src[i];
          i += 1;
        }
        i += 1;
        tokens.push({ type: 'field', value: name.trim() });
        continue;
      }
      let name = ch;
      i += 1;
      while (i < src.length && /[A-Za-z0-9_ %]/.test(src[i]!)) {
        name += src[i];
        i += 1;
      }
      const upper = name.trim().toUpperCase();
      if ((FUNCTIONS as readonly string[]).includes(upper) && src[i] === '(') {
        tokens.push({ type: 'function', value: upper });
      } else {
        tokens.push({ type: 'field', value: name.trim() });
      }
      continue;
    }
    throw new Error(`Unexpected character "${ch}"`);
  }
  return tokens;
}

function parsePrimary(tokens: Token[], i: { at: number }): ExpressionNode {
  const t = tokens[i.at];
  if (!t) throw new Error('Unexpected end of formula');
  if (t.type === 'number') {
    i.at += 1;
    return { kind: 'number', value: Number(t.value) };
  }
  if (t.type === 'field') {
    i.at += 1;
    return { kind: 'field', name: t.value };
  }
  if (t.type === 'function') {
    i.at += 1;
    if (tokens[i.at]?.value !== '(') throw new Error(`Expected ( after ${t.value}`);
    i.at += 1;
    const args: ExpressionNode[] = [];
    if (tokens[i.at]?.value !== ')') {
      args.push(parseExpr(tokens, i, 0));
      while (tokens[i.at]?.type === 'comma') {
        i.at += 1;
        args.push(parseExpr(tokens, i, 0));
      }
    }
    if (tokens[i.at]?.value !== ')') throw new Error('Expected )');
    i.at += 1;
    return { kind: 'call', name: t.value, args };
  }
  if (t.type === 'operator' && t.value === '-') {
    i.at += 1;
    return { kind: 'unary', op: '-', arg: parsePrimary(tokens, i) };
  }
  if (t.type === 'paren' && t.value === '(') {
    i.at += 1;
    const inner = parseExpr(tokens, i, 0);
    if (tokens[i.at]?.value !== ')') throw new Error('Expected )');
    i.at += 1;
    return inner;
  }
  throw new Error(`Unexpected token ${t.value}`);
}

const PREC: Record<string, number> = {
  '*': 40,
  '/': 40,
  '+': 30,
  '-': 30,
  '>': 20,
  '<': 20,
  '>=': 20,
  '<=': 20,
  '=': 20,
  '!=': 20,
};

function parseExpr(tokens: Token[], i: { at: number }, minPrec: number): ExpressionNode {
  let left = parsePrimary(tokens, i);
  while (true) {
    const t = tokens[i.at];
    if (!t || t.type !== 'operator' || t.value === '-') {
      if (!t || t.type !== 'operator') break;
    }
    const prec = PREC[t.value] ?? -1;
    if (prec < minPrec) break;
    i.at += 1;
    const right = parseExpr(tokens, i, prec + 1);
    left = { kind: 'binary', op: t.value, left, right };
  }
  return left;
}

export function parse(tokens: Token[]): ExpressionNode {
  const i = { at: 0 };
  const node = parseExpr(tokens, i, 0);
  if (i.at !== tokens.length) throw new Error('Unexpected extra tokens');
  return node;
}

export function collectFields(node: ExpressionNode, out = new Set<string>()): Set<string> {
  if (node.kind === 'field') out.add(node.name);
  if (node.kind === 'unary') collectFields(node.arg, out);
  if (node.kind === 'binary') {
    collectFields(node.left, out);
    collectFields(node.right, out);
  }
  if (node.kind === 'call') node.args.forEach((a) => collectFields(a, out));
  return out;
}

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return NaN;
}

export function evaluate(
  node: ExpressionNode,
  row: Record<string, number>,
  params: Record<string, number> = {},
): number {
  switch (node.kind) {
    case 'number':
      return node.value;
    case 'field':
      if (node.name in params) return params[node.name]!;
      return row[node.name] ?? NaN;
    case 'unary':
      return -evaluate(node.arg, row, params);
    case 'binary': {
      const a = evaluate(node.left, row, params);
      const b = evaluate(node.right, row, params);
      switch (node.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return b === 0 ? NaN : a / b;
        case '>':
          return a > b ? 1 : 0;
        case '<':
          return a < b ? 1 : 0;
        case '>=':
          return a >= b ? 1 : 0;
        case '<=':
          return a <= b ? 1 : 0;
        case '=':
          return a === b ? 1 : 0;
        case '!=':
          return a !== b ? 1 : 0;
        default:
          return NaN;
      }
    }
    case 'call': {
      const args = node.args.map((a) => evaluate(a, row, params));
      switch (node.name) {
        case 'ABS':
          return Math.abs(args[0] ?? NaN);
        case 'ROUND':
          return Math.round((args[0] ?? NaN) * 10 ** (args[1] ?? 0)) / 10 ** (args[1] ?? 0);
        case 'IF':
          return args[0] ? (args[1] ?? 0) : (args[2] ?? 0);
        case 'MIN':
          return Math.min(...args);
        case 'MAX':
          return Math.max(...args);
        case 'SUM':
          return args.reduce((s, n) => s + n, 0);
        case 'AVG':
          return args.length ? args.reduce((s, n) => s + n, 0) / args.length : NaN;
        case 'COUNT':
          return args.filter((n) => Number.isFinite(n)).length;
        default:
          return NaN;
      }
    }
    default:
      return NaN;
  }
}

export function validateFormula(formula: string, knownFields: string[]): { ok: true; node: ExpressionNode } | { ok: false; error: string } {
  try {
    const node = parse(tokenize(formula));
    const used = [...collectFields(node)];
    const unknown = used.find((f) => !knownFields.includes(f));
    if (unknown) return { ok: false, error: `Unknown field: ${unknown}` };
    return { ok: true, node };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid formula' };
  }
}

export function applyCalculatedField(
  rows: Record<string, string | number | null>[],
  name: string,
  formula: string,
  params: Record<string, number> = {},
): Record<string, string | number | null>[] {
  const parsed = validateFormula(
    formula,
    [...new Set(rows.flatMap((r) => Object.keys(r))), ...Object.keys(params)],
  );
  if (!parsed.ok) throw new Error(parsed.error);
  return rows.map((row) => {
    const numeric: Record<string, number> = {};
    for (const [k, v] of Object.entries(row)) numeric[k] = num(v);
    const value = evaluate(parsed.node, numeric, params);
    return { ...row, [name]: Number.isFinite(value) ? value : null };
  });
}
