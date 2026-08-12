"use client";

import React, { useEffect, useRef } from 'react';

/**
 * JobSignal login screen.
 * Animated WebGL dot-matrix background + the login card from the design
 * mockup (mockup/jobsignal-mockup.html): internal email+password access only.
 */

/* palette from the mockup design system */
const WINE = "#510B1D";
const WINE_MID = "#973350";
const INK = "#1d1117";
const INK_SOFT = "#5b4f55";
const INK_FAINT = "#8a7f85";
const LINE = "#ece3e6";

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;
    let renderer: any;
    let geometry: any;
    let material: any;
    let scene: any;
    let camera: any;
    let animationId: number;
    let removeResize: (() => void) | undefined;

    const initThree = (THREE: any) => {
      if (!canvasRef.current || !active) return;
      const canvas = canvasRef.current;
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2) },
        u_opacities: { value: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0] },
        u_colors: { value: [
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1)
        ] },
        u_total_size: { value: 20.0 },
        u_dot_size: { value: 6.0 },
        u_reverse: { value: 0 }
      };

      material = new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main() {
            gl_Position = vec4(position, 1.0);
            fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: `
          precision mediump float;
          in vec2 fragCoord;

          uniform float u_time;
          uniform float u_opacities[10];
          uniform vec3 u_colors[6];
          uniform float u_total_size;
          uniform float u_dot_size;
          uniform vec2 u_resolution;
          uniform int u_reverse;

          out vec4 fragColor;

          float PHI = 1.61803398874989484820459;
          float random(vec2 xy) {
              return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
          }

          void main() {
              vec2 st = fragCoord.xy;
              st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
              st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

              float opacity = step(0.0, st.x) * step(0.0, st.y);

              vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

              float frequency = 5.0;
              float show_offset = random(st2);
              float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
              opacity *= u_opacities[int(rand * 10.0)];
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

              vec3 color = u_colors[int(show_offset * 6.0)];

              float animation_speed_factor = 3.0;
              vec2 center_grid = u_resolution / 2.0 / u_total_size;
              float dist_from_center = distance(center_grid, st2);

              float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

              float current_timing_offset = timing_offset_intro;
              opacity *= step(current_timing_offset, u_time * animation_speed_factor);
              opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

              fragColor = vec4(color, opacity);
              fragColor.rgb *= fragColor.a;
          }
        `,
        uniforms: uniforms,
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
        transparent: true
      });

      geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const startTime = performance.now();
      const animate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(animate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth * 2, window.innerHeight * 2);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    // Lazy-load Three.js on the client (component is SSR'd by Next.js)
    import('three').then((THREE) => {
      if (active) removeResize = initThree(THREE);
    });

    return () => {
      active = false;
      if (removeResize) removeResize();
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, []);

  const input: React.CSSProperties = {
    width:"100%", padding:"0.65rem 0.85rem", borderRadius:8,
    border:`1px solid ${LINE}`, background:"#fff", color:INK,
    fontSize:"0.875rem", outline:"none",
  };
  const label: React.CSSProperties = {
    display:"block", fontSize:"0.8rem", fontWeight:700, color:INK_SOFT,
    marginBottom:"0.35rem", textAlign:"left",
  };

  /* signal-radar logo mark from the mockup */
  const Logo = (
    <div style={{background:WINE,width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"0.75rem"}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="14" r="2.2" fill="#fff" stroke="none"/>
        <path d="M7.5 9.5a6.4 6.4 0 0 1 9 0"/>
        <path d="M4.8 6.8a10.2 10.2 0 0 1 14.4 0"/>
      </svg>
    </div>
  );

  return (
    <div style={{position:"relative",width:"100%",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"linear-gradient(135deg,#490A19 0%,#5a1228 50%,#490A19 100%)",color:INK,fontFamily:"'Inter',-apple-system,sans-serif"}}>

      {/* WebGL dot canvas */}
      <canvas ref={canvasRef} style={{position:"absolute",inset:0,zIndex:0,opacity:0.3}}/>

      {/* Vignette */}
      <div style={{position:"absolute",inset:0,zIndex:1,background:"radial-gradient(circle at center,rgba(61,8,21,0.55) 0%,rgba(61,8,21,0) 100%)",pointerEvents:"none"}}/>

      {/* Login card */}
      <div style={{position:"relative",zIndex:2,background:"#fff",borderRadius:16,padding:"2.5rem",width:"100%",maxWidth:420,boxShadow:"0 10px 40px rgba(61,8,21,0.5)",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
        {Logo}
        <h1 style={{fontSize:"1.5rem",fontWeight:800,letterSpacing:"-0.025em",marginBottom:"0.15rem",color:WINE}}>Job<span style={{color:WINE_MID}}>Signal</span></h1>
        <p style={{fontSize:"0.85rem",color:INK_SOFT,marginBottom:"1.5rem",lineHeight:1.5}}>Accesso riservato al team TimeVision.</p>

        <form onSubmit={e=>e.preventDefault()} style={{width:"100%",display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div>
            <label style={label} htmlFor="login-email">Email aziendale</label>
            <input style={input} id="login-email" type="email" placeholder="nome.cognome@timevision.it" autoComplete="username" required/>
          </div>
          <div>
            <label style={label} htmlFor="login-password">Password</label>
            <input style={input} id="login-password" type="password" placeholder="••••••••" autoComplete="current-password" required/>
          </div>
          <button type="submit" style={{width:"100%",padding:"0.7rem",borderRadius:8,border:"none",background:WINE,color:"#fff",fontWeight:600,fontSize:"0.9rem",cursor:"pointer"}}>Accedi</button>
        </form>

        <div style={{marginTop:"1.25rem",fontSize:"0.78rem",color:INK_FAINT,lineHeight:1.5}}>
          Problemi di accesso? Scrivi a{" "}
          <a href="mailto:innovazione@timevision.it" style={{color:INK_SOFT}}>innovazione@timevision.it</a>
        </div>
      </div>
    </div>
  );
}
