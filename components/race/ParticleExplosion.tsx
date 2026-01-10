"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface ParticleExplosionProps {
  position: [number, number, number]
  color?: string
  count?: number
  active: boolean
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function ParticleExplosion({
  position,
  color = "#ff6b6b",
  count = 30,
  active,
}: ParticleExplosionProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const lifetimesRef = useRef<Float32Array>(new Float32Array(count))

  const { positions, velocities } = useMemo(() => {
    const positionsArray = new Float32Array(count * 3)
    const velocitiesArray = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positionsArray[i * 3] = position[0]
      positionsArray[i * 3 + 1] = position[1]
      positionsArray[i * 3 + 2] = position[2]

      const theta = seededRandom(i * 3 + 1) * Math.PI * 2
      const phi = seededRandom(i * 3 + 2) * Math.PI
      const speed = 2 + seededRandom(i * 3 + 3) * 3

      velocitiesArray[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      velocitiesArray[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      velocitiesArray[i * 3 + 2] = Math.cos(phi) * speed
    }

    return { positions: positionsArray, velocities: velocitiesArray }
  }, [count, position])

  useFrame((_, delta) => {
    if (!particlesRef.current) return

    const positionsAttr = particlesRef.current.geometry.attributes.position
    if (!positionsAttr) return

    const positionsArray = positionsAttr.array as Float32Array

    if (active) {
      for (let i = 0; i < count; i++) {
        if (lifetimesRef.current[i] < 1) {
          lifetimesRef.current[i] += delta * 2

          positionsArray[i * 3] += velocities[i * 3] * delta
          positionsArray[i * 3 + 1] += velocities[i * 3 + 1] * delta
          positionsArray[i * 3 + 2] += velocities[i * 3 + 2] * delta
        }
      }
    } else {
      for (let i = 0; i < count; i++) {
        positionsArray[i * 3] = position[0]
        positionsArray[i * 3 + 1] = position[1]
        positionsArray[i * 3 + 2] = position[2]
        lifetimesRef.current[i] = 0
      }
    }

    positionsAttr.needsUpdate = true
  })

  if (!active) return null

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.1}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}
