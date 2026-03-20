/**
 * Prism.js grammar definitions for HLSL, CG, and ShaderLab.
 *
 * Obsidian uses Prism.js for syntax highlighting in Reading view.
 * We register grammars on `window.Prism.languages` so that fenced
 * code blocks render with proper highlighting.
 *
 * Token categories are mapped to Prism token types which in turn
 * map to CSS classes: token.keyword, token.function, token.builtin, etc.
 */

declare const window: Window & {
  Prism?: {
    languages: Record<string, any>;
  };
};

const hlslGrammar = {
  comment: [
    { pattern: /\/\*[\s\S]*?\*\//, greedy: true },
    { pattern: /\/\/.*$/, greedy: true, lookbehind: false },
  ],
  string: { pattern: /"(?:[^"\\]|\\.)*"/, greedy: true },
  preprocessor: {
    pattern: /^\s*#\s*(?:define|elif|else|endif|ifdef|ifndef|if|undef|include|line|error|pragma)\b.*/m,
    greedy: true,
    alias: "property",
    inside: {
      directive: {
        pattern: /^(\s*#\s*)\w+/,
        lookbehind: true,
        alias: "keyword",
      },
    },
  },
  semantic: {
    pattern:
      /(?<=:\s*)(?:BINORMAL|BLENDINDICES|BLENDWEIGHT|COLOR|NORMAL|POSITIONT?|PSIZE|TANGENT|TEXCOORD|FOG|TESSFACTOR|VFACE|VPOS|DEPTH|SV_ClipDistance|SV_CullDistance|SV_Coverage|SV_Depth|SV_DepthGreaterEqual|SV_DepthLessEqual|SV_InstanceID|SV_IsFrontFace|SV_Position|SV_RenderTargetArrayIndex|SV_SampleIndex|SV_StencilRef|SV_Target|SV_VertexID|SV_ViewportArrayIndex|SV_DispatchThreadID|SV_DomainLocation|SV_GroupID|SV_GroupIndex|SV_GroupThreadID|SV_GSInstanceID|SV_InsideTessFactor|SV_OutputControlPointID|SV_TessFactor|SV_InnerCoverage|SV_ShadingRate)\d*\b/i,
    alias: "variable",
  },
  number: [
    /\b0[xX][0-9a-fA-F]+[uUlL]*\b/,
    /\b[0-9]*\.[0-9]+(?:[eE][+-]?[0-9]+)?[fFhHlL]*\b/,
    /\b[0-9]+(?:[eE][+-]?[0-9]+)?[fFhHuUlL]*\b/,
  ],
  "class-name": [
    // Types with vector/matrix variants
    /\b(?:bool|double|dword|float|half|int|min10float|min12int|min16float|min16int|min16uint|uint|unsigned)(?:[1-4](?:x[1-4])?)?\b/,
    // Object/buffer/texture/sampler types
    /\b(?:AppendStructuredBuffer|Buffer|ByteAddressBuffer|ConstantBuffer|ConsumeStructuredBuffer|InputPatch|OutputPatch|RWBuffer|RWByteAddressBuffer|RWStructuredBuffer|RWTexture[123]D(?:Array)?|RasterizerOrdered(?:Buffer|ByteAddressBuffer|StructuredBuffer|Texture[123]D(?:Array)?)|LineStream|PointStream|TriangleStream|sampler\w*|SamplerState|SamplerComparisonState|texture2D|textureCUBE|Texture(?:1D(?:Array)?|2D(?:Array|MS(?:Array)?)?|3D|Cube(?:Array)?)|BlendState|DepthStencilState|RasterizerState|matrix|vector|void|string)\b/,
    // Unity structs
    /\b(?:appdata_base|appdata_tan|appdata_full|appdata_img|SurfaceOutputStandardSpecular|SurfaceOutputStandard|SurfaceOutput|Input)\b/,
  ],
  keyword: [
    /\b(?:break|case|continue|default|discard|do|else|for|if|return|switch|while|compile|typedef|cbuffer|class|interface|namespace|struct|tbuffer|technique\d*|Technique|pass)\b/,
  ],
  modifier: {
    pattern:
      /\b(?:column_major|const|export|extern|globallycoherent|groupshared|inline|inout|in|out|precise|row_major|shared|static|uniform|volatile|snorm|unorm|packoffset|register|centroid|linear|nointerpolation|noperspective|sample|lineadj|line|point|triangle|triangleadj)\b/,
    alias: "keyword",
  },
  builtin: {
    pattern:
      /\b(?:UNITY_MATRIX_\w+|_Object2World|_World2Object|unity_ObjectToWorld|unity_WorldToObject|_WorldSpaceCameraPos|_ProjectionParams|_ScreenParams|_ZBufferParams|unity_OrthoParams|unity_Camera\w+|_Time|_SinTime|_CosTime|unity_DeltaTime|_LightColor0|_WorldSpaceLightPos0|_LightMatrix0|unity_4Light\w+|unity_Light\w+|_LightColor|unity_SpotDirection|unity_Ambient\w+|UNITY_LIGHTMODEL_AMBIENT|unity_Fog\w+|unity_LODFade|SHADER_API_\w+|SHADER_TARGET|UNITY_VERSION|UNITY_\w+)\b/,
    alias: "variable",
  },
  function:
    /\b(?:abs|acos|all|any|asin|atan2?|ceil|clamp|clip|cosh?|cross|dd[xy](?:_(?:coarse|fine))?|degrees|determinant|distance|dot|exp2?|faceforward|floor|fma|fmod|frac|frexp|fwidth|isfinite|isinf|isnan|ldexp|length|lerp|lit|log(?:10|2)?|mad|max|min|modf|mul|normalize|pow|radians|rcp|reflect|refract|reversebits|round|rsqrt|saturate|sign|sincos|sinh?|smoothstep|sqrt|step|tanh?|transpose|trunc|tex(?:1D|2D|3D|CUBE)(?:bias|grad|lod|proj)?|countbits|firstbit(?:high|low)|as(?:float|double|int|uint)|f(?:16tof32|32tof16)|Interlocked\w+|(?:All|Device|Group)MemoryBarrier(?:WithGroupSync)?|Wave\w+|Quad\w+|TraceRay|ReportHit|CallShader|IgnoreHit|AcceptHitAndEndSearch)\b/,
  boolean: /\b(?:true|false|TRUE|FALSE)\b/,
  operator: /[+\-*/%&|^!<>=~?]+|&&|\|\|/,
  punctuation: /[{}()\[\];,.]/,
};

const cgGrammar = {
  ...hlslGrammar,
  "class-name": [
    // Includes fixed type family
    /\b(?:bool|double|dword|float|half|int|fixed|min10float|min12int|min16float|min16int|min16uint|uint|unsigned)(?:[1-4](?:x[1-4])?)?\b/,
    ...((hlslGrammar["class-name"] as any[]).slice(1)),
    /\b(?:samplerRECT|textureRECT)\b/,
  ],
  function: [
    hlslGrammar.function,
    /\b(?:texRECT(?:proj|bias|lod)?)\b/,
  ],
  keyword: [
    /\b(?:break|case|continue|default|discard|do|else|for|if|return|switch|while|compile|typedef|cbuffer|class|interface|namespace|struct|tbuffer|packed|emit)\b/,
  ],
};

const shaderlabGrammar: Record<string, any> = {
  comment: [
    { pattern: /\/\*[\s\S]*?\*\//, greedy: true },
    { pattern: /\/\/.*$/, greedy: true },
  ],
  "code-block": {
    pattern: /\b(CGPROGRAM|CGINCLUDE|HLSLPROGRAM|HLSLINCLUDE|GLSLPROGRAM|GLSLINCLUDE)\b[\s\S]*?\b(ENDCG|ENDHLSL|ENDGLSL)\b/,
    greedy: true,
    inside: {
      delimiter: {
        pattern: /\b(?:CGPROGRAM|CGINCLUDE|HLSLPROGRAM|HLSLINCLUDE|GLSLPROGRAM|GLSLINCLUDE|ENDCG|ENDHLSL|ENDGLSL)\b/,
        alias: "keyword",
      },
      // Embed the full HLSL grammar for content between delimiters
      ...hlslGrammar,
    },
  },
  string: { pattern: /"(?:[^"\\]|\\.)*"/, greedy: true },
  number: [
    /\b0[xX][0-9a-fA-F]+\b/,
    /\b[0-9]*\.[0-9]+\b/,
    /\b[0-9]+\b/,
  ],
  attribute: {
    pattern: /\[(?:HideInInspector|HDR|Gamma|MainTexture|MainColor|NoScaleOffset|Normal|Toggle|Enum|PowerSlider|Header|Space|IntRange|PerRendererData|KeywordEnum)(?:\([^)]*\))?\]/,
    alias: "annotation",
  },
  keyword: /\b(?:Shader|Properties|SubShader|Pass|Category)\b/i,
  command: {
    pattern:
      /\b(?:Name|Tags|Fallback|CustomEditor|CustomEditorForRenderPipeline|Cull|ZWrite|ZTest|Offset|Blend|BlendOp|ColorMask|AlphaToMask|LOD|Lighting|Stencil|Ref|ReadMask|WriteMask|Comp|CompBack|CompFront|Fail|ZFail|UsePass|GrabPass|Dependency|Material|Diffuse|Ambient|Shininess|Specular|Emission|Fog|Mode|Density|SeparateSpecular|SetTexture|Combine|ConstantColor|Matrix|AlphaTest|ColorMaterial|BindChannels|Bind)\b/i,
    alias: "property",
  },
  "property-type": {
    pattern: /\b(?:Range|Float|Int|Integer|Color|Vector|2D|2DArray|3D|Cube|CubeArray|Any)\b/i,
    alias: "class-name",
  },
  constant: {
    pattern:
      /\b(?:Back|Front|On|Off|Less|Greater|LEqual|GEqual|Equal|NotEqual|Always|Never|Keep|Zero|Replace|IncrSat|DecrSat|Invert|IncrWrap|DecrWrap|Add|Sub|RevSub|Min|Max|One|SrcColor|SrcAlpha|DstColor|DstAlpha|OneMinusSrcColor|OneMinusSrcAlpha|OneMinusDstColor|OneMinusDstAlpha|Previous|Primary|Texture|Constant|Lerp|Double|Quad|Alpha|Global|Linear|Exp2|Exp|Vertex|Normal|Tangent|TexCoord0|TexCoord1|Logical\w+)\b/i,
    alias: "boolean",
  },
  punctuation: /[{}()\[\];,.=]/,
};

/**
 * Register all shader Prism.js grammars for Obsidian Reading view.
 */
export function loadPrismShaderLanguages(): void {
  if (!window.Prism) return;

  window.Prism.languages["hlsl"] = hlslGrammar;
  window.Prism.languages["cg"] = cgGrammar;
  window.Prism.languages["shaderlab"] = shaderlabGrammar;

  // Aliases
  window.Prism.languages["shader"] = shaderlabGrammar;
  window.Prism.languages["unity-shader"] = shaderlabGrammar;
  window.Prism.languages["directx"] = hlslGrammar;
  window.Prism.languages["nvidia-cg"] = cgGrammar;
}
