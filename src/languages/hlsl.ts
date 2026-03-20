/**
 * HLSL language support for CodeMirror 6.
 *
 * Uses a custom StreamParser rather than the clike legacy mode for finer
 * control over token categories — specifically to differentiate types,
 * semantics, intrinsic functions, modifiers, and keywords as separate
 * token types, which the generic clike mode conflates.
 */

import { StreamLanguage, StringStream, StreamParser } from "@codemirror/language";
import {
  hlslKeywords,
  hlslStructureKeywords,
  hlslFxKeywords,
  hlslTypeAliases,
  hlslAllTypes,
  hlslTypePattern,
  hlslAllModifiers,
  hlslIntrinsics,
  hlslAllSemantics,
  hlslSemanticPattern,
  hlslAtoms,
  hlslFxPropertyKeys,
  unityAllBuiltinVars,
  unityAllDefines,
  unityAllStructs,
} from "./tokens";

interface HLSLState {
  inBlockComment: boolean;
  afterColon: boolean;
}

function tokenBase(stream: StringStream, state: HLSLState): string | null {
  // Block comments
  if (state.inBlockComment) {
    const idx = stream.string.indexOf("*/", stream.pos);
    if (idx === -1) {
      stream.skipToEnd();
    } else {
      stream.pos = idx + 2;
      state.inBlockComment = false;
    }
    return "comment";
  }

  // Whitespace
  if (stream.eatSpace()) return null;

  const ch = stream.peek()!;

  // Start of block comment
  if (ch === "/" && stream.match("/*")) {
    state.inBlockComment = true;
    const idx = stream.string.indexOf("*/", stream.pos);
    if (idx === -1) {
      stream.skipToEnd();
    } else {
      stream.pos = idx + 2;
      state.inBlockComment = false;
    }
    return "comment";
  }

  // Line comment
  if (ch === "/" && stream.match("//")) {
    stream.skipToEnd();
    return "comment";
  }

  // Preprocessor directives
  if (ch === "#") {
    stream.next();
    stream.eatWhile(/\s/);
    const directive = stream.match(/^[a-zA-Z_]+/);
    if (directive) {
      stream.skipToEnd();
      return "meta";
    }
    stream.skipToEnd();
    return "meta";
  }

  // Strings
  if (ch === '"') {
    stream.next();
    while (!stream.eol()) {
      const c = stream.next();
      if (c === '"') break;
      if (c === "\\") stream.next();
    }
    return "string";
  }

  // Numbers (hex, decimal with optional float suffix)
  if (ch >= "0" && ch <= "9" || (ch === "." && stream.match(/^\.\d/, false))) {
    if (stream.match(/^0[xX][0-9a-fA-F]+[uUlL]*/)) return "number";
    if (stream.match(/^[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?[fFhHlL]*/)) return "number";
    if (stream.match(/^[0-9]+([eE][+-]?[0-9]+)?[fFhHuUlL]*/)) return "number";
  }

  // Colon — next identifier might be a semantic
  if (ch === ":") {
    stream.next();
    state.afterColon = true;
    return "punctuation";
  }

  // Identifiers and keywords
  if (/[a-zA-Z_]/.test(ch)) {
    stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    const word = stream.current();

    // After colon, check for semantics
    if (state.afterColon) {
      state.afterColon = false;
      if (hlslSemanticPattern.test(word)) return "variableName.special";
      if (hlslAllSemantics.has(word)) return "variableName.special";
    }
    state.afterColon = false;

    // Keywords
    if (hlslKeywords.has(word)) return "keyword";
    if (hlslStructureKeywords.has(word)) return "keyword";
    if (hlslFxKeywords.has(word)) return "keyword";
    if (hlslTypeAliases.has(word)) return "keyword";

    // Types
    if (hlslAllTypes.has(word)) return "typeName";
    if (hlslTypePattern.test(word)) return "typeName";

    // Unity struct types
    if (unityAllStructs.has(word)) return "typeName";

    // Modifiers
    if (hlslAllModifiers.has(word)) return "modifier";

    // Atoms / constants
    if (hlslAtoms.has(word)) return "atom";

    // Unity built-in variables (before intrinsics so they don't get caught as functions)
    if (unityAllBuiltinVars.has(word)) return "variableName.special";

    // Unity defines
    if (unityAllDefines.has(word)) return "variableName.special";

    // FX property keys
    if (hlslFxPropertyKeys.has(word)) return "propertyName";

    // Intrinsic functions — check if followed by '('
    if (hlslIntrinsics.has(word)) return "variableName.definition";

    // Default identifier
    return "variableName";
  }

  // Operators and punctuation
  if (stream.match(/^[+\-*/%&|^!<>=~?]+/)) return "operator";
  if (stream.match(/^[{}()\[\];,.]/)) {
    state.afterColon = false;
    return "punctuation";
  }

  // Fallback
  stream.next();
  state.afterColon = false;
  return null;
}

const hlslParser: StreamParser<HLSLState> = {
  name: "hlsl",
  startState(): HLSLState {
    return { inBlockComment: false, afterColon: false };
  },
  token(stream: StringStream, state: HLSLState): string | null {
    return tokenBase(stream, state);
  },
  languageData: {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
  },
};

export const hlslLanguage = StreamLanguage.define(hlslParser);
