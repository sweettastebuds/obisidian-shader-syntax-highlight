/**
 * Token dictionaries for HLSL, CG, and ShaderLab syntax highlighting.
 *
 * Derived from tgjones/shaders-tmLanguage (MIT License)
 * https://github.com/tgjones/shaders-tmLanguage
 * Which is the canonical source for VS Code's built-in HLSL and ShaderLab grammars.
 *
 * Extended with Unity-specific tokens from Unity documentation and
 * JetBrains resharper-unity (Apache 2.0).
 */

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Convert a space-separated string into a Set for O(1) lookup */
function wordSet(str: string): Set<string> {
  return new Set(str.split(/\s+/).filter(Boolean));
}

// ─── HLSL Tokens ─────────────────────────────────────────────────────────────

/** Control flow keywords (keyword.control.hlsl) */
export const hlslKeywords = wordSet(
  `break case continue default discard do else for if return switch while`
);

/** Type alias keywords */
export const hlslTypeAliases = wordSet(`typedef`);

/** Storage/structure keywords (storage.type.structured.hlsl) */
export const hlslStructureKeywords = wordSet(
  `cbuffer class interface namespace struct tbuffer CBUFFER_START CBUFFER_END`
);

/** Effects framework keywords */
export const hlslFxKeywords = wordSet(
  `compile technique Technique technique10 technique11 pass`
);

/**
 * Scalar, vector, and matrix types (storage.type.basic.hlsl)
 * The tmLanguage uses regex patterns like bool([1-4](x[1-4])?)? to match
 * all vector/matrix variants. We enumerate the most common ones explicitly
 * and use a regex match for the full pattern in the tokenizer.
 */
export const hlslScalarTypes = wordSet(
  `bool double dword float half int matrix min10float min12int min16float ` +
  `min16int min16uint uint unsigned vector void string`
);

/** Regex pattern matching all HLSL basic types including vector/matrix variants */
export const hlslTypePattern =
  /^(bool|double|dword|float|half|int|min10float|min12int|min16float|min16int|min16uint|uint|unsigned)([1-4](x[1-4])?)?$|^(matrix|vector|void|string)$/;

/** Storage modifiers (storage.modifier.hlsl) */
export const hlslModifiers = wordSet(
  `column_major const export extern globallycoherent groupshared inline ` +
  `inout in out precise row_major shared static uniform volatile`
);

/** Float modifiers */
export const hlslFloatModifiers = wordSet(`snorm unorm`);

/** Postfix modifiers */
export const hlslPostfixModifiers = wordSet(`packoffset register`);

/** Interpolation modifiers (storage.modifier.interpolation.hlsl) */
export const hlslInterpolationModifiers = wordSet(
  `centroid linear nointerpolation noperspective sample`
);

/** Geometry shader modifiers */
export const hlslGeometryModifiers = wordSet(
  `lineadj line point triangle triangleadj`
);

/** Object types - buffers (support.type.object.hlsl) */
export const hlslBufferTypes = wordSet(
  `AppendStructuredBuffer Buffer ByteAddressBuffer ConstantBuffer ` +
  `ConsumeStructuredBuffer InputPatch OutputPatch`
);

/** RW object types */
export const hlslRWTypes = wordSet(
  `RWBuffer RWByteAddressBuffer RWStructuredBuffer ` +
  `RWTexture1D RWTexture1DArray RWTexture2D RWTexture2DArray RWTexture3D`
);

/** Rasterizer-ordered types */
export const hlslRasterizerOrderedTypes = wordSet(
  `RasterizerOrderedBuffer RasterizerOrderedByteAddressBuffer ` +
  `RasterizerOrderedStructuredBuffer RasterizerOrderedTexture1D ` +
  `RasterizerOrderedTexture1DArray RasterizerOrderedTexture2D ` +
  `RasterizerOrderedTexture2DArray RasterizerOrderedTexture3D`
);

/** Geometry stream types */
export const hlslStreamTypes = wordSet(
  `LineStream PointStream TriangleStream`
);

/** Legacy sampler types (support.type.sampler.legacy.hlsl) */
export const hlslLegacySamplerTypes = wordSet(
  `sampler sampler1D sampler2D sampler3D samplerCUBE sampler_state`
);

