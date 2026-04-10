(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function i(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(r){if(r.ep)return;r.ep=!0;const o=i(r);fetch(r.href,o)}})();const ve=`// shader.wgsl\r
// The uniform struct and vertex pipeline are already wired up for you.\r
// model_id values:\r
//   0 = Gouraud\r
//   1 = Phong\r
//   2 = Normals (visualize world-space normals as RGB)\r
//   3 = Wireframe\r
//   4 = Depth\r
//   5 = Texture\r
//   6 = UV Coords\r
//\r
// Useful WGSL built-ins:\r
//   normalize(v) — returns unit vector\r
//   dot(a, b) — scalar dot product\r
//   reflect(I, N) — reflects incident vector I around normal N\r
//   max(a, b) — component-wise max\r
//   pow(base, exp) — power function\r
//   dpdx(v), dpdy(v) — screen-space partial derivatives (fragment stage only)\r
//   cross(a, b)— cross product\r
\r
struct Uniforms {\r
  mvp        : mat4x4<f32>,\r
  model      : mat4x4<f32>,\r
  normalMat  : mat4x4<f32>,\r
\r
  lightPos   : vec3<f32>,\r
  _p0        : f32,\r
\r
  lightColor : vec3<f32>,\r
  _p1        : f32,\r
\r
  ambient    : f32,\r
  diffuse    : f32,\r
  specular   : f32,\r
  shininess  : f32,\r
\r
  camPos     : vec3<f32>,\r
  model_id   : u32,\r
\r
  objectColor : vec3<f32>,\r
  time        : f32,\r
  use_texture : u32,\r
  _p4 : f32,\r
  _p5 : f32,\r
  _p6 : f32,\r
};\r
\r
@group(0) @binding(0) var<uniform> u : Uniforms;\r
@group(0) @binding(1) var tex_samp   : sampler;\r
@group(0) @binding(2) var tex_img    : texture_2d<f32>;\r
\r
struct VSIn {\r
  @location(0) position    : vec3<f32>,\r
  @location(1) normal      : vec3<f32>,\r
  @location(2) barycentric : vec3<f32>,\r
  @location(3) uv          : vec2<f32>,\r
};\r
\r
struct VSOut {\r
  @builtin(position) clipPos : vec4<f32>,\r
  @location(0) worldPos      : vec3<f32>,\r
  @location(1) worldNormal   : vec3<f32>,\r
  @location(2) uv            : vec2<f32>,\r
  @location(3) gouraudColor  : vec3<f32>,\r
  @location(4) barycentric   : vec3<f32>,\r
  @location(5) depth: f32,\r
};\r
\r
fn gouraudLighting(N: vec3<f32>, vertWorldPos: vec3<f32>) -> vec3<f32> {\r
  let L = normalize(u.lightPos - vertWorldPos);\r
  let V = normalize(u.camPos   - vertWorldPos);\r
\r
  let ambientC  = u.ambient * u.lightColor;\r
  let NdotL     = max(dot(N, L), 0.0);\r
  let diffuseC  = u.diffuse * NdotL * u.lightColor;\r
\r
  var specularC = vec3<f32>(0.0);\r
  if NdotL > 0.0 {\r
    let R = reflect(-L, N);\r
    specularC = u.specular * pow(max(dot(R, V), 0.0), u.shininess) * u.lightColor;\r
  }\r
\r
  return (ambientC + diffuseC + specularC) * u.objectColor;\r
}\r
\r
fn phongLighting(N: vec3<f32>, fragWorldPos: vec3<f32>, baseColor: vec3<f32>) -> vec3<f32> {\r
  let L = normalize(u.lightPos - fragWorldPos);\r
  let V = normalize(u.camPos   - fragWorldPos);\r
  let ambientC  = u.ambient * u.lightColor;\r
  let NdotL     = max(dot(N, L), 0.0);\r
  let diffuseC  = u.diffuse * NdotL * u.lightColor;\r
  var specularC = vec3<f32>(0.0);\r
  if NdotL > 0.0 {\r
    let R = reflect(-L, N);\r
    specularC = u.specular * pow(max(dot(R, V), 0.0), u.shininess) * u.lightColor;\r
  }\r
  return (ambientC + diffuseC + specularC) * baseColor;\r
}\r
\r
fn wireframeEdgeFactor(bary: vec3<f32>) -> f32 {\r
  let d  = fwidth(bary);\r
  let a3 = smoothstep(vec3<f32>(0.0), d * 1.5, bary);\r
  return min(min(a3.x, a3.y), a3.z);\r
}\r
\r
@vertex\r
fn vs_main(input: VSIn) -> VSOut {\r
  var out: VSOut;\r
\r
  let worldPos4    = u.model    * vec4<f32>(input.position, 1.0);\r
  let worldNormal4 = u.normalMat * vec4<f32>(input.normal, 0.0);\r
\r
  out.clipPos     = u.mvp * vec4<f32>(input.position, 1.0);\r
  out.worldPos    = worldPos4.xyz;\r
  out.worldNormal = normalize(worldNormal4.xyz);\r
  out.uv          = input.uv;\r
  out.barycentric = input.barycentric;\r
  out.depth = out.clipPos.z / out.clipPos.w;\r
\r
  if u.model_id == 0u {\r
    out.gouraudColor = gouraudLighting(out.worldNormal, out.worldPos);\r
  } else {\r
    out.gouraudColor = vec3<f32>(0.0);\r
  }\r
\r
  return out;\r
}\r
\r
@fragment\r
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {\r
  var color: vec3<f32>;\r
\r
  let N = normalize(input.worldNormal);\r
\r
  var baseColor = u.objectColor;\r
  if u.use_texture == 1u {\r
    baseColor = textureSample(tex_img, tex_samp, input.uv).rgb;\r
  }\r
\r
  switch u.model_id {\r
    case 0u: {\r
      color = input.gouraudColor;\r
      if u.use_texture == 1u {\r
        color = color * textureSample(tex_img, tex_samp, input.uv).rgb;\r
      }\r
    }\r
    case 1u: {\r
      color = phongLighting(N, input.worldPos, baseColor);\r
    }\r
    case 2u: {\r
      color = N * 0.5 + vec3<f32>(0.5);\r
    }\r
    case 3u: {\r
      let edgeFactor = wireframeEdgeFactor(input.barycentric);\r
      let wireColor = vec3<f32>(0.0, 0.0, 0.0);   \r
      let fillColor = vec3<f32>(1.0, 1.0, 1.0);\r
      color = mix(wireColor, fillColor, edgeFactor);\r
    }\r
    case 4u: {\r
      let d = (input.depth + 1.0) * 0.5;\r
      color = vec3<f32>(d);\r
    }\r
    case 5u: {\r
      let tc = textureSample(tex_img, tex_samp, input.uv).rgb;\r
      color = phongLighting(N, input.worldPos, tc);\r
    }\r
    default: {\r
      color = vec3<f32>(input.uv, 0.0);\r
    }\r
  }\r
\r
  return vec4<f32>(color, 1.0);\r
}\r
`,be=`struct NormalUniforms {
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
`,A={add(e,t){return[e[0]+t[0],e[1]+t[1],e[2]+t[2]]},sub(e,t){return[e[0]-t[0],e[1]-t[1],e[2]-t[2]]},scale(e,t){return[e[0]*t,e[1]*t,e[2]*t]},dot(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]},cross(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]},normalize(e){const t=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/t,e[1]/t,e[2]/t]}},p={identity(){const e=new Float32Array(16);return e[0]=1,e[5]=1,e[10]=1,e[15]=1,e},multiply(e,t){const i=new Float32Array(16);for(let n=0;n<4;n++)for(let r=0;r<4;r++)i[n*4+r]=e[0+r]*t[n*4+0]+e[4+r]*t[n*4+1]+e[8+r]*t[n*4+2]+e[12+r]*t[n*4+3];return i},transpose(e){const t=new Float32Array(16);for(let i=0;i<4;i++)for(let n=0;n<4;n++)t[n*4+i]=e[i*4+n];return t},invert(e){const t=new Float32Array(16),i=e[0],n=e[1],r=e[2],o=e[3],a=e[4],s=e[5],c=e[6],u=e[7],x=e[8],C=e[9],P=e[10],M=e[11],f=e[12],w=e[13],T=e[14],v=e[15],d=i*s-n*a,l=i*c-r*a,m=i*u-o*a,b=n*c-r*s,y=n*u-o*s,L=r*u-o*c,N=x*w-C*f,U=x*T-P*f,z=x*v-M*f,R=C*T-P*w,$=C*v-M*w,V=P*v-M*T;let E=d*V-l*$+m*R+b*z-y*U+L*N;return E?(E=1/E,t[0]=(s*V-c*$+u*R)*E,t[1]=(c*z-a*V-u*U)*E,t[2]=(a*$-s*z+u*N)*E,t[3]=(s*U-a*R-c*N)*E,t[4]=(r*$-n*V-o*R)*E,t[5]=(i*V-r*z+o*U)*E,t[6]=(n*z-i*$-o*N)*E,t[7]=(i*R-n*U+r*N)*E,t[8]=(w*L-T*y+v*b)*E,t[9]=(T*m-f*L-v*l)*E,t[10]=(f*y-w*m+v*d)*E,t[11]=(w*l-f*b-T*d)*E,t[12]=(P*y-C*L-M*b)*E,t[13]=(x*L-P*m+M*l)*E,t[14]=(C*m-x*y-M*d)*E,t[15]=(x*b-C*l+P*d)*E,t):p.identity()},normalMatrix(e){return p.transpose(p.invert(e))},translation(e,t,i){const n=p.identity();return n[12]=e,n[13]=t,n[14]=i,n},scaling(e,t,i){const n=p.identity();return n[0]=e,n[5]=t,n[10]=i,n},rotationX(e){const t=Math.cos(e),i=Math.sin(e),n=p.identity();return n[5]=t,n[6]=i,n[9]=-i,n[10]=t,n},rotationY(e){const t=Math.cos(e),i=Math.sin(e),n=p.identity();return n[0]=t,n[2]=-i,n[8]=i,n[10]=t,n},rotationZ(e){const t=Math.cos(e),i=Math.sin(e),n=p.identity();return n[0]=t,n[1]=i,n[4]=-i,n[5]=t,n},perspective(e,t,i,n){const r=1/Math.tan(e/2),o=new Float32Array(16);return o[0]=r/t,o[5]=r,o[10]=n/(i-n),o[11]=-1,o[14]=n*i/(i-n),o},lookAt(e,t,i){const n=A.normalize(A.sub(e,t)),r=A.normalize(A.cross(i,n)),o=A.cross(n,r),a=new Float32Array(16);return a[0]=r[0],a[4]=r[1],a[8]=r[2],a[12]=-A.dot(r,e),a[1]=o[0],a[5]=o[1],a[9]=o[2],a[13]=-A.dot(o,e),a[2]=n[0],a[6]=n[1],a[10]=n[2],a[14]=-A.dot(n,e),a[3]=0,a[7]=0,a[11]=0,a[15]=1,a}},O={identity(){return[0,0,0,1]},multiply(e,t){const[i,n,r,o]=e,[a,s,c,u]=t;return[o*a+i*u+n*c-r*s,o*s-i*c+n*u+r*a,o*c+i*s-n*a+r*u,o*u-i*a-n*s-r*c]},normalize(e){const t=Math.hypot(e[0],e[1],e[2],e[3])||1;return[e[0]/t,e[1]/t,e[2]/t,e[3]/t]},toMat4(e){const[t,i,n,r]=e,o=new Float32Array(16);return o[0]=1-2*(i*i+n*n),o[4]=2*(t*i-n*r),o[8]=2*(t*n+i*r),o[12]=0,o[1]=2*(t*i+n*r),o[5]=1-2*(t*t+n*n),o[9]=2*(i*n-t*r),o[13]=0,o[2]=2*(t*n-i*r),o[6]=2*(i*n+t*r),o[10]=1-2*(t*t+i*i),o[14]=0,o[3]=0,o[7]=0,o[11]=0,o[15]=1,o}};function re(e,t){const i=e*e+t*t;if(i<=1)return[e,t,Math.sqrt(1-i)];const n=1/Math.sqrt(i);return[e*n,t*n,0]}function ye(e,t){const i=Math.min(1,e[0]*t[0]+e[1]*t[1]+e[2]*t[2]),n=Math.acos(i);if(n<1e-6)return O.identity();const r=[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]],o=Math.hypot(r[0],r[1],r[2]);if(o<1e-10)return O.identity();const a=n*.5,s=Math.sin(a)/o;return O.normalize([r[0]*s,r[1]*s,r[2]*s,Math.cos(a)])}const g={modelId:1,ambient:.12,diffuse:.75,specular:.6,shininess:32,lightX:3,lightY:4,lightZ:3,autoRotLight:!1,objectColor:"#4a9eff",lightColor:"#ffffff",translateX:0,translateY:0,translateZ:0,rotateX:0,rotateY:0,rotateZ:0,scaleX:1,scaleY:1,scaleZ:1,useTexture:!1};function oe(e){const t=parseInt(e.slice(1),16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}const J={0:"Gouraud: lighting computed per vertex in vs_main, interpolated across the face. Implement gouraudLighting() in shader.wgsl.",1:"Phong: smooth normals interpolated per pixel, full lighting in fs_main. Implement phongLighting() in shader.wgsl.",2:"Normals: RGB visualisation of world-space normals.",3:"Wireframe: edge-only rendering with hidden surface removal.",4:"Depth: fragment depth encoded as greyscale.",5:"Texture: spherical UV parameterisation with loaded texture.",6:"UV Coords: UV coordinates visualised as RG colour."};let G=[],j=-1;function Y(){const e=document.getElementById("scene-list");e&&(e.innerHTML=G.map((t,i)=>`<div class="scene-item ${t.id===j?"active":""}" data-id="${t.id}">
      <span class="scene-idx">${i+1}.</span> ${t.label}
    </div>`).join(""),e.querySelectorAll(".scene-item").forEach(t=>{t.addEventListener("click",()=>{j=Number(t.dataset.id),Y(),Z()})}))}function Z(){const e=document.getElementById("obj-type-title");if(!e)return;const t=G.find(i=>i.id===j);e.textContent=t?t.type.toUpperCase():""}let xe=1;function F(e){const t=xe++;G.push({id:t,type:e,label:e.charAt(0).toUpperCase()+e.slice(1)}),j=t,Y(),Z()}function we(){const e=G.findIndex(t=>t.id===j);G=G.filter(t=>t.id!==j),j=G.length>0?G[G.length-1].id:-1,Y(),Z(),window.__onObjectRemoved?.(e)}function B(e,t,i,n,r,o,a=!1){return`
   <div class="slider-row ${a?"compact":""}">
    <span class="slider-label">${t}</span>
    <input type="range" id="${e}" min="${i}" max="${n}" step="${r}" value="${o}">
    <span class="slider-val" id="${e}-val">${o}</span>
  </div>`}const Ee=[{id:0,label:"Gouraud"},{id:1,label:"Phong"},{id:2,label:"Normals"},{id:3,label:"Wireframe"},{id:4,label:"Depth"},{id:5,label:"Texture"},{id:6,label:"UV Coords"}];function _e(e){const t=document.createElement("div");t.id="left-panel",t.innerHTML=`
    <div class="panel-title">PIPELINE</div>
    
    <div class="panel-section">
      <div class="section-label">ADD OBJECT</div>
      <div class="btn-row">
        <button class="pill-btn" id="add-sphere">Sphere</button>
        <button class="pill-btn" id="add-cube">Cube</button>
      </div>
    </div>
    
    <div class="panel-section">
      <div class="section-label">ADD OBJ MODEL</div>
      <div class="file-row">
        <label class="file-btn" for="obj-file-input">Seleccionar archivo</label>
        <input type="file" id="obj-file-input" accept=".obj" style="display:none">
        <span class="file-name" id="obj-file-name">Sin archivos seleccionados</span>
      </div>
    </div>
    
    <div class="panel-section">
      <div class="section-label">RENDER MODE (GLOBAL)</div>
      <div class="model-btns" id="render-mode-btns">
        ${Ee.slice(0,6).map(n=>`<button class="model-btn ${n.id===g.modelId?"active":""}" data-id="${n.id}">${n.label}</button>`).join("")}
      </div>
      <div class="btn-row" style="margin-top:6px">
        <button class="model-btn wide ${g.modelId===6?"active":""}" data-id="6">UV Coords</button>
      </div>
      <div class="model-desc" id="model-desc">${J[g.modelId]}</div>
    </div>
    
    <div class="panel-section">
      <div class="section-label">GLOBAL LIGHT COLOR</div>
      <div class="color-row-left">
        <span>Light</span>
        <input type="color" id="lightColor" value="${g.lightColor}">
      </div>
    </div>
    
    <div class="panel-hint">No selection: drag orbits camera<br>Object selected: drag rotates object<br>Scroll: zoom toward target</div>
    `,document.body.appendChild(t);const i=document.createElement("div");i.id="right-panel",i.innerHTML=`
<div class="panel-title">SCENE</div>
<div class="scene-list" id="scene-list"></div>
<div class="scene-actions">
  <button class="scene-act-btn" id="btn-deselect">Deselect</button>
  <button class="scene-act-btn danger" id="btn-remove">Remove</button>
</div>
 
<div class="obj-sliders" id="obj-sliders">
  <div class="obj-section-title" id="obj-type-title"></div>
 
  <div class="slider-group-title">TRANSFORM</div>
  ${B("translateX","Translate X",-12,12,.01,0,!0)}
  ${B("translateY","Translate Y",-12,12,.01,0,!0)}
  ${B("translateZ","Translate Z",-12,12,.01,0,!0)}
  ${B("rotateX","Rotate X",-180,180,1,0,!0)}
  ${B("rotateY","Rotate Y",-180,180,1,0,!0)}
  ${B("rotateZ","Rotate Z",-180,180,1,0,!0)}
  ${B("scaleX","Scale X",.01,5,.01,1,!0)}
  ${B("scaleY","Scale Y",.01,5,.01,1,!0)}
  ${B("scaleZ","Scale Z",.01,5,.01,1,!0)}
 
  <div class="slider-group-title">MATERIAL</div>
  ${B("ambient","Ambient (Ka)",0,1,.01,g.ambient,!0)}
  ${B("diffuse","Diffuse (Kd)",0,1,.01,g.diffuse,!0)}
  ${B("specular","Specular (Ks)",0,1,.01,g.specular,!0)}
  ${B("shininess","Shininess (n)",1,256,1,g.shininess,!0)}
  <div class="slider-row compact">
    <span class="slider-label">Object color</span>
    <input type="color" id="objectColor" value="${g.objectColor}">
  </div>
 
  <div class="slider-group-title">TEXTURE (SPHERICAL UV)</div>
  <div class="file-row">
    <label class="file-btn" for="tex-file-input">Seleccionar archivo</label>
    <input type="file" id="tex-file-input" accept="image/*" style="display:none">
    <span class="file-name" id="tex-file-name">Sin archivos seleccionados</span>
  </div>
  <label class="checkbox-row">
    <input type="checkbox" id="useTexture"> Use texture
  </label>
</div>
`,document.body.appendChild(i),document.querySelectorAll("[data-id]").forEach(n=>{n.addEventListener("click",()=>{g.modelId=Number(n.dataset.id),document.querySelectorAll("[data-id]").forEach(o=>o.classList.remove("active")),document.querySelectorAll(`[data-id="${g.modelId}"]`).forEach(o=>o.classList.add("active"));const r=document.getElementById("model-desc");r&&(r.textContent=J[g.modelId])})}),document.getElementById("add-sphere")?.addEventListener("click",()=>{F("Sphere"),e("sphere")}),document.getElementById("add-cube")?.addEventListener("click",()=>{F("Cube"),e("cube")}),document.getElementById("btn-deselect")?.addEventListener("click",()=>{j=-1,Y(),Z()}),document.getElementById("btn-remove")?.addEventListener("click",we),document.getElementById("obj-file-input")?.addEventListener("change",n=>{const r=n.target.files?.[0],o=document.getElementById("obj-file-name");o&&(o.textContent=r?r.name:"Sin archivos seleccionados")}),document.getElementById("tex-file-input")?.addEventListener("change",n=>{const r=n.target.files?.[0],o=document.getElementById("tex-file-name");o&&(o.textContent=r?r.name:"Sin archivos seleccionados")}),["translateX","translateY","translateZ","rotateX","rotateY","rotateZ","scaleX","scaleY","scaleZ"].forEach(n=>{const r=document.getElementById(n),o=document.getElementById(`${n}-val`);!r||!o||r.addEventListener("input",()=>{const a=parseFloat(r.value);o.textContent=r.value,g[n]=a;const s=window.__getSelectedObject?.();if(!s?.transform)return;const u={translateX:"tx",translateY:"ty",translateZ:"tz",rotateX:"rx",rotateY:"ry",rotateZ:"rz",scaleX:"sx",scaleY:"sy",scaleZ:"sz"}[n];u&&(n.startsWith("rotate")?s.transform[u]=a*Math.PI/180:s.transform[u]=a)})}),["ambient","diffuse","specular","shininess"].forEach(n=>{const r=document.getElementById(n),o=document.getElementById(`${n}-val`);!r||!o||r.addEventListener("input",()=>{const a=parseFloat(r.value);o.textContent=r.value;const s=window.__getSelectedObject?.();s?.material?s.material[n]=a:g[n]=a})}),document.getElementById("objectColor").addEventListener("input",n=>{const r=n.target.value;g.objectColor=r;const o=window.__getSelectedObject?.();o?.material&&(o.material.color=r)}),document.getElementById("lightColor").addEventListener("input",n=>{g.lightColor=n.target.value}),document.getElementById("autoRotLight")?.addEventListener("change",n=>{g.autoRotLight=n.target.checked}),document.getElementById("useTexture").addEventListener("change",n=>{g.useTexture=n.target.checked}),F("Cube")}function Ce(){return G.findIndex(e=>e.id===j)}const D=[[1,0,0],[0,1,0],[0,0,1]];function Me(e){const t=[],i=[],n=[],r=[],o=(v,d)=>{const l=parseInt(v);return isNaN(l)?-1:l<0?d+l:l-1};for(const v of e.split(/\r?\n/)){const d=v.trim();if(!d||d[0]==="#")continue;const l=d.split(/\s+/);if(l[0]==="v"&&t.push([+l[1],+l[2],+l[3]]),l[0]==="vn"&&i.push([+l[1],+l[2],+l[3]]),l[0]==="vt"&&n.push([+l[1],+(l[2]??0)]),l[0]==="f"){const m=l.slice(1).map(b=>{const y=b.split("/"),L=o(y[0],t.length),N=y.length>1&&y[1]!==""?o(y[1],n.length):-1,U=y.length>2&&y[2]!==""?o(y[2],i.length):-1;return[t[L]??[0,0,0],U>=0?i[U]:[0,1,0],N>=0?n[N]:[0,0]]});for(let b=1;b+1<m.length;b++)r.push([m[0],m[b],m[b+1]])}}{const v=new Map;for(const d of r){const[l,,]=d[0],[m,,]=d[1],[b,,]=d[2],y=[m[0]-l[0],m[1]-l[1],m[2]-l[2]],L=[b[0]-l[0],b[1]-l[1],b[2]-l[2]],N=[y[1]*L[2]-y[2]*L[1],y[2]*L[0]-y[0]*L[2],y[0]*L[1]-y[1]*L[0]];for(const U of d){const z=U[0].join(),R=v.get(z)??[0,0,0];v.set(z,[R[0]+N[0],R[1]+N[1],R[2]+N[2]])}}for(const d of r)for(const l of d){const m=v.get(l[0].join()),b=Math.sqrt(m[0]**2+m[1]**2+m[2]**2)||1;l[1]=[m[0]/b,m[1]/b,m[2]/b]}}const a=[];for(const v of r)for(let d=0;d<3;d++){const[l,m]=v[d],b=Math.sqrt(l[0]**2+l[1]**2+l[2]**2)||1,y=.5+Math.atan2(l[2],l[0])/(2*Math.PI),L=.5-Math.asin(Math.max(-1,Math.min(1,l[1]/b)))/Math.PI;a.push(...l,...m,...D[d],y,L)}let s=1/0,c=1/0,u=1/0,x=-1/0,C=-1/0,P=-1/0;for(const[v,d,l]of t)v<s&&(s=v),v>x&&(x=v),d<c&&(c=d),d>C&&(C=d),l<u&&(u=l),l>P&&(P=l);const M=(s+x)/2,f=(c+C)/2,w=(u+P)/2;let T=0;for(const[v,d,l]of t){const m=Math.sqrt((v-M)**2+(d-f)**2+(l-w)**2);m>T&&(T=m)}return{verts:new Float32Array(a),count:a.length/11,cx:M,cy:f,cz:w,radius:T}}if(!navigator.gpu)throw new Error("WebGPU not supported");const _=document.querySelector("#gfx-main");if(!_)throw new Error("Canvas #gfx-main not found");const ie=await navigator.gpu.requestAdapter();if(!ie)throw new Error("No GPU adapter found");const h=await ie.requestDevice(),ae=_.getContext("webgpu"),se=navigator.gpu.getPreferredCanvasFormat();let X=null,q=null;function le(){_.width=Math.max(1,Math.floor(window.innerWidth*devicePixelRatio)),_.height=Math.max(1,Math.floor(window.innerHeight*devicePixelRatio)),ae.configure({device:h,format:se,alphaMode:"premultiplied"}),X?.destroy(),X=h.createTexture({size:[_.width,_.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}),q?.destroy(),q=h.createTexture({size:[_.width,_.height],format:"rgba16float",usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING})}le();window.addEventListener("resize",le);function ce(){const e=[{n:[0,0,1],verts:[[-1,-1,1,0,1],[1,-1,1,1,1],[1,1,1,1,0],[-1,-1,1,0,1],[1,1,1,1,0],[-1,1,1,0,0]]},{n:[0,0,-1],verts:[[1,-1,-1,0,1],[-1,-1,-1,1,1],[-1,1,-1,1,0],[1,-1,-1,0,1],[-1,1,-1,1,0],[1,1,-1,0,0]]},{n:[-1,0,0],verts:[[-1,-1,-1,0,1],[-1,-1,1,1,1],[-1,1,1,1,0],[-1,-1,-1,0,1],[-1,1,1,1,0],[-1,1,-1,0,0]]},{n:[1,0,0],verts:[[1,-1,1,0,1],[1,-1,-1,1,1],[1,1,-1,1,0],[1,-1,1,0,1],[1,1,-1,1,0],[1,1,1,0,0]]},{n:[0,1,0],verts:[[-1,1,1,0,1],[1,1,1,1,1],[1,1,-1,1,0],[-1,1,1,0,1],[1,1,-1,1,0],[-1,1,-1,0,0]]},{n:[0,-1,0],verts:[[-1,-1,-1,0,1],[1,-1,-1,1,1],[1,-1,1,1,0],[-1,-1,-1,0,1],[1,-1,1,1,0],[-1,-1,1,0,0]]}],t=[];for(const r of e)for(const o of r.verts)t.push(o[0],o[1],o[2]),t.push(...r.n),t.push(o[3],o[4]);const i=new Float32Array(t),n=new Uint32Array(i.length/8).map((r,o)=>o);return{vd:i,id:n}}function Le(e,t){const i=[],n=[];for(let r=0;r<=e;r++){const o=r/e*Math.PI;for(let a=0;a<=t;a++){const s=a/t*2*Math.PI,c=Math.sin(o)*Math.cos(s),u=Math.cos(o),x=Math.sin(o)*Math.sin(s);i.push(c,u,x,c,u,x,a/t,r/e)}}for(let r=0;r<e;r++)for(let o=0;o<t;o++){const a=r*(t+1)+o,s=a+1,c=a+(t+1),u=c+1;n.push(a,c,s,s,c,u)}return{vd:new Float32Array(i),id:new Uint32Array(n)}}const Q=304,ee=192,ue=h.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),de=h.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}}]}),Pe=h.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"repeat",addressModeV:"repeat"}),te=h.createShaderModule({label:"Lighting Shader",code:ve}),ne=h.createShaderModule({label:"Normal Shader",code:be}),fe={arrayStride:44,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32x3"},{shaderLocation:3,offset:36,format:"float32x2"}]},Se=h.createRenderPipeline({label:"Lighting Pipeline",layout:h.createPipelineLayout({bindGroupLayouts:[de]}),vertex:{module:te,entryPoint:"vs_main",buffers:[fe]},fragment:{module:te,entryPoint:"fs_main",targets:[{format:se}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),Be=h.createRenderPipeline({label:"Normal Pipeline",layout:h.createPipelineLayout({bindGroupLayouts:[ue]}),vertex:{module:ne,entryPoint:"vs_normals",buffers:[fe]},fragment:{module:ne,entryPoint:"fs_normals",targets:[{format:"rgba16float"}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),S={azimuth:0,elevation:.3,distance:5,target:[0,0,0],getEyeOffset(){const e=Math.cos(this.elevation),t=Math.sin(this.elevation),i=Math.cos(this.azimuth),n=Math.sin(this.azimuth);return[this.distance*e*n,this.distance*t,this.distance*e*i]},getPosition(){const e=this.getEyeOffset();return[this.target[0]+e[0],this.target[1]+e[1],this.target[2]+e[2]]},getViewMatrix(){const e=this.getPosition();return p.lookAt(e,this.target,[0,1,0])}};function Ie(){const e=h.createTexture({size:[1,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return h.queue.writeTexture({texture:e},new Uint8Array([255,255,255,255]),{bytesPerRow:4},[1,1]),e}class k{vertexBuffer;drawCount;center;uniformBuf;normalUniformBuf;bindGroup;normalBindGroup;transform={tx:0,ty:0,tz:0,rx:0,ry:0,rz:0,sx:1,sy:1,sz:1};material={ambient:.12,diffuse:.75,specular:.6,shininess:32,color:"#4a9eff"};boundingRadius=1;texture;useTexture=0;_uab=new ArrayBuffer(Q);_uf32=new Float32Array(this._uab);_uu32=new Uint32Array(this._uab);_nab=new ArrayBuffer(ee);_nf32=new Float32Array(this._nab);constructor(t,i,n=[0,0,0],r=1){this.drawCount=i,this.center=n,this.boundingRadius=r,this.vertexBuffer=h.createBuffer({size:t.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),h.queue.writeBuffer(this.vertexBuffer,0,t.buffer.slice(0),t.byteOffset,t.byteLength),this.uniformBuf=h.createBuffer({size:Q,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.normalUniformBuf=h.createBuffer({size:ee,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.texture=Ie(),this.bindGroup=this.createBindGroup(),this.normalBindGroup=this.createNormalBindGroup()}arcballBase=O.identity();arcballDrag=O.identity();arcballDragStart=null;getArcballMatrix(){const t=O.normalize(O.multiply(this.arcballDrag,this.arcballBase));return O.toMat4(t)}worldCenter(){return[this.transform.tx,this.transform.ty,this.transform.tz]}buildModel(){const[t,i,n]=this.center,r=p.translation(-t,-i,-n),o=p.multiply(p.rotationZ(this.transform.rz),p.multiply(p.rotationY(this.transform.ry),p.rotationX(this.transform.rx))),a=this.getArcballMatrix(),s=p.multiply(a,o),c=p.scaling(this.transform.sx,this.transform.sy,this.transform.sz),u=p.translation(this.transform.tx,this.transform.ty,this.transform.tz);return p.multiply(u,p.multiply(s,p.multiply(c,r)))}uploadUniforms(t,i,n,r,o,a,s,c,u,x){const C=this.buildModel(),P=p.normalMatrix(C),M=p.multiply(p.multiply(t,i),C);this._uf32.set(M,0),this._uf32.set(C,16),this._uf32.set(P,32),this._uf32[48]=r,this._uf32[49]=o,this._uf32[50]=a,this._uf32[51]=0,this._uf32[52]=s,this._uf32[53]=c,this._uf32[54]=u,this._uf32[55]=0,this._uf32[56]=this.material.ambient,this._uf32[57]=this.material.diffuse,this._uf32[58]=this.material.specular,this._uf32[59]=this.material.shininess,this._uf32[60]=x[0],this._uf32[61]=x[1],this._uf32[62]=x[2];const[f,w,T]=oe(this.material.color);this._uu32[63]=g.modelId,this._uf32[64]=f,this._uf32[65]=w,this._uf32[66]=T,this._uf32[67]=n,this._uu32[68]=this.useTexture,h.queue.writeBuffer(this.uniformBuf,0,this._uab),this._nf32.set(M,0),this._nf32.set(C,16),this._nf32.set(P,32),h.queue.writeBuffer(this.normalUniformBuf,0,this._nab)}createBindGroup(){return h.createBindGroup({layout:de,entries:[{binding:0,resource:{buffer:this.uniformBuf}},{binding:1,resource:Pe},{binding:2,resource:this.texture.createView()}]})}createNormalBindGroup(){return h.createBindGroup({layout:ue,entries:[{binding:0,resource:{buffer:this.normalUniformBuf}}]})}rebuildBindGroups(){this.bindGroup=this.createBindGroup()}setTexture(t){this.texture.destroy(),this.texture=t,this.useTexture=1,this.bindGroup=this.createBindGroup()}destroy(){this.vertexBuffer.destroy(),this.uniformBuf.destroy(),this.normalUniformBuf.destroy()}}const I=[];window.__getSelectedObject=()=>I[Ce()]??null;_e(e=>{const{vd:t,id:i}=e==="cube"?ce():Le(64,64),{verts:n,count:r}=ge(t,i),o=new k(n,r,[0,0,0],1);o.transform.tx=(I.length%2===0?1:-1)*Math.ceil(I.length/2)*2.5,I.push(o)});function me(e,t){const i=_.getBoundingClientRect();return[(e-i.left)/i.width*2-1,-((t-i.top)/i.height)*2+1]}let K=!1,W=0,H=0;_.addEventListener("mousedown",e=>{if(e.button!==0)return;const t=window.__getSelectedObject();if(t){const[i,n]=me(e.clientX,e.clientY);t.arcballDragStart=re(i,n),t.arcballDrag=O.identity()}else K=!0,W=e.clientX,H=e.clientY});_.addEventListener("mousemove",e=>{const t=window.__getSelectedObject();if(t?.arcballDragStart){const[i,n]=me(e.clientX,e.clientY);t.arcballDrag=ye(t.arcballDragStart,re(i,n))}else if(K){const i=(e.clientX-W)/_.clientWidth,n=(e.clientY-H)/_.clientHeight;S.azimuth+=i*Math.PI*2,S.elevation=Math.max(-Math.PI/2+.01,Math.min(Math.PI/2-.01,S.elevation+n*Math.PI)),W=e.clientX,H=e.clientY}});const he=()=>{const e=window.__getSelectedObject();e?.arcballDragStart&&(e.arcballBase=O.normalize(O.multiply(e.arcballDrag,e.arcballBase)),e.arcballDrag=O.identity(),e.arcballDragStart=null),K=!1};_.addEventListener("mouseup",he);_.addEventListener("mouseleave",he);_.addEventListener("wheel",e=>{e.preventDefault(),S.distance*=1+e.deltaY*.001,S.distance=Math.max(.5,S.distance)},{passive:!1});window.addEventListener("resize",()=>{for(const e of I)e.rebuildBindGroups()});{const{vd:e,id:t}=ce(),{verts:i,count:n}=ge(e,t),r=new k(i,n,[0,0,0],1);I.push(r)}window.__onObjectRemoved=e=>{e>=0&&e<I.length&&(I[e].destroy(),I.splice(e,1))};document.getElementById("obj-file-input")?.addEventListener("change",async e=>{const t=e.target.files?.[0];if(!t)return;const{verts:i,count:n,cx:r,cy:o,cz:a,radius:s}=Me(await t.text());F(t.name.replace(".obj",""));const c=new k(i,n,[r,o,a],s);c.transform.tx=0,c.transform.ty=0,c.transform.tz=0,I.push(c),S.target=[r,o,a],S.distance=s*2.5,S.elevation=.3,S.azimuth=0,console.log(`${t.name}: ${n/3} tris, centre=[${r.toFixed(1)},${o.toFixed(1)},${a.toFixed(1)}], r=${s.toFixed(1)}`),e.target.value=""});document.getElementById("tex-file-input")?.addEventListener("change",async e=>{const t=e.target.files?.[0];if(!t)return;const i=await createImageBitmap(t,{colorSpaceConversion:"none"}),n=h.createTexture({size:[i.width,i.height],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});h.queue.copyExternalImageToTexture({source:i},{texture:n},[i.width,i.height]),window.__getSelectedObject()?.setTexture(n)});document.getElementById("useTexture")?.addEventListener("change",e=>{const t=window.__getSelectedObject();t&&(t.useTexture=e.target.checked?1:0)});performance.now();const Te=performance.now();function pe(e){const t=(e-Te)/1e3,i=_.width/_.height,n=p.perspective(60*Math.PI/180,i,.1,1e3),r=window.__getSelectedObject();S.target=r?r.worldCenter():[0,0,0];const o=S.getViewMatrix(),a=S.getPosition();let s=g.lightX,c=g.lightY,u=g.lightZ;if(g.autoRotLight)s=Math.cos(t*.8)*4.5,u=Math.sin(t*.8)*4.5;else{const f=S.getPosition();s=f[0],c=f[1]+4,u=f[2]}const[x,C,P]=oe(g.lightColor);for(const f of I)f.uploadUniforms(n,o,t,s,c,u,x,C,P,a);const M=h.createCommandEncoder();{const f=M.beginRenderPass({colorAttachments:[{view:q.createView(),clearValue:{r:0,g:0,b:0,a:0},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:X.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});f.setPipeline(Be);for(const w of I)f.setBindGroup(0,w.normalBindGroup),f.setVertexBuffer(0,w.vertexBuffer),f.draw(w.drawCount);f.end()}{const f=M.beginRenderPass({colorAttachments:[{view:ae.getCurrentTexture().createView(),clearValue:{r:.08,g:.08,b:.12,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:X.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});f.setPipeline(Se);for(const w of I)f.setBindGroup(0,w.bindGroup),f.setVertexBuffer(0,w.vertexBuffer),f.draw(w.drawCount);f.end()}h.queue.submit([M.finish()]),requestAnimationFrame(pe)}function ge(e,t){const i=t.length/3,n=new Float32Array(i*3*11);for(let r=0;r<i;r++){for(let a=0;a<3;a++){const s=t[r*3+a],c=(r*3+a)*11;n[c+0]=e[s*8+0],n[c+1]=e[s*8+1],n[c+2]=e[s*8+2],n[c+3]=e[s*8+3],n[c+4]=e[s*8+4],n[c+5]=e[s*8+5],n[c+6]=D[a][0],n[c+7]=D[a][1],n[c+8]=D[a][2],n[c+9]=e[s*8+6],n[c+10]=e[s*8+7]}const o=n[(r*3+0)*11+9];for(let a=1;a<3;a++){const s=(r*3+a)*11+9;o-n[s]>.5&&(n[s]+=1),n[s]-o>.5&&(n[s]-=1)}}return{verts:n,count:n.length/11}}requestAnimationFrame(pe);
