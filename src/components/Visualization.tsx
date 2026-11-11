import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { Matrix, Vector } from '../math/matrix'

const colors = ['#69a7ff', '#bd8bff', '#51dfbe']

interface VisualizationProps {
  dimension: number
  vector: Vector
  bases: Matrix[]
  coordinates: Vector[]
}

function Arrow({ x, y, color, label, dashed = false }: { x: number; y: number; color: string; label: string; dashed?: boolean }) {
  const length = Math.hypot(x, y)
  if (length < 0.0001) return null
  const angle = Math.atan2(-y, x)
  const endX = 310 + x
  const endY = 180 - y
  const dash = dashed ? '7 6' : undefined
  const head = 9
  const leftX = endX - head * Math.cos(angle - Math.PI / 6)
  const leftY = endY - head * Math.sin(angle - Math.PI / 6)
  const rightX = endX - head * Math.cos(angle + Math.PI / 6)
  const rightY = endY - head * Math.sin(angle + Math.PI / 6)
  return (
    <g>
      <line x1="310" y1="180" x2={endX} y2={endY} stroke={color} strokeWidth={dashed ? 2 : 3} strokeDasharray={dash} opacity={dashed ? 0.75 : 0.95} />
      {!dashed && <polygon points={`${endX},${endY} ${leftX},${leftY} ${rightX},${rightY}`} fill={color} />}
      <text x={endX + 7} y={endY - 7} fill={color} fontSize="11" fontWeight="650">{label}</text>
    </g>
  )
}

function VectorPlot({ vector, bases, coordinates }: Omit<VisualizationProps, 'dimension'>) {
  const [activeFrame, setActiveFrame] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  useEffect(() => {
    if (!isAnimating) return
    const timer = window.setInterval(() => setActiveFrame((frame) => (frame + 1) % 3), 1600)
    return () => window.clearInterval(timer)
  }, [isAnimating])
  const largest = Math.max(1, ...vector.map(Math.abs), ...bases.flatMap((basis) => basis.flat().map(Math.abs)))
  const scale = 116 / largest
  return (
    <div className="plot-wrap">
      <div className="frame-controls">
        <span className="frame-control-label">COORDINATE FRAME · 0{activeFrame + 1} / 03</span>
        <div>
          <button aria-label="Previous coordinate frame" onClick={() => setActiveFrame((frame) => (frame + 2) % 3)}><ChevronLeft size={15} /></button>
          <button className="frame-play" onClick={() => setIsAnimating((playing) => !playing)}>{isAnimating ? <Pause size={13} /> : <Play size={13} fill="currentColor" />} {isAnimating ? 'Pause' : 'Animate'}</button>
          <button aria-label="Next coordinate frame" onClick={() => setActiveFrame((frame) => (frame + 1) % 3)}><ChevronRight size={15} /></button>
        </div>
      </div>
      <svg className="plot-svg" viewBox="0 0 620 360" role="img" aria-label="Two-dimensional coordinate frames and unchanged geometric vector">
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="translate(10 0)">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#29364a" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="10" y="12" width="600" height="336" fill="url(#grid)" rx="12" />
        <line x1="25" y1="180" x2="595" y2="180" stroke="#8292a8" strokeWidth="1.2" />
        <line x1="310" y1="26" x2="310" y2="334" stroke="#8292a8" strokeWidth="1.2" />
        <text x="581" y="170" fill="#8a9bb2" fontSize="11">x</text>
        <text x="320" y="36" fill="#8a9bb2" fontSize="11">y</text>
        {bases.map((basis, basisIndex) => (
          <g key={basisIndex} className={`basis-frame${activeFrame === basisIndex ? ' active' : ''}`}>
            <Arrow x={basis[0][0] * scale * 0.78} y={basis[1][0] * scale * 0.78} color={colors[basisIndex]} label={`b${basisIndex + 1}₁`} />
            <Arrow x={basis[0][1] * scale * 0.78} y={basis[1][1] * scale * 0.78} color={colors[basisIndex]} label={`b${basisIndex + 1}₂`} />
          </g>
        ))}
        <Arrow x={vector[0] * scale} y={vector[1] * scale} color="#f6c96b" label="v (same vector)" />
      </svg>
      <div className="plot-coordinate-note">
        <span className="legend-dot" style={{ background: '#f6c96b' }} />
        <span>Showing Basis {activeFrame + 1}: the geometric vector stays fixed; only its coordinate labels change.</span>
      </div>
      <div className="coordinate-chips">
        {coordinates.map((coordinate, index) => (
          <span className={index === activeFrame ? 'active' : ''} key={index}><i style={{ background: colors[index] }} /> B{index + 1}: [{coordinate.map((value) => Number(value.toPrecision(3))).join(', ')}]</span>
        ))}
      </div>
    </div>
  )
}