/** Modern sampler types */
export const hlslSamplerTypes = wordSet(
  `SamplerState SamplerComparisonState`
);

/** Legacy texture types */
export const hlslLegacyTextureTypes = wordSet(
  `texture2D textureCUBE`
);

/** Modern texture types (support.type.texture.hlsl) */
export const hlslTextureTypes = wordSet(
  `Texture1D Texture1DArray Texture2D Texture2DArray Texture2DMS ` +
  `Texture2DMSArray Texture3D TextureCube TextureCubeArray`
);

/** FX state types */
export const hlslFxStateTypes = wordSet(
  `BlendState DepthStencilState RasterizerState`
);

/** Combined set of all HLSL types for the tokenizer */
export const hlslAllTypes: Set<string> = new Set([
  ...hlslScalarTypes,
  ...hlslBufferTypes,
  ...hlslRWTypes,
  ...hlslRasterizerOrderedTypes,
  ...hlslStreamTypes,
  ...hlslLegacySamplerTypes,
  ...hlslSamplerTypes,
  ...hlslLegacyTextureTypes,
  ...hlslTextureTypes,
  ...hlslFxStateTypes,
]);

/** Combined set of all HLSL modifiers */
export const hlslAllModifiers: Set<string> = new Set([
  ...hlslModifiers,
  ...hlslFloatModifiers,
  ...hlslPostfixModifiers,
  ...hlslInterpolationModifiers,
  ...hlslGeometryModifiers,
]);

/**
 * HLSL intrinsic functions (support.function.hlsl)
 * The tmLanguage grammar matches any identifier followed by '(' as a function.
 * We enumerate known intrinsics for more precise highlighting.
 */
export const hlslIntrinsics = wordSet(
  // Math
  `abs acos all any asin atan atan2 ceil clamp clip cos cosh cross ` +
  `ddx ddx_coarse ddx_fine ddy ddy_coarse ddy_fine degrees determinant ` +
  `distance dot exp exp2 faceforward floor fma fmod frac frexp fwidth ` +
  `isfinite isinf isnan ldexp length lerp lit log log10 log2 mad max ` +
  `min modf mul normalize pow radians rcp reflect refract reversebits ` +
  `round rsqrt saturate sign sin sincos sinh smoothstep sqrt step tan ` +
  `tanh transpose trunc ` +
  // Texture sampling (legacy)
  `tex1D tex1Dbias tex1Dgrad tex1Dlod tex1Dproj ` +
  `tex2D tex2Dbias tex2Dgrad tex2Dlod tex2Dproj ` +
  `tex3D tex3Dbias tex3Dgrad tex3Dlod tex3Dproj ` +
  `texCUBE texCUBEbias texCUBEgrad texCUBElod texCUBEproj ` +
  // Bit operations
  `countbits firstbithigh firstbitlow ` +
  // Type casting
  `asfloat asdouble asint asuint f16tof32 f32tof16 ` +
  // Atomics
  `InterlockedAdd InterlockedAnd InterlockedCompareExchange ` +
  `InterlockedCompareStore InterlockedExchange InterlockedMax ` +
  `InterlockedMin InterlockedOr InterlockedXor ` +
  // Barriers
  `AllMemoryBarrier AllMemoryBarrierWithGroupSync DeviceMemoryBarrier ` +
  `DeviceMemoryBarrierWithGroupSync GroupMemoryBarrier ` +
  `GroupMemoryBarrierWithGroupSync ` +
  // Wave intrinsics (SM6.0+)
  `WaveGetLaneCount WaveGetLaneIndex WaveIsFirstLane WaveActiveAllTrue ` +
  `WaveActiveAnyTrue WaveActiveBallot WaveActiveAllEqual WaveActiveCountBits ` +
  `WaveActiveSum WaveActiveProduct WaveActiveMin WaveActiveMax ` +
  `WaveActiveBitAnd WaveActiveBitOr WaveActiveBitXor WavePrefixCountBits ` +
  `WavePrefixSum WavePrefixProduct WaveReadLaneFirst WaveReadLaneAt ` +
  `QuadReadLaneAt QuadReadAcrossDiagonal QuadReadAcrossX QuadReadAcrossY ` +
  // DXR raytracing intrinsics
  `TraceRay ReportHit CallShader IgnoreHit AcceptHitAndEndSearch ` +
  `DispatchRaysIndex DispatchRaysDimensions WorldRayOrigin WorldRayDirection ` +
  `ObjectRayOrigin ObjectRayDirection RayTMin RayTCurrent RayFlags ` +
  `InstanceID InstanceIndex PrimitiveIndex ObjectToWorld3x4 ObjectToWorld4x3 ` +
  `WorldToObject3x4 WorldToObject4x3 HitKind ` +
  // Misc
  `abort clip errorf GetRenderTargetSampleCount GetRenderTargetSamplePosition ` +
  `EvaluateAttributeAtCentroid EvaluateAttributeAtSample EvaluateAttributeSnapped ` +
  `Process2DQuadTessFactorsAvg Process2DQuadTessFactorsMax ` +
  `Process2DQuadTessFactorsMin ProcessIsolineTessFactors ` +
  `ProcessQuadTessFactorsAvg ProcessQuadTessFactorsMax ProcessQuadTessFactorsMin ` +
  `ProcessTriTessFactorsAvg ProcessTriTessFactorsMax ProcessTriTessFactorsMin ` +
  `printf`
);

