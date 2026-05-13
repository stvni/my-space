import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const vertexShader = /* glsl */`
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    float brightness = 0.0;

    for(int i = 0; i < 7; i++) {
      float fi = float(i);
      float y = uv.y - (0.1 + fi * 0.14);
      float wave = sin(uv.x * (2.5 + fi * 0.8) + uTime * (0.3 + fi * 0.1) + fi) * (0.015 + fi * 0.008);
      float dist = abs(y - wave);
      float line = (0.03 + fi * 0.006) / (dist + 0.004);
      float sheen = 0.008 / (abs(y - wave - 0.002) + 0.003);
      brightness += line * (0.06 - fi * 0.006) + sheen * 0.015;
    }

    vec2 mPos = uMouse;
    float spot = 0.04 / (distance(uv, vec2(0.3 + mPos.x * 0.4, 0.35)) + 0.1);
    brightness += spot * 0.03;

    float vig = 1.0 - length(uv - 0.5) * 1.2;
    brightness *= max(vig, 0.0);

    gl_FragColor = vec4(vec3(brightness), brightness * 0.8);
  }
`

export function ChromeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    camera.position.z = 0.5

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    // Full-screen quad
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      uTime:       { value: 0 },
      uMouse:      { value: new THREE.Vector2(0.5, 0.5) },
      uResolution: { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) },
    }
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(geometry, material))

    // Particle system — chrome dust drifting upward
    const COUNT = 50
    const positions = new Float32Array(COUNT * 3)
    const pData = Array.from({ length: COUNT }, () => ({
      x: (Math.random() * 2 - 1),
      y: (Math.random() * 2 - 1),
      vy: 0.00015 + Math.random() * 0.00025,
    }))
    pData.forEach((p, i) => {
      positions[i * 3]     = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = 0
    })
    const pGeo = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(positions, 3)
    pGeo.setAttribute('position', posAttr)
    const pMat = new THREE.PointsMaterial({
      color: 0xcccccc,
      size: 0.004,
      transparent: true,
      opacity: 0.25,
      sizeAttenuation: false,
    })
    scene.add(new THREE.Points(pGeo, pMat))

    // Mouse tracking
    const mouse = { x: 0.5, y: 0.5 }
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth
      mouse.y = e.clientY / window.innerHeight
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    // Resize
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h)
      uniforms.uResolution.value.set(w, h)
    }
    window.addEventListener('resize', onResize, { passive: true })

    // Animation loop
    let raf: number
    const t0 = performance.now()

    const animate = () => {
      raf = requestAnimationFrame(animate)
      const elapsed = (performance.now() - t0) / 1000
      uniforms.uTime.value = elapsed
      uniforms.uMouse.value.set(mouse.x, 1 - mouse.y)

      // Drift particles upward
      for (let i = 0; i < COUNT; i++) {
        pData[i].y += pData[i].vy
        if (pData[i].y > 1.05) {
          pData[i].y = -1.05
          pData[i].x = Math.random() * 2 - 1
        }
        posAttr.setXY(i, pData[i].x, pData[i].y)
      }
      posAttr.needsUpdate = true

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      geometry.dispose()
      material.dispose()
      pGeo.dispose()
      pMat.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
