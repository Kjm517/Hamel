/**
 * Strip non-essential comments from Main source files.
 * Keeps: eslint-*, @ts-expect-error/@ts-ignore/@ts-nocheck/@ts-check,
 * license headers, and JSDoc (/** ... *\/).
 *
 * Strategy: never treat `/` as regex (avoids JSX `</` false positives).
 * Inside template literals, copy as-is except strip comments inside `${...}`
 * via recursive scan with correct brace/string/template nesting.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIR = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.vite',
]);

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css']);

function shouldKeepComment(text) {
  const t = text.trim();
  if (/eslint-(disable|enable|env|pragma)/i.test(t)) return true;
  if (/@ts-(expect-error|ignore|nocheck|check)\b/.test(t)) return true;
  if (
    /\b(SPDX-License-Identifier|Copyright\b|Licensed under|All rights reserved|@license\b|Apache License|MIT License)\b/i.test(
      t
    )
  ) {
    return true;
  }
  if (t.startsWith('/**')) return true;
  return false;
}

function isEscaped(src, i) {
  let n = 0;
  for (let j = i - 1; j >= 0 && src[j] === '\\'; j--) n++;
  return n % 2 === 1;
}

/** Skip a ' or " string starting at i; returns index after closing quote. */
function skipString(src, i) {
  const q = src[i];
  i++;
  while (i < src.length) {
    if (src[i] === '\n' || src[i] === '\r') return i;
    if (src[i] === q && !isEscaped(src, i)) return i + 1;
    i++;
  }
  return i;
}

/**
 * Skip a template literal starting at backtick i.
 * Returns index after closing backtick.
 */
function skipTemplate(src, i) {
  i++; // past `
  while (i < src.length) {
    if (src[i] === '`' && !isEscaped(src, i)) return i + 1;
    if (src[i] === '$' && src[i + 1] === '{' && !isEscaped(src, i)) {
      i = skipTemplateExpr(src, i + 2);
      continue;
    }
    i++;
  }
  return i;
}

/** Skip `${` expression body starting at first char after `{`; returns index after closing `}`. */
function skipTemplateExpr(src, i) {
  let depth = 1;
  while (i < src.length && depth > 0) {
    const c = src[i];
    if (c === "'" || c === '"') {
      i = skipString(src, i);
      continue;
    }
    if (c === '`') {
      i = skipTemplate(src, i);
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i + 1 < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return i;
}

function stripJsLike(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  /** @type {'code' | 'squote' | 'dquote' | 'template' | 'line' | 'block'} */
  let state = 'code';
  let blockStart = 0;

  while (i < n) {
    const c = src[i];
    const n1 = src[i + 1];

    if (state === 'code') {
      if (c === "'") {
        state = 'squote';
        out += c;
        i++;
        continue;
      }
      if (c === '"') {
        state = 'dquote';
        out += c;
        i++;
        continue;
      }
      if (c === '`') {
        state = 'template';
        out += c;
        i++;
        continue;
      }
      if (c === '/' && n1 === '/' && !isEscaped(src, i)) {
        state = 'line';
        blockStart = i;
        i += 2;
        continue;
      }
      if (c === '/' && n1 === '*' && !isEscaped(src, i)) {
        state = 'block';
        blockStart = i;
        i += 2;
        continue;
      }
      out += c;
      i++;
      continue;
    }

    if (state === 'squote') {
      out += c;
      if (c === "'" && !isEscaped(src, i)) state = 'code';
      i++;
      continue;
    }

    if (state === 'dquote') {
      out += c;
      if (c === '"' && !isEscaped(src, i)) state = 'code';
      i++;
      continue;
    }

    if (state === 'template') {
      if (c === '`' && !isEscaped(src, i)) {
        out += c;
        state = 'code';
        i++;
        continue;
      }
      if (c === '$' && n1 === '{' && !isEscaped(src, i)) {
        out += '${';
        const exprStart = i + 2;
        const after = skipTemplateExpr(src, exprStart);
        const expr = src.slice(exprStart, after - 1); // exclude closing }
        out += stripJsLike(expr);
        out += '}';
        i = after;
        continue;
      }
      out += c;
      i++;
      continue;
    }

    if (state === 'line') {
      if (c === '\n' || c === '\r') {
        const comment = src.slice(blockStart, i);
        if (shouldKeepComment(comment)) out += comment;
        state = 'code';
        out += c;
        i++;
        continue;
      }
      i++;
      continue;
    }

    if (state === 'block') {
      if (c === '*' && n1 === '/') {
        const comment = src.slice(blockStart, i + 2);
        if (shouldKeepComment(comment)) out += comment;
        else out += comment.replace(/[^\n\r]/g, '');
        state = 'code';
        i += 2;
        continue;
      }
      i++;
      continue;
    }
  }

  if (state === 'line') {
    const comment = src.slice(blockStart);
    if (shouldKeepComment(comment)) out += comment;
  }

  return out;
}

function stripCss(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    if (src[i] === '/' && src[i + 1] === '*') {
      let end = i + 2;
      while (end + 1 < n && !(src[end] === '*' && src[end + 1] === '/')) end++;
      end = Math.min(end + 2, n);
      const comment = src.slice(i, end);
      if (shouldKeepComment(comment)) out += comment;
      else out += comment.replace(/[^\n\r]/g, '');
      i = end;
      continue;
    }
    if (src[i] === "'" || src[i] === '"') {
      const q = src[i];
      out += q;
      i++;
      while (i < n) {
        out += src[i];
        if (src[i] === q && !isEscaped(src, i)) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    out += src[i];
    i++;
  }
  return out;
}

function collapseBlankRuns(src) {
  return src.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n');
}

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(ent.name))) {
      if (ent.name === '_app.mjs') continue;
      if (ent.name === 'strip-comments.mjs') continue;
      if (ent.name === 'debug-comments.mjs') continue;
      files.push(full);
    }
  }
  return files;
}

const files = walk(ROOT);
let changed = 0;

for (const file of files) {
  const ext = path.extname(file);
  const raw = fs.readFileSync(file, 'utf8');
  let next = ext === '.css' ? stripCss(raw) : stripJsLike(raw);
  // JSX section comments often sit after apostrophes in text nodes (`don't`),
  // which fools a naive quote scanner — sweep remaining `{/* ... */}` in TSX/JSX.
  if (ext === '.tsx' || ext === '.jsx') {
    next = next.replace(/\{\/\*[\s\S]*?\*\/\}/g, (block) =>
      shouldKeepComment(block.slice(1, -1)) ? block : ''
    );
  }
  next = collapseBlankRuns(next);
  if (next !== raw) {
    fs.writeFileSync(file, next, 'utf8');
    changed++;
    console.log('stripped', path.relative(ROOT, file));
  }
}

console.log(`Done. Scanned ${files.length}, updated ${changed}.`);