/**
 * Legacy semantics (support.variable.semantic.hlsl)
 * Matched after ':' in the tmLanguage grammar
 */
export const hlslLegacySemantics = wordSet(
  `BINORMAL BLENDINDICES BLENDWEIGHT COLOR COLOR0 COLOR1 NORMAL ` +
  `POSITION POSITIONT PSIZE TANGENT TEXCOORD TEXCOORD0 TEXCOORD1 ` +
  `TEXCOORD2 TEXCOORD3 TEXCOORD4 TEXCOORD5 TEXCOORD6 TEXCOORD7 ` +
  `TEXCOORD8 TEXCOORD9 TEXCOORD10 TEXCOORD11 TEXCOORD12 TEXCOORD13 ` +
  `TEXCOORD14 TEXCOORD15 FOG TESSFACTOR VFACE VPOS DEPTH`
);

/**
 * System-value semantics SM4+ (support.variable.semantic.sm4.hlsl)
 */
export const hlslSVSemantics = wordSet(
  `SV_ClipDistance SV_CullDistance SV_Coverage SV_Depth ` +
  `SV_DepthGreaterEqual SV_DepthLessEqual SV_InstanceID SV_IsFrontFace ` +
  `SV_Position SV_RenderTargetArrayIndex SV_SampleIndex SV_StencilRef ` +
  `SV_Target SV_Target0 SV_Target1 SV_Target2 SV_Target3 SV_Target4 ` +
  `SV_Target5 SV_Target6 SV_Target7 SV_VertexID SV_ViewportArrayIndex ` +
  // SM5 semantics
  `SV_DispatchThreadID SV_DomainLocation SV_GroupID SV_GroupIndex ` +
  `SV_GroupThreadID SV_GSInstanceID SV_InsideTessFactor ` +
  `SV_OutputControlPointID SV_TessFactor ` +
  // SM5.1 semantics
  `SV_InnerCoverage SV_ShadingRate`
);

/** Combined set of all semantics */
export const hlslAllSemantics: Set<string> = new Set([
  ...hlslLegacySemantics,
  ...hlslSVSemantics,
]);

/** Semantic regex pattern for matching after ':' (handles numbered variants) */
export const hlslSemanticPattern =
  /^(BINORMAL|BLENDINDICES|BLENDWEIGHT|COLOR|NORMAL|POSITION|POSITIONT|PSIZE|TANGENT|TEXCOORD|FOG|TESSFACTOR|VFACE|VPOS|DEPTH|SV_ClipDistance|SV_CullDistance|SV_Coverage|SV_Depth|SV_DepthGreaterEqual|SV_DepthLessEqual|SV_InstanceID|SV_IsFrontFace|SV_Position|SV_RenderTargetArrayIndex|SV_SampleIndex|SV_StencilRef|SV_Target|SV_VertexID|SV_ViewportArrayIndex|SV_DispatchThreadID|SV_DomainLocation|SV_GroupID|SV_GroupIndex|SV_GroupThreadID|SV_GSInstanceID|SV_InsideTessFactor|SV_OutputControlPointID|SV_TessFactor|SV_InnerCoverage|SV_ShadingRate)\d*$/i;

