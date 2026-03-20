/**
 * CG language support for CodeMirror 6.
 *
 * CG is essentially early HLSL (SM 1-3 era) with a few additions:
 * - `fixed` type family
 * - `samplerRECT` / `textureRECT`
 * - `texRECT*` functions
 * - `packed` keyword
 *
 * We reuse the HLSL tokenizer logic but extend the token sets.
 */

import { StreamLanguage, StringStream, StreamParser } from "@codemirror/language";
import {
  hlslKeywords,
  hlslStructureKeywords,
  hlslTypeAliases,
  hlslAllTypes,
  hlslTypePattern,
  hlslAllModifiers,
  hlslIntrinsics,
  hlslAllSemantics,
  hlslSemanticPattern,
  hlslAtoms,
  unityAllBuiltinVars,
  unityAllDefines,
  unityAllStructs,
  cgExtraTypes,
  cgExtraIntrinsics,
  cgExtraKeywords,
  cgTypePattern,
} from "./tokens";

/** Merged CG types = HLSL types + CG extras */
const cgAllTypes: Set<string> = new Set([...hlslAllTypes, ...cgExtraTypes]);

/** Merged CG intrinsics = HLSL intrinsics + CG extras */
const cgAllIntrinsics: Set<string> = new Set([...hlslIntrinsics, ...cgExtraIntrinsics]);

/** Merged CG keywords = HLSL keywords + CG extras */
const cgAllKeywords: Set<string> = new Set([...hlslKeywords, ...cgExtraKeywords]);

interface CGState {
  inBlockComment: boolean;
  afterColon: boolean;
}

function tokenBase(stream: StringStream, state: CGState): string | null {
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

  if (stream.eatSpace()) return null;

  const ch = stream.peek()!;

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

  if (ch === "/" && stream.match("//")) {
    stream.skipToEnd();
    return "comment";
  }

  if (ch === "#") {
    stream.next();
    stream.eatWhile(/\s/);
    stream.match(/^[a-zA-Z_]+/);
    stream.skipToEnd();
    return "meta";
  }

  if (ch === '"') {
    stream.next();
    while (!stream.eol()) {
      const c = stream.next();
      if (c === '"') break;
      if (c === "\\") stream.next();
    }
    return "string";
  }

  if (ch >= "0" && ch <= "9" || (ch === "." && stream.match(/^\.\d/, false))) {
    if (stream.match(/^0[xX][0-9a-fA-F]+[uUlL]*/)) return "number";
    if (stream.match(/^[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?[fFhHlL]*/)) return "number";
    if (stream.match(/^[0-9]+([eE][+-]?[0-9]+)?[fFhHuUlL]*/)) return "number";
  }

  if (ch === ":") {
    stream.next();
    state.afterColon = true;
    return "punctuation";
  }

  if (/[a-zA-Z_]/.test(ch)) {
    stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    const word = stream.current();

    if (state.afterColon) {
      state.afterColon = false;
      if (hlslSemanticPattern.test(word)) return "variableName.special";
      if (hlslAllSemantics.has(word)) return "variableName.special";
    }
    state.afterColon = false;

    if (cgAllKeywords.has(word)) return "keyword";
    if (hlslStructureKeywords.has(word)) return "keyword";
    if (hlslTypeAliases.has(word)) return "keyword";
    if (cgAllTypes.has(word)) return "typeName";
    if (cgTypePattern.test(word)) return "typeName";
    if (unityAllStructs.has(word)) return "typeName";
    if (hlslAllModifiers.has(word)) return "modifier";
    if (hlslAtoms.has(word)) return "atom";
    if (unityAllBuiltinVars.has(word)) return "variableName.special";
    if (unityAllDefines.has(word)) return "variableName.special";
    if (cgAllIntrinsics.has(word)) return "variableName.definition";

    return "variableName";
  }

  if (stream.match(/^[+\-*/%&|^!<>=~?]+/)) return "operator";
  if (stream.match(/^[{}()\[\];,.]/)) {
    state.afterColon = false;
    return "punctuation";
  }

  stream.next();
  state.afterColon = false;
  return null;
}

const cgParser: StreamParser<CGState> = {
  name: "cg",
  startState(): CGState {
    return { inBlockComment: false, afterColon: false };
  },
  token(stream: StringStream, state: CGState): string | null {
    return tokenBase(stream, state);
  },
  languageData: {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
  },
};

export const cgLanguage = StreamLanguage.define(cgParser);
