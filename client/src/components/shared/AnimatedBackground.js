import React, { useRef, useEffect, useCallback } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const mkStar = useCallback((w, h) => ({
    x: Math.random() * w * 1.4 - w * 0.2,
    y: Math.random() * h * 1.4 - h * 0.2,
    r: Math.random() * 1.8 + 0.3,
    bo: Math.random() * 0.7 + 0.3,
    ts: Math.random() * 0.03 + 0.005,
    to: Math.random() * Math.PI * 2,
    hu: Math.random() > 0.7 ? (Math.random() > 0.5 ? 220 : 40) : 0,
    sa: Math.random() > 0.7 ? Math.random() * 40 + 20 : 0,
  }), []);

  const mkNeb = useCallback((w, h) => ({
    x: Math.random() * w, y: Math.random() * h,
    r: Math.random() * 300 + 150,
    hu: [260, 280, 220, 310, 200][Math.floor(Math.random() * 5)],
    sa: Math.random() * 30 + 40, li: Math.random() * 15 + 8,
    op: Math.random() * 0.06 + 0.02,
    dx: (Math.random() - 0.5) * 0.08, dy: (Math.random() - 0.5) * 0.06,
    ph: Math.random() * Math.PI * 2,
  }), []);

  const mkDust = useCallback((w, h) => ({
    x: Math.random() * w, y: Math.random() * h,
    r: Math.random() * 1.5 + 0.3,
    dx: (Math.random() - 0.5) * 0.12, dy: (Math.random() - 0.5) * 0.1,
    op: Math.random() * 0.4 + 0.1, od: Math.random() > 0.5 ? 1 : -1,
    hu: Math.random() > 0.6 ? 45 : 220, sa: Math.random() * 30 + 30,
  }), []);

  const mkPlanets = useCallback((w, h) => {
    const cx = w * 0.38, cy = h * 0.42, s = Math.min(w, h) / 900;
    return [
      { oA:80*s, oB:35*s, sz:4*s, c:'#a0a0a0', sp:0.012, off:0, g:'#888888', rings:false, moon:false },
      { oA:120*s, oB:52*s, sz:7*s, c:'#e8c06a', sp:0.008, off:1.2, g:'#d4a030', rings:false, moon:false },
      { oA:170*s, oB:74*s, sz:8*s, c:'#4a9eda', sp:0.006, off:2.8, g:'#3a8ec8', rings:false, moon:true },
      { oA:220*s, oB:96*s, sz:6*s, c:'#c8553a', sp:0.0045, off:4.1, g:'#b84530', rings:false, moon:false },
      { oA:310*s, oB:135*s, sz:18*s, c:'#d4a46a', sp:0.0025, off:0.7, g:'#c89050', rings:false, moon:false },
      { oA:400*s, oB:174*s, sz:15*s, c:'#e8cc82', sp:0.0018, off:3.5, g:'#d4b860', rings:true, moon:false },
      { oA:490*s, oB:213*s, sz:10*s, c:'#4466cc', sp:0.001, off:5.2, g:'#3355bb', rings:false, moon:false },
    ].map(p => ({ ...p, cx, cy }));
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, dpr, stars=[], nebs=[], dust=[], planets=[], t=0;

    const onMouse = e => { mouseRef.current.x = e.clientX / W; mouseRef.current.y = e.clientY / H; };
    window.addEventListener('mousemove', onMouse, { passive: true });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.max(120, Math.min(Math.floor(W*H/5000), 280)) }, () => mkStar(W, H));
      nebs = Array.from({ length: 5 }, () => mkNeb(W, H));
      dust = Array.from({ length: Math.max(20, Math.min(Math.floor(W*H/25000), 60)) }, () => mkDust(W, H));
      planets = mkPlanets(W, H);
    };
    resize();
    window.addEventListener('resize', resize);

    function h2r(hex) {
      return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) };
    }
    function lc(hex, p) { const {r,g,b}=h2r(hex); const f=p/100; return `rgb(${Math.min(255,r+(255-r)*f)},${Math.min(255,g+(255-g)*f)},${Math.min(255,b+(255-b)*f)})`; }
    function dc(hex, p) { const {r,g,b}=h2r(hex); const f=1-p/100; return `rgb(${r*f|0},${g*f|0},${b*f|0})`; }

    const render = () => {
      t += 0.4;
      ctx.clearRect(0, 0, W, H);

      // Deep space background
      const sh = Math.sin(t*0.003)*5;
      const bg = ctx.createRadialGradient(W*0.38, H*0.42, 0, W*0.5, H*0.5, Math.max(W,H)*0.85);
      bg.addColorStop(0, `hsl(${35+sh},40%,4%)`);
      bg.addColorStop(0.15, `hsl(${240+sh},45%,4%)`);
      bg.addColorStop(0.4, `hsl(${250+sh},50%,3%)`);
      bg.addColorStop(0.7, `hsl(${270+sh},40%,2.5%)`);
      bg.addColorStop(1, '#030308');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Stars
      const mx = (mouseRef.current.x-0.5)*8, my = (mouseRef.current.y-0.5)*8;
      const ga = t * 0.0001;
      const cosA = Math.cos(ga), sinA = Math.sin(ga);
      stars.forEach(s => {
        const tw = Math.sin(t*s.ts+s.to);
        const a = s.bo * (0.6 + tw*0.4);
        if (a <= 0.02) return;
        const dx = s.x-W*0.5, dy = s.y-H*0.5;
        const rx = dx*cosA - dy*sinA + W*0.5 + mx;
        const ry = dx*sinA + dy*cosA + H*0.5 + my;
        ctx.save(); ctx.globalAlpha = a;
        if (s.r > 1.2) {
          const gl = ctx.createRadialGradient(rx,ry,0,rx,ry,s.r*4);
          gl.addColorStop(0, s.hu ? `hsla(${s.hu},${s.sa}%,80%,0.3)` : 'rgba(255,255,255,0.3)');
          gl.addColorStop(1, 'transparent');
          ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(rx,ry,s.r*4,0,Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = s.hu ? `hsla(${s.hu},${s.sa}%,92%,${a})` : `rgba(255,255,255,${a})`;
        ctx.beginPath(); ctx.arc(rx,ry,s.r,0,Math.PI*2); ctx.fill();
        if (s.r > 1.5 && a > 0.6) {
          ctx.globalAlpha = a*0.3; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.5;
          const l = s.r*6;
          ctx.beginPath(); ctx.moveTo(rx-l,ry); ctx.lineTo(rx+l,ry);
          ctx.moveTo(rx,ry-l); ctx.lineTo(rx,ry+l); ctx.stroke();
        }
        ctx.restore();
      });

      // Nebulae
      const nmx = (mouseRef.current.x-0.5)*15, nmy = (mouseRef.current.y-0.5)*15;
      nebs.forEach(n => {
        n.x += n.dx + Math.sin(t*0.002+n.ph)*0.04;
        n.y += n.dy + Math.cos(t*0.0015+n.ph)*0.03;
        if (n.x < -n.r) n.x = W+n.r; if (n.x > W+n.r) n.x = -n.r;
        if (n.y < -n.r) n.y = H+n.r; if (n.y > H+n.r) n.y = -n.r;
        const pr = n.r + Math.sin(t*0.004+n.ph)*30;
        const nx = n.x+nmx, ny = n.y+nmy;
        ctx.save();
        ctx.globalAlpha = n.op + Math.sin(t*0.005+n.ph)*0.01;
        const gr = ctx.createRadialGradient(nx,ny,0,nx,ny,pr);
        gr.addColorStop(0, `hsla(${n.hu},${n.sa}%,${n.li}%,0.5)`);
        gr.addColorStop(0.4, `hsla(${n.hu},${n.sa}%,${n.li}%,0.2)`);
        gr.addColorStop(1, 'transparent');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(nx,ny,pr,0,Math.PI*2); ctx.fill();
        ctx.restore();
      });

      // Sun
      const sx = W*0.38+(mouseRef.current.x-0.5)*20;
      const sy = H*0.42+(mouseRef.current.y-0.5)*20;
      const sc = Math.min(W,H)/900;
      const sr = 32*sc + Math.sin(t*0.008)*3*sc;

      ctx.save(); ctx.globalAlpha = 0.12+Math.sin(t*0.006)*0.03;
      let cg = ctx.createRadialGradient(sx,sy,0,sx,sy,sr*8);
      cg.addColorStop(0,'rgba(255,200,50,0.15)'); cg.addColorStop(0.3,'rgba(255,150,30,0.06)');
      cg.addColorStop(0.6,'rgba(255,100,20,0.02)'); cg.addColorStop(1,'transparent');
      ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(sx,sy,sr*8,0,Math.PI*2); ctx.fill(); ctx.restore();

      ctx.save(); ctx.globalAlpha = 0.25+Math.sin(t*0.01)*0.05;
      cg = ctx.createRadialGradient(sx,sy,0,sx,sy,sr*4.5);
      cg.addColorStop(0,'rgba(255,220,80,0.3)'); cg.addColorStop(0.4,'rgba(255,170,40,0.1)');
      cg.addColorStop(1,'transparent');
      ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(sx,sy,sr*4.5,0,Math.PI*2); ctx.fill(); ctx.restore();

      ctx.save(); ctx.globalAlpha = 0.6;
      cg = ctx.createRadialGradient(sx,sy,sr*0.2,sx,sy,sr*2.2);
      cg.addColorStop(0,'rgba(255,240,180,0.8)'); cg.addColorStop(0.5,'rgba(255,200,60,0.3)');
      cg.addColorStop(1,'transparent');
      ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(sx,sy,sr*2.2,0,Math.PI*2); ctx.fill(); ctx.restore();

      ctx.save();
      const sg = ctx.createRadialGradient(sx-sr*0.2,sy-sr*0.2,0,sx,sy,sr);
      sg.addColorStop(0,'#fffbe6'); sg.addColorStop(0.3,'#ffe066');
      sg.addColorStop(0.7,'#ffaa00'); sg.addColorStop(1,'#ff7700');
      ctx.fillStyle=sg; ctx.shadowColor='rgba(255,200,50,0.8)'; ctx.shadowBlur=40*sc;
      ctx.beginPath(); ctx.arc(sx,sy,sr,0,Math.PI*2); ctx.fill(); ctx.restore();

      // Orbit paths
      const pmx = (mouseRef.current.x-0.5)*20, pmy = (mouseRef.current.y-0.5)*20;
      planets.forEach(p => {
        ctx.save(); ctx.globalAlpha=0.06; ctx.strokeStyle='rgba(255,255,255,0.5)';
        ctx.lineWidth=0.5; ctx.setLineDash([4,8]);
        ctx.beginPath(); ctx.ellipse(p.cx+pmx,p.cy+pmy,p.oA,p.oB,0,0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      });

      // Planets
      planets.forEach(p => {
        const ang = t*p.sp+p.off;
        const px = p.cx+Math.cos(ang)*p.oA+pmx;
        const py = p.cy+Math.sin(ang)*p.oB+pmy;

        ctx.save(); ctx.globalAlpha=0.3;
        let gl = ctx.createRadialGradient(px,py,0,px,py,p.sz*3.5);
        const {r:gr,g:gg,b:gb}=h2r(p.g); gl.addColorStop(0, `rgba(${gr},${gg},${gb},0.38)`); gl.addColorStop(1,'transparent');
        ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(px,py,p.sz*3.5,0,Math.PI*2); ctx.fill(); ctx.restore();

        if (p.rings) {
          ctx.save(); ctx.globalAlpha=0.35; ctx.translate(px,py); ctx.rotate(-0.3); ctx.scale(1,0.35);
          ctx.strokeStyle='rgba(210,180,120,0.5)'; ctx.lineWidth=3;
          ctx.beginPath(); ctx.arc(0,0,p.sz*2.6,0,Math.PI*2); ctx.stroke();
          ctx.strokeStyle='rgba(230,200,140,0.4)'; ctx.lineWidth=5;
          ctx.beginPath(); ctx.arc(0,0,p.sz*2.1,0,Math.PI*2); ctx.stroke();
          ctx.strokeStyle='rgba(200,170,100,0.3)'; ctx.lineWidth=2;
          ctx.beginPath(); ctx.arc(0,0,p.sz*1.7,0,Math.PI*2); ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        const pg = ctx.createRadialGradient(px-p.sz*0.3,py-p.sz*0.3,0,px,py,p.sz);
        pg.addColorStop(0, lc(p.c,30)); pg.addColorStop(0.6, p.c); pg.addColorStop(1, dc(p.c,40));
        ctx.fillStyle=pg; ctx.shadowColor=p.g; ctx.shadowBlur=12;
        ctx.beginPath(); ctx.arc(px,py,p.sz,0,Math.PI*2); ctx.fill(); ctx.restore();

        if (p.moon) {
          const ma = t*0.025+p.off;
          const mox = px+Math.cos(ma)*p.sz*2.8;
          const moy = py+Math.sin(ma)*p.sz*2.8*0.6;
          ctx.save(); ctx.fillStyle='#c8c8c8'; ctx.shadowColor='rgba(200,200,200,0.4)'; ctx.shadowBlur=4;
          ctx.beginPath(); ctx.arc(mox,moy,p.sz*0.25,0,Math.PI*2); ctx.fill(); ctx.restore();
        }
      });

      // Cosmic dust
      dust.forEach(p => {
        p.x += p.dx+Math.sin(t*0.004+p.y*0.005)*0.05;
        p.y += p.dy+Math.cos(t*0.003+p.x*0.005)*0.04;
        p.op += p.od*0.002; if(p.op>0.5) p.od=-1; if(p.op<0.08) p.od=1;
        if(p.x<-10) p.x=W+10; if(p.x>W+10) p.x=-10;
        if(p.y<-10) p.y=H+10; if(p.y>H+10) p.y=-10;
        ctx.save(); ctx.globalAlpha=p.op*0.7;
        const gl=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);
        gl.addColorStop(0,`hsla(${p.hu},${p.sa}%,75%,0.5)`); gl.addColorStop(1,'transparent');
        ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=p.op;
        ctx.fillStyle=`hsla(${p.hu},${p.sa}%,90%,0.9)`;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.restore();
      });

      // Vignette overlay
      ctx.save();
      const vig=ctx.createRadialGradient(W/2,H/2,W*0.15,W/2,H/2,W*0.8);
      vig.addColorStop(0,'rgba(5,5,16,0)'); vig.addColorStop(0.7,'rgba(5,5,16,0.15)');
      vig.addColorStop(1,'rgba(5,5,16,0.4)');
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H); ctx.restore();

      ctx.save();
      const btm=ctx.createLinearGradient(0,H*0.5,0,H);
      btm.addColorStop(0,'rgba(5,5,16,0)'); btm.addColorStop(1,'rgba(5,5,16,0.25)');
      ctx.fillStyle=btm; ctx.fillRect(0,0,W,H); ctx.restore();

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mkStar, mkNeb, mkDust, mkPlanets]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      id="animated-bg-canvas"
      style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:-1, pointerEvents:'none' }}
    />
  );
}