/** FX property keys */
export const hlslFxPropertyKeys = wordSet(
  // BlendState
  `AlphaToCoverageEnable BlendEnable SrcBlend DestBlend BlendOp ` +
  `SrcBlendAlpha DestBlendAlpha BlendOpAlpha RenderTargetWriteMask ` +
  // DepthStencilState
  `DepthEnable DepthWriteMask DepthFunc StencilEnable StencilReadMask ` +
  `StencilWriteMask FrontFaceStencilFail FrontFaceStencilZFail ` +
  `FrontFaceStencilPass FrontFaceStencilFunc BackFaceStencilFail ` +
  `BackFaceStencilZFail BackFaceStencilPass BackFaceStencilFunc ` +
  // RasterizerState
  `FillMode CullMode FrontCounterClockwise DepthBias DepthBiasClamp ` +
  `SlopeScaleDepthBias ZClipEnable ScissorEnable MultiSampleEnable ` +
  `AntiAliasedLineEnable ` +
  // SamplerState
  `Filter AddressU AddressV AddressW MipLODBias MaxAnisotropy ` +
  `ComparisonFunc BorderColor MinLOD MaxLOD`
);

/** HLSL atoms / constants */
export const hlslAtoms = wordSet(`true false TRUE FALSE NULL`);

// ─── ShaderLab Tokens ────────────────────────────────────────────────────────

/** ShaderLab block structure keywords (storage.type.structure.shaderlab) */
export const shaderlabStructureKeywords = wordSet(
  `Shader Properties SubShader Pass Category CBUFFER_START CBUFFER_END`
);

/** ShaderLab property types (support.type.basic.shaderlab) */
export const shaderlabPropertyTypes = wordSet(
  `Range Float Int Integer Color Vector 2D 2DArray 3D Cube CubeArray Any`
);

/**
 * ShaderLab commands / property names (support.type.propertyname.shaderlab)
 * From the tmLanguage grammar
 */
export const shaderlabCommands = wordSet(
  `Name Tags Fallback CustomEditor CustomEditorForRenderPipeline ` +
  `Cull ZWrite ZTest Offset Blend BlendOp ColorMask AlphaToMask LOD ` +
  `Lighting Stencil Ref ReadMask WriteMask Comp CompBack CompFront ` +
  `Fail ZFail UsePass GrabPass Dependency ` +
  // Legacy fixed-function commands
  `Material Diffuse Ambient Shininess Specular Emission Fog Mode ` +
  `Density SeparateSpecular SetTexture Combine ConstantColor Matrix ` +
  `AlphaTest ColorMaterial BindChannels Bind`
);

/** ShaderLab simple constant values */
export const shaderlabConstants = wordSet(
  `Back Front On Off`
);

/** ShaderLab comparison functions */
export const shaderlabComparisonFuncs = wordSet(
  `Less Greater LEqual GEqual Equal NotEqual Always Never`
);

/** ShaderLab stencil operations */
export const shaderlabStencilOps = wordSet(
  `Keep Zero Replace IncrSat DecrSat Invert IncrWrap DecrWrap`
);

/** ShaderLab blend operations */
export const shaderlabBlendOps = wordSet(
  `Add Sub RevSub Min Max ` +
  `LogicalClear LogicalSet LogicalCopyInverted LogicalCopy LogicalNoop ` +
  `LogicalInvert LogicalAnd LogicalNand LogicalOr LogicalNor LogicalXor ` +
  `LogicalEquiv LogicalAndReverse LogicalAndInverted LogicalOrReverse ` +
  `LogicalOrInverted`
);

/** ShaderLab blend factors */
export const shaderlabBlendFactors = wordSet(
  `One SrcColor SrcAlpha DstColor DstAlpha ` +
  `OneMinusSrcColor OneMinusSrcAlpha OneMinusDstColor OneMinusDstAlpha`
);

