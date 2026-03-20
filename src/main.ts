/**
 * Obsidian Shader Syntax Highlighting Plugin
 *
 * Provides syntax highlighting for HLSL, CG, and ShaderLab (Unity)
 * shader languages in both Live Preview/Source mode (CodeMirror 6)
 * and Reading mode.
 *
 * Architecture:
 *   - Reading view: registerMarkdownCodeBlockProcessor with self-tokenized HTML
 *   - Editor view: CM6 ViewPlugin scanning document text for fenced blocks
 *     and applying decoration marks from our StreamParsers
 *
 * This avoids dependency on Prism.js internals or CM6 syntax tree node names,
 * both of which can vary across Obsidian versions.
 */

import { Plugin, MarkdownPostProcessorContext } from "obsidian";
import { RangeSetBuilder } from "@codemirror/state";
import {
  ViewPlugin, ViewUpdate, EditorView,
  Decoration, DecorationSet,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

import { loadPrismShaderLanguages } from "./prism/prism-shaders";

// ─── Import the raw parsers directly (not the StreamLanguage wrappers) ───────
// This avoids the streamParser access issue entirely.

import {
  hlslKeywords, hlslStructureKeywords, hlslFxKeywords, hlslTypeAliases,
  hlslAllTypes, hlslTypePattern, hlslAllModifiers, hlslIntrinsics,
  hlslAllSemantics, hlslSemanticPattern, hlslAtoms, hlslFxPropertyKeys,
  unityAllBuiltinVars, unityAllDefines, unityAllStructs,
  cgExtraTypes, cgExtraIntrinsics, cgExtraKeywords, cgTypePattern,
  shaderlabStructureKeywords, shaderlabPropertyTypes, shaderlabCommands,
  shaderlabAllConstants, shaderlabBlockDelimiters, shaderlabAttributes,
} from "./languages/tokens";

// ─── Lightweight line-by-line tokenizer ──────────────────────────────────────
// Instead of depending on StreamLanguage/StringStream internals,
// we use a simple regex-based tokenizer that works identically in both
// the CM6 ViewPlugin and the Reading view code block processor.

interface Token {
  start: number;
  end: number;
  type: string;
}

interface TokenizerState {
  inBlockComment: boolean;
  afterColon: boolean;
  context: "shaderlab" | "hlsl";
  inAttribute: boolean;
}

function newState(lang: string): TokenizerState {
  return {
    inBlockComment: false,
    afterColon: false,
    context: lang === "shaderlab" ? "shaderlab" : "hlsl",
    inAttribute: false,
  };
}

/** Combined CG types/intrinsics/keywords */
const cgAllTypes: Set<string> = new Set([...hlslAllTypes, ...cgExtraTypes]);
const cgAllIntrinsics: Set<string> = new Set([...hlslIntrinsics, ...cgExtraIntrinsics]);
const cgAllKeywords: Set<string> = new Set([...hlslKeywords, ...cgExtraKeywords]);

type LangId = "hlsl" | "cg" | "shaderlab";

/**
 * Classify a single identifier in HLSL/CG context.
 */
function classifyHLSLWord(word: string, state: TokenizerState, isCG: boolean): string {
  // Semantic after colon
  if (state.afterColon) {
    state.afterColon = false;
    if (hlslSemanticPattern.test(word)) return "semantic";
    if (hlslAllSemantics.has(word)) return "semantic";
  }
  state.afterColon = false;

  // Block delimiters (end embedded block)
  if (word === "ENDCG" || word === "ENDHLSL" || word === "ENDGLSL") {
    state.context = "shaderlab";
    return "keyword";
  }

  const kw = isCG ? cgAllKeywords : hlslKeywords;
  if (kw.has(word)) return "keyword";
  if (hlslStructureKeywords.has(word)) return "keyword";
  if (hlslFxKeywords.has(word)) return "keyword";
  if (hlslTypeAliases.has(word)) return "keyword";

  const types = isCG ? cgAllTypes : hlslAllTypes;
  if (types.has(word)) return "type";
  if (isCG ? cgTypePattern.test(word) : hlslTypePattern.test(word)) return "type";
  if (unityAllStructs.has(word)) return "type";

  if (hlslAllModifiers.has(word)) return "modifier";
  if (hlslAtoms.has(word)) return "atom";
  if (unityAllBuiltinVars.has(word)) return "builtin-var";
  if (unityAllDefines.has(word)) return "builtin-var";
  if (hlslFxPropertyKeys.has(word)) return "property";

  const intrinsics = isCG ? cgAllIntrinsics : hlslIntrinsics;
  if (intrinsics.has(word)) return "function";

  return "variable";
}

/**
 * Classify a single identifier in ShaderLab outer context.
 */
function classifyShaderLabWord(word: string, state: TokenizerState): string {
  if (state.inAttribute) {
    if (shaderlabAttributes.has(word)) return "meta";
    return "meta";
  }

  // Block delimiter → switch to HLSL
  if (shaderlabBlockDelimiters.has(word)) {
    if (!word.startsWith("END")) {
      state.context = "hlsl";
    }
    return "keyword";
  }

  if (shaderlabStructureKeywords.has(word)) return "keyword";
  if (shaderlabPropertyTypes.has(word)) return "type";
  if (shaderlabCommands.has(word)) return "property";
  if (shaderlabAllConstants.has(word)) return "atom";

  return "variable";
}

/**
 * Tokenize a single line. Returns tokens with character offsets within the line.
 */
function tokenizeLine(
  line: string,
  state: TokenizerState,
  langId: LangId
): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  const isCG = langId === "cg";
  const isShaderLab = langId === "shaderlab";

  while (pos < line.length) {
    // ── Block comment continuation ──
    if (state.inBlockComment) {
      const endIdx = line.indexOf("*/", pos);
      if (endIdx === -1) {
        tokens.push({ start: pos, end: line.length, type: "comment" });
        pos = line.length;
      } else {
        tokens.push({ start: pos, end: endIdx + 2, type: "comment" });
        pos = endIdx + 2;
        state.inBlockComment = false;
      }
      continue;
    }

    // ── Whitespace ──
    const wsMatch = line.substring(pos).match(/^\s+/);
    if (wsMatch) {
      pos += wsMatch[0].length;
      continue;
    }

    // ── Block comment start ──
    if (line[pos] === "/" && line[pos + 1] === "*") {
      const endIdx = line.indexOf("*/", pos + 2);
      if (endIdx === -1) {
        tokens.push({ start: pos, end: line.length, type: "comment" });
        state.inBlockComment = true;
        pos = line.length;
      } else {
        tokens.push({ start: pos, end: endIdx + 2, type: "comment" });
        pos = endIdx + 2;
      }
      continue;
    }

    // ── Line comment ──
    if (line[pos] === "/" && line[pos + 1] === "/") {
      tokens.push({ start: pos, end: line.length, type: "comment" });
      pos = line.length;
      continue;
    }

    // ── Preprocessor (only in HLSL context) ──
    if (line[pos] === "#" && (state.context === "hlsl" || !isShaderLab)) {
      tokens.push({ start: pos, end: line.length, type: "meta" });
      pos = line.length;
      continue;
    }

    // ── String ──
    if (line[pos] === '"') {
      let end = pos + 1;
      while (end < line.length) {
        if (line[end] === "\\") { end += 2; continue; }
        if (line[end] === '"') { end++; break; }
        end++;
      }
      tokens.push({ start: pos, end, type: "string" });
      pos = end;
      continue;
    }

    // ── Number ──
    const numMatch = line.substring(pos).match(
      /^(0[xX][0-9a-fA-F]+[uUlL]*|[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?[fFhHlL]*|[0-9]+([eE][+-]?[0-9]+)?[fFhHuUlL]*)/
    );
    if (numMatch && /[0-9.]/.test(line[pos])) {
      tokens.push({ start: pos, end: pos + numMatch[0].length, type: "number" });
      pos += numMatch[0].length;
      continue;
    }

    // ── Colon (semantic follows) ──
    if (line[pos] === ":") {
      state.afterColon = true;
      pos++;
      continue;
    }

    // ── Attribute brackets (ShaderLab outer) ──
    if (isShaderLab && state.context === "shaderlab") {
      if (line[pos] === "[") { state.inAttribute = true; pos++; continue; }
      if (line[pos] === "]") { state.inAttribute = false; pos++; continue; }
    }

    // ── Identifier ──
    const idMatch = line.substring(pos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    if (idMatch) {
      const word = idMatch[0];
      let type: string;

      if (isShaderLab && state.context === "shaderlab") {
        type = classifyShaderLabWord(word, state);
      } else {
        type = classifyHLSLWord(word, state, isCG);
      }

      // Promote unknown identifiers followed by '(' to function calls
      if (type === "variable") {
        const rest = line.substring(pos + word.length);
        if (/^\s*\(/.test(rest)) {
          type = "function";
        }
      }

      tokens.push({ start: pos, end: pos + word.length, type });
      pos += word.length;
      continue;
    }

    // ── Operator ──
    const opMatch = line.substring(pos).match(/^[+\-*/%&|^!<>=~?]+/);
    if (opMatch) {
      tokens.push({ start: pos, end: pos + opMatch[0].length, type: "operator" });
      pos += opMatch[0].length;
      state.afterColon = false;
      continue;
    }

    // ── Punctuation ──
    if (/[{}()\[\];,.]/.test(line[pos])) {
      state.afterColon = false;
      pos++;
      continue;
    }

    // ── Fallback ──
    state.afterColon = false;
    pos++;
  }

  return tokens;
}

// ─── Token type → CSS class mapping ──────────────────────────────────────────

const CSS_CLASSES: Record<string, string> = {
  keyword: "shader-keyword",
  type: "shader-type",
  function: "shader-function",
  semantic: "shader-semantic",
  "builtin-var": "shader-semantic",
  modifier: "shader-modifier",
  meta: "shader-meta",
  atom: "shader-atom",
  property: "shader-property",
  comment: "shader-comment",
  string: "shader-string",
  number: "shader-number",
  operator: "shader-operator",
  variable: "shader-variable",
};

// Pre-create CM6 decorations
const CM_DECORATIONS: Record<string, Decoration> = {};
for (const [type, cls] of Object.entries(CSS_CLASSES)) {
  CM_DECORATIONS[type] = Decoration.mark({ class: cls });
}

// ─── All recognized info strings ─────────────────────────────────────────────

const INFO_TO_LANG: Record<string, LangId> = {
  hlsl: "hlsl",
  directx: "hlsl",
  dx: "hlsl",
  cg: "cg",
  "nvidia-cg": "cg",
  shaderlab: "shaderlab",
  shader: "shaderlab",
  "unity-shader": "shaderlab",
};

const RECOGNIZED_LANGUAGES = new Set(Object.keys(INFO_TO_LANG));

// ─── Reading view: code block processor ──────────────────────────────────────
// We tokenize the code ourselves and build highlighted HTML spans.
// This avoids any dependency on Prism.js availability or timing.

function highlightCodeBlock(
  source: string,
  el: HTMLElement,
  langId: LangId
): void {
  // Clear any default content
  el.empty();

  const pre = el.createEl("pre", { cls: "shader-highlight" });
  const code = pre.createEl("code");

  const state = newState(langId);
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (i > 0) code.createEl("br");

    const line = lines[i];
    const tokens = tokenizeLine(line, state, langId);

    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start);

    let lastEnd = 0;
    for (const tok of tokens) {
      // Add any unhighlighted text before this token
      if (tok.start > lastEnd) {
        code.appendText(line.substring(lastEnd, tok.start));
      }

      const cls = CSS_CLASSES[tok.type];
      if (cls) {
        code.createEl("span", {
          cls,
          text: line.substring(tok.start, tok.end),
        });
      } else {
        code.appendText(line.substring(tok.start, tok.end));
      }
      lastEnd = tok.end;
    }

    // Trailing text after last token
    if (lastEnd < line.length) {
      code.appendText(line.substring(lastEnd));
    }
  }
}

// ─── Editor view: CM6 ViewPlugin ─────────────────────────────────────────────
// Scans the raw document text for fenced code blocks instead of relying
// on CM6 syntax tree node names (which vary across Obsidian versions).

interface CodeBlockRange {
  langId: LangId;
  contentFrom: number;
  contentTo: number;
}

/**
 * Find fenced code blocks by scanning document text directly.
 * This is more robust than depending on syntax tree node names.
 */
function findCodeBlocksInDoc(view: EditorView): CodeBlockRange[] {
  const blocks: CodeBlockRange[] = [];
  const doc = view.state.doc;
  const { from: vpFrom, to: vpTo } = view.viewport;

  // We need to scan slightly beyond viewport for blocks that start before it
  const scanFrom = Math.max(0, vpFrom - 5000);
  const scanTo = Math.min(doc.length, vpTo + 1000);

  let lineNo = doc.lineAt(scanFrom).number;
  const endLineNo = doc.lineAt(Math.min(scanTo, doc.length)).number;

  while (lineNo <= endLineNo) {
    const line = doc.line(lineNo);
    const text = line.text;

    // Check for opening fence
    const openMatch = text.match(/^(\s*)(```|~~~)\s*(\S+)/);
    if (openMatch) {
      const lang = openMatch[3].toLowerCase();
      if (RECOGNIZED_LANGUAGES.has(lang)) {
        const fence = openMatch[2];
        const indent = openMatch[1];
        const contentFrom = line.to + 1; // after the newline

        // Find closing fence
        let closeLineNo = lineNo + 1;
        let found = false;
        while (closeLineNo <= doc.lines) {
          const closeLine = doc.line(closeLineNo);
          // Closing fence must have same or fewer indent and same fence char
          const closeMatch = closeLine.text.match(
            new RegExp(`^\\s*${fence.charAt(0)}{${fence.length},}\\s*$`)
          );
          if (closeMatch) {
            const contentTo = closeLine.from; // before the closing fence line
            if (contentTo > contentFrom) {
              blocks.push({
                langId: INFO_TO_LANG[lang],
                contentFrom,
                contentTo: contentTo - 1, // exclude the trailing newline
              });
            }
            lineNo = closeLineNo + 1;
            found = true;
            break;
          }
          closeLineNo++;
        }
        if (found) continue;
      }
    }

    lineNo++;
  }

  return blocks;
}

/**
 * CM6 ViewPlugin: tokenizes shader code blocks and applies CSS decorations.
 */
const shaderHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();

      try {
        const blocks = findCodeBlocksInDoc(view);

        for (const block of blocks) {
          const content = view.state.doc.sliceString(
            block.contentFrom,
            block.contentTo + 1
          );

          const state = newState(block.langId);
          const lines = content.split("\n");
          let pos = block.contentFrom;

          for (const line of lines) {
            const tokens = tokenizeLine(line, state, block.langId);

            for (const tok of tokens) {
              const deco = CM_DECORATIONS[tok.type];
              if (deco) {
                const from = pos + tok.start;
                const to = pos + tok.end;
                // Bounds check
                if (from >= block.contentFrom && to <= block.contentTo + 1) {
                  builder.add(from, to, deco);
                }
              }
            }

            pos += line.length + 1;
          }
        }
      } catch (e) {
        console.error("Shader syntax highlight error:", e);
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ─── Plugin entry ────────────────────────────────────────────────────────────

export default class ShaderSyntaxPlugin extends Plugin {
  async onload() {
    console.log("Shader Syntax: loading");

    // -- Reading view: Prism.js grammars (for any renderers that use Prism) --
    loadPrismShaderLanguages();

    // -- Editor view: CM6 ViewPlugin --
    this.registerEditorExtension(shaderHighlightPlugin);

    // -- Reading view: code block processors (self-tokenized HTML) --
    for (const [infoStr, langId] of Object.entries(INFO_TO_LANG)) {
      this.registerMarkdownCodeBlockProcessor(
        infoStr,
        (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
          highlightCodeBlock(source, el, langId);
        }
      );
    }

    console.log("Shader Syntax: registered hlsl, cg, shaderlab (editor + reading)");
  }

  onunload() {
    console.log("Shader Syntax: unloaded");
  }
}
