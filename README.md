# Shader Syntax Highlighting for Obsidian

Syntax highlighting for **HLSL**, **CG**, and **ShaderLab** (Unity) shader languages in Obsidian. Works in both Live Preview/Source mode (CodeMirror 6) and Reading mode (Prism.js).

## Supported Languages

| Code Block Tag | Language | Aliases |
|---|---|---|
| ` ```hlsl ` | High Level Shading Language | `directx`, `dx` |
| ` ```cg ` | NVIDIA CG | `nvidia-cg` |
| ` ```shaderlab ` | Unity ShaderLab | `shader`, `unity-shader` |

## Features

- **10 distinct token categories** — keywords, types, intrinsic functions, semantics, modifiers, preprocessor directives, constants, ShaderLab commands, Unity built-in variables, and attributes are all highlighted with distinct colors
- **Nested language support** — ShaderLab code blocks automatically switch to HLSL/CG highlighting inside `CGPROGRAM`/`HLSLPROGRAM` blocks
- **100+ HLSL intrinsic functions** — including SM6.0+ wave intrinsics and DXR raytracing intrinsics
- **Full semantic highlighting** — legacy semantics (`TEXCOORD0`, `COLOR`) and system-value semantics (`SV_Position`, `SV_Target`)
- **Unity-specific tokens** — built-in matrices (`UNITY_MATRIX_MVP`), camera/time/lighting variables, platform defines, surface output structs
- **Light and dark theme support** — colors automatically adapt via CSS custom properties
- **Dual rendering** — highlights in both editor mode (CM6) and reading mode (Prism.js)

## Token Categories

| Category | Examples | Color (Dark) |
|---|---|---|
| Keywords | `if`, `for`, `struct`, `cbuffer`, `Shader`, `Pass` | Purple |
| Types | `float4`, `Texture2D`, `SamplerState`, `half3` | Teal |
| Intrinsic Functions | `mul`, `lerp`, `saturate`, `tex2D`, `TraceRay` | Yellow |
| Semantics | `SV_Position`, `TEXCOORD0`, `COLOR` | Light Blue |
| Modifiers | `static`, `uniform`, `const`, `nointerpolation` | Blue |
| Preprocessor | `#define`, `#include`, `#pragma vertex` | Purple |
| Constants | `true`, `false`, `Off`, `LEqual`, `SrcAlpha` | Light Green |
| Commands | `Blend`, `ZWrite`, `Cull`, `Tags`, `Fallback` | Gold |
| Comments | `// ...`, `/* ... */` | Green (italic) |
| Strings / Numbers | `"shader name"`, `0.5`, `0xFF` | Orange / Green |

## Customizing Colors

Override any token color in your vault's CSS snippet:

```css
:root {
  --shader-keyword: #ff79c6;
  --shader-type: #8be9fd;
  --shader-function: #f1fa8c;
  /* ... see styles.css for all variables */
}
```

## Installation

### Manual

1. Copy `main.js`, `manifest.json`, and `styles.css` to your vault at `.obsidian/plugins/shader-syntax-highlight/`
2. Enable the plugin in Settings → Community Plugins

### Development

```bash
npm install
npm run build        # production build
npm run dev          # development build with source maps
```

## Attribution

Token dictionaries are derived from [tgjones/shaders-tmLanguage](https://github.com/tgjones/shaders-tmLanguage) (MIT License), the canonical TextMate grammar repository used by VS Code's built-in HLSL and ShaderLab extensions.

Unity-specific tokens reference the [Unity Shader documentation](https://docs.unity3d.com/Manual/SL-Reference.html) and [JetBrains/resharper-unity](https://github.com/JetBrains/resharper-unity) (Apache 2.0).

Thank you to [obsidian-svelte-syntax-highlighter](https://typhoon-kim.github.io/obsidian-svelte-syntax-highlighter/), and [obsidian-gdscript](https://github.com/RobTheFiveNine/obsidian-gdscript) for inspiration.

## License

MIT