/** ShaderLab texture combiner values */
export const shaderlabTextureCombinerValues = wordSet(
  `Previous Primary Texture Constant Lerp Double Quad Alpha`
);

/** ShaderLab fog constants */
export const shaderlabFogConstants = wordSet(`Global Linear Exp2 Exp`);

/** ShaderLab bind channels */
export const shaderlabBindChannels = wordSet(
  `Vertex Normal Tangent TexCoord0 TexCoord1`
);

/** Combined ShaderLab enum/constant values */
export const shaderlabAllConstants: Set<string> = new Set([
  ...shaderlabConstants,
  ...shaderlabComparisonFuncs,
  ...shaderlabStencilOps,
  ...shaderlabBlendOps,
  ...shaderlabBlendFactors,
  ...shaderlabTextureCombinerValues,
  ...shaderlabFogConstants,
  ...shaderlabBindChannels,
]);

/** ShaderLab code block delimiters */
export const shaderlabBlockDelimiters = wordSet(
  `CGPROGRAM ENDCG CGINCLUDE HLSLPROGRAM ENDHLSL HLSLINCLUDE ` +
  `GLSLPROGRAM ENDGLSL GLSLINCLUDE`
);

/** ShaderLab property attributes */
export const shaderlabAttributes = wordSet(
  `HideInInspector HDR Gamma MainTexture MainColor NoScaleOffset ` +
  `Normal Toggle Enum PowerSlider Header Space IntRange PerRendererData ` +
  `KeywordEnum`
);

// ─── Unity Built-in Variables ────────────────────────────────────────────────
// (support.variable.*.shaderlab from the tmLanguage hlsl-embedded section)

/** Unity transformation matrices */
export const unityTransformVars = wordSet(
  `UNITY_MATRIX_MVP UNITY_MATRIX_MV UNITY_MATRIX_M UNITY_MATRIX_V ` +
  `UNITY_MATRIX_P UNITY_MATRIX_VP UNITY_MATRIX_T_MV UNITY_MATRIX_I_V ` +
  `UNITY_MATRIX_IT_MV _Object2World _World2Object ` +
  `unity_ObjectToWorld unity_WorldToObject`
);

/** Unity camera variables */
export const unityCameraVars = wordSet(
  `_WorldSpaceCameraPos _ProjectionParams _ScreenParams _ZBufferParams ` +
  `unity_OrthoParams unity_CameraProjection unity_CameraInvProjection ` +
  `unity_CameraWorldClipPlanes`
);

/** Unity time variables */
export const unityTimeVars = wordSet(
  `_Time _SinTime _CosTime unity_DeltaTime`
);

/** Unity lighting variables */
export const unityLightingVars = wordSet(
  `_LightColor0 _WorldSpaceLightPos0 _LightMatrix0 ` +
  `unity_4LightPosX0 unity_4LightPosY0 unity_4LightPosZ0 unity_4LightAtten0 ` +
  `unity_LightColor _LightColor unity_LightPosition unity_LightAtten ` +
  `unity_SpotDirection`
);

/** Unity fog/ambient variables */
export const unityFogVars = wordSet(
  `unity_AmbientSky unity_AmbientEquator unity_AmbientGround ` +
  `UNITY_LIGHTMODEL_AMBIENT unity_FogColor unity_FogParams`
);

/** Unity misc variables */
export const unityMiscVars = wordSet(`unity_LODFade`);

/** Combined Unity built-in variables */
export const unityAllBuiltinVars: Set<string> = new Set([
  ...unityTransformVars,
  ...unityCameraVars,
  ...unityTimeVars,
  ...unityLightingVars,
  ...unityFogVars,
  ...unityMiscVars,
]);

/** Unity shader API platform defines */
export const unityPlatformDefines = wordSet(
  `SHADER_API_D3D9 SHADER_API_D3D11 SHADER_API_GLCORE SHADER_API_OPENGL ` +
  `SHADER_API_GLES SHADER_API_GLES3 SHADER_API_METAL SHADER_API_D3D11_9X ` +
  `SHADER_API_PSSL SHADER_API_XBOXONE SHADER_API_PSP2 SHADER_API_WIIU ` +
  `SHADER_API_MOBILE SHADER_API_GLSL SHADER_API_VULKAN ` +
  `SHADER_TARGET UNITY_VERSION`
);

