struct NormalUniforms {
  mvp       : mat4x4<f32>,
  model     : mat4x4<f32>,
  normalMat : mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> u : NormalUniforms;

struct VSIn {
  @location(0) position    : vec3<f32>,
  @location(1) normal      : vec3<f32>,
  @location(2) barycentric : vec3<f32>,
  @location(3) uv          : vec2<f32>,
};

struct VSOut {
  @builtin(position) clipPos : vec4<f32>,
  @location(0) worldNormal   : vec3<f32>,
};

@vertex
fn vs_normals(input: VSIn) -> VSOut {
  var out: VSOut;
  out.clipPos     = u.mvp * vec4<f32>(input.position, 1.0);
  let wn4         = u.normalMat * vec4<f32>(input.normal, 0.0);
  out.worldNormal = normalize(wn4.xyz);
  return out;
}

@fragment
fn fs_normals(input: VSOut) -> @location(0) vec4<f32> {
  let N = normalize(input.worldNormal);
  let encoded = N * 0.5 + vec3<f32>(0.5);
  return vec4<f32>(encoded, 1.0);
}
