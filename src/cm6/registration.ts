/**
 * CodeMirror 6 language registration for Obsidian.
 *
 * Registers our shader languages so that fenced code blocks with
 * ```hlsl, ```cg, ```shaderlab (and aliases) get syntax highlighting
 * in Live Preview / Source mode.
 *
 * Uses LanguageDescription to integrate with CM6's language detection
 * system used by @codemirror/lang-markdown for code block highlighting.
 */

import { LanguageDescription } from "@codemirror/language";
import { hlslLanguage } from "../languages/hlsl";
import { cgLanguage } from "../languages/cg";
import { shaderlabLanguage } from "../languages/shaderlab";

/**
 * Create LanguageDescription entries for our shader languages.
 * These are used by CM6's markdown parser to match fenced code block
 * info strings to language modes.
 */
export function getShaderLanguageDescriptions(): LanguageDescription[] {
  return [
    LanguageDescription.of({
      name: "HLSL",
      alias: ["hlsl", "directx", "dx"],
      extensions: ["hlsl", "hlsli", "fx", "fxh", "vsh", "psh", "cginc"],
      load: async () => {
        return { language: hlslLanguage };
      },
    }),
    LanguageDescription.of({
      name: "CG",
      alias: ["cg", "nvidia-cg"],
      extensions: ["cg", "cginc"],
      load: async () => {
        return { language: cgLanguage };
      },
    }),
    LanguageDescription.of({
      name: "ShaderLab",
      alias: ["shaderlab", "unity-shader", "shader"],
      extensions: ["shader", "compute"],
      load: async () => {
        return { language: shaderlabLanguage };
      },
    }),
  ];
}