/** Unity preprocessor platform-difference defines */
export const unityPlatformDifferenceDefines = wordSet(
  `UNITY_BRANCH UNITY_FLATTEN UNITY_NO_SCREENSPACE_SHADOWS ` +
  `UNITY_NO_LINEAR_COLORSPACE UNITY_NO_RGBM UNITY_NO_DXT5nm ` +
  `UNITY_FRAMEBUFFER_FETCH_AVAILABLE UNITY_USE_RGBA_FOR_POINT_SHADOWS ` +
  `UNITY_ATTEN_CHANNEL UNITY_HALF_TEXEL_OFFSET UNITY_UV_STARTS_AT_TOP ` +
  `UNITY_MIGHT_NOT_HAVE_DEPTH_Texture UNITY_NEAR_CLIP_VALUE UNITY_VPOS_TYPE ` +
  `UNITY_CAN_COMPILE_TESSELLATION UNITY_COMPILER_HLSL ` +
  `UNITY_COMPILER_HLSL2GLSL UNITY_COMPILER_CG UNITY_REVERSED_Z`
);

/** Unity pass type defines */
export const unityPassDefines = wordSet(
  `UNITY_PASS_FORWARDBASE UNITY_PASS_FORWARDADD UNITY_PASS_DEFERRED ` +
  `UNITY_PASS_SHADOWCASTER UNITY_PASS_PREPASSBASE UNITY_PASS_PREPASSFINAL`
);

/** Unity common struct names */
export const unityStructNames = wordSet(
  `appdata_base appdata_tan appdata_full appdata_img`
);

/** Unity surface output structs */
export const unitySurfaceStructs = wordSet(
  `SurfaceOutputStandardSpecular SurfaceOutputStandard SurfaceOutput Input`
);

/** Combined Unity defines */
export const unityAllDefines: Set<string> = new Set([
  ...unityPlatformDefines,
  ...unityPlatformDifferenceDefines,
  ...unityPassDefines,
]);

/** Combined Unity struct names */
export const unityAllStructs: Set<string> = new Set([
  ...unityStructNames,
  ...unitySurfaceStructs,
]);

// ─── CG-specific tokens (beyond HLSL overlap) ───────────────────────────────

/** CG-only types not in standard HLSL */
export const cgExtraTypes = wordSet(
  `fixed fixed1 fixed2 fixed3 fixed4 fixed1x1 fixed1x2 fixed1x3 fixed1x4 ` +
  `fixed2x1 fixed2x2 fixed2x3 fixed2x4 fixed3x1 fixed3x2 fixed3x3 fixed3x4 ` +
  `fixed4x1 fixed4x2 fixed4x3 fixed4x4 ` +
  `samplerRECT textureRECT`
);

/** CG-only intrinsic functions */
export const cgExtraIntrinsics = wordSet(
  `texRECT texRECTproj texRECTbias texRECTlod`
);

/** CG-only keywords */
export const cgExtraKeywords = wordSet(
  `packed emit`
);

/** CG type pattern includes fixed variants */
export const cgTypePattern =
  /^(bool|double|dword|float|half|int|fixed|min10float|min12int|min16float|min16int|min16uint|uint|unsigned)([1-4](x[1-4])?)?$|^(matrix|vector|void|string|samplerRECT|textureRECT)$/;

// ─── Unity pragma directives ─────────────────────────────────────────────────

/** Unity-specific pragma targets (matched after #pragma) */
export const unityPragmaDirectives = wordSet(
  `vertex fragment geometry hull domain surface target require ` +
  `multi_compile multi_compile_local shader_feature shader_feature_local ` +
  `multi_compile_fog multi_compile_instancing multi_compile_shadowcaster ` +
  `multi_compile_fwdbase multi_compile_fwdadd multi_compile_fwdadd_fullshadows ` +
  `only_renderers exclude_renderers once ` +
  `enable_d3d11_debug_symbols hardware_tier_variants ` +
  `skip_variants prefer_hlslcc`
);