function ThreePlot({ vector, bases }: Omit<VisualizationProps, 'dimension' | 'coordinates'>) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#111a28')
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / Math.max(host.clientHeight, 1), 0.1, 100)
    camera.position.set(6, 5, 7)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    host.appendChild(renderer.domElement)

    scene.add(new THREE.GridHelper(12, 12, 0x45536a, 0x29364a))
    scene.add(new THREE.AxesHelper(4))
    scene.add(new THREE.AmbientLight(0xffffff, 1.8))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
    keyLight.position.set(4, 8, 6)
    scene.add(keyLight)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 3
    controls.maxDistance = 24
    const arrows: THREE.ArrowHelper[] = []
    const makeArrow = (values: Vector, color: number, scale: number) => {
      const direction = new THREE.Vector3(values[0], values[1], values[2])
      const length = direction.length() * scale
      if (length < 0.0001) return
      direction.normalize()
      const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(0, 0, 0), length, color, 0.22, 0.12)
      scene.add(arrow)
      arrows.push(arrow)
    }
    const largest = Math.max(
      1,
      ...vector.map(Math.abs),
      ...bases.flatMap((basis) => basis.flat().map(Math.abs)),
    )
    const scale = 2.4 / largest
    for (let basisIndex = 0; basisIndex < bases.length; basisIndex += 1) {
      const basis = bases[basisIndex]
      for (let column = 0; column < 3; column += 1) {
        makeArrow(basis.map((row) => row[column]), [0x69a7ff, 0xbd8bff, 0x51dfbe][basisIndex], scale)
      }
    }
    makeArrow(vector, 0xf6c96b, scale)

    const observer = new ResizeObserver(() => {
      if (!host.isConnected) return
      const width = Math.max(host.clientWidth, 1)
      const height = Math.max(host.clientHeight, 1)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    })
    observer.observe(host)
    let frame = 0
    const render = () => {
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      arrows.forEach((arrow) => {
        arrow.line.geometry.dispose()
        arrow.cone.geometry.dispose()
        ;(arrow.line.material as THREE.Material).dispose()
        ;(arrow.cone.material as THREE.Material).dispose()
      })
      scene.traverse((object) => {
        if (object instanceof THREE.GridHelper || object instanceof THREE.AxesHelper) {
          object.geometry.dispose()
          const material = object.material
          if (Array.isArray(material)) material.forEach((item) => item.dispose())
          else material.dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [vector, bases])

  return (
    <div className="plot-wrap">
      <div ref={hostRef} className="three-canvas" aria-label="Interactive three-dimensional basis visualization" />
      <div className="plot-coordinate-note"><span className="legend-dot" style={{ background: '#f6c96b' }} /> Gold is the unchanged vector; blue, violet, and mint show basis vectors. Drag to rotate; scroll to zoom.</div>
      <div className="coordinate-chips">
        <span><i style={{ background: colors[0] }} /> Basis 1</span>
        <span><i style={{ background: colors[1] }} /> Basis 2</span>
        <span><i style={{ background: colors[2] }} /> Basis 3</span>
      </div>
    </div>
  )
}

export default function Visualization(props: VisualizationProps) {
  return props.dimension === 2 ? (
    <VectorPlot vector={props.vector} bases={props.bases} coordinates={props.coordinates} />
  ) : (
    <ThreePlot vector={props.vector} bases={props.bases} />
  )
}
