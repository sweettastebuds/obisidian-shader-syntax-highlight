/**
 * ShaderLab language support for CodeMirror 6.
 *
 * ShaderLab is Unity's shader wrapper language. It has its own block structure
 * (Shader, Properties, SubShader, Pass) with embedded HLSL/CG code inside
 * CGPROGRAM/ENDCG or HLSLPROGRAM/ENDHLSL blocks.
 *
 * This parser handles context-switching: when it encounters a code block
 * delimiter, it switches to HLSL tokenization rules. This mirrors the
 * compound-lexer approach used by JetBrains Rider.
 */

import { StreamLanguage, StringStream, StreamParser } from "@codemirror/language";
import {
  // ShaderLab tokens
  shaderlabStructureKeywords,
  shaderlabPropertyTypes,
  shaderlabCommands,
  shaderlabAllConstants,
  shaderlabBlockDelimiters,
  shaderlabAttributes,
  // HLSL tokens (for embedded blocks)
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
  hlslFxPropertyKeys,
  unityAllBuiltinVars,
  unityAllDefines,
  unityAllStructs,
  cgExtraTypes,
  cgExtraIntrinsics,
  cgExtraKeywords,
  cgTypePattern,
} from "./tokens";

/** Combined types for embedded HLSL/CG blocks */
const embeddedTypes: Set<string> = new Set([...hlslAllTypes, ...cgExtraTypes]);
const embeddedIntrinsics: Set<string> = new Set([...hlslIntrinsics, ...cgExtraIntrinsics]);
const embeddedKeywords: Set<string> = new Set([...hlslKeywords, ...cgExtraKeywords]);

type Context = "shaderlab" | "hlsl";

interface ShaderLabState {
  context: Context;
  inBlockComment: boolean;
  afterColon: boolean;
  inAttribute: boolean;
}

// ─── Embedded HLSL/CG tokenizer ─────────────────────────────────────────────

function tokenHLSL(stream: StringStream, state: ShaderLabState): string | null {
  // Check for end of embedded block
  if (stream.match(/^ENDCG\b/) || stream.match(/^ENDHLSL\b/) || stream.match(/^ENDGLSL\b/)) {
    state.context = "shaderlab";
    return "keyword";
  }

  // Block comment continuation
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

  // Block comment start
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

  // Preprocessor
  if (ch === "#") {
    stream.next();
    stream.eatWhile(/\s/);
    stream.match(/^[a-zA-Z_]+/);
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

  // Numbers
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

  // Identifiers
  if (/[a-zA-Z_]/.test(ch)) {
    stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    const word = stream.current();

    // Semantic after colon
    if (state.afterColon) {
      state.afterColon = false;
      if (hlslSemanticPattern.test(word)) return "variableName.special";
      if (hlslAllSemantics.has(word)) return "variableName.special";
    }
    state.afterColon = false;

    // Check for end-of-block keywords that might have been consumed
    if (word === "ENDCG" || word === "ENDHLSL" || word === "ENDGLSL") {
      state.context = "shaderlab";
      return "keyword";
    }

    if (embeddedKeywords.has(word)) return "keyword";
    if (hlslStructureKeywords.has(word)) return "keyword";
    if (hlslTypeAliases.has(word)) return "keyword";
    if (embeddedTypes.has(word)) return "typeName";
    if (hlslTypePattern.test(word)) return "typeName";
    if (cgTypePattern.test(word)) return "typeName";
    if (unityAllStructs.has(word)) return "typeName";
    if (hlslAllModifiers.has(word)) return "modifier";
    if (hlslAtoms.has(word)) return "atom";
    if (unityAllBuiltinVars.has(word)) return "variableName.special";
    if (unityAllDefines.has(word)) return "variableName.special";
    if (hlslFxPropertyKeys.has(word)) return "propertyName";
    if (embeddedIntrinsics.has(word)) return "variableName.definition";

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

// ─── ShaderLab outer language tokenizer ──────────────────────────────────────

function tokenShaderLab(stream: StringStream, state: ShaderLabState): string | null {
  // Check for start of embedded code block
  if (stream.match(/^(CGPROGRAM|CGINCLUDE|HLSLPROGRAM|HLSLINCLUDE|GLSLPROGRAM|GLSLINCLUDE)\b/)) {
    state.context = "hlsl";
    return "keyword";
  }

  // Block comment continuation
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

  // Block comment
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

  // Numbers
  if (ch >= "0" && ch <= "9" || (ch === "." && stream.match(/^\.\d/, false))) {
    if (stream.match(/^0[xX][0-9a-fA-F]+/)) return "number";
    if (stream.match(/^[0-9]*\.[0-9]+/)) return "number";
    if (stream.match(/^[0-9]+/)) return "number";
  }

  // Attributes: [HideInInspector], [HDR], etc.
  if (ch === "[") {
    stream.next();
    state.inAttribute = true;
    return "punctuation";
  }
  if (ch === "]" && state.inAttribute) {
    stream.next();
    state.inAttribute = false;
    return "punctuation";
  }

  // Identifiers
  if (/[a-zA-Z_]/.test(ch)) {
    stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    const word = stream.current();

    // Inside attribute brackets
    if (state.inAttribute) {
      if (shaderlabAttributes.has(word)) return "meta";
      return "meta";
    }

    // Block delimiters (shouldn't reach here but safety check)
    if (shaderlabBlockDelimiters.has(word)) {
      if (word.startsWith("END")) {
        // Shouldn't happen in shaderlab context
      } else {
        state.context = "hlsl";
      }
      return "keyword";
    }

    // Structure keywords
    if (shaderlabStructureKeywords.has(word)) return "keyword";

    // Property types
    if (shaderlabPropertyTypes.has(word)) return "typeName";

    // Commands
    if (shaderlabCommands.has(word)) return "propertyName";

    // Constant/enum values
    if (shaderlabAllConstants.has(word)) return "atom";

    return "variableName";
  }

  // Braces, parens, etc.
  if (stream.match(/^[{}()\[\];,.=]/)) return "punctuation";

  stream.next();
  return null;
}

// ─── Main parser with context switching ──────────────────────────────────────

const shaderlabParser: StreamParser<ShaderLabState> = {
  name: "shaderlab",
  startState(): ShaderLabState {
    return {
      context: "shaderlab",
      inBlockComment: false,
      afterColon: false,
      inAttribute: false,
    };
  },
  token(stream: StringStream, state: ShaderLabState): string | null {
    if (state.context === "hlsl") {
      return tokenHLSL(stream, state);
    }
    return tokenShaderLab(stream, state);
  },
  languageData: {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
  },
};

export const shaderlabLanguage = StreamLanguage.define(shaderlabParser);
