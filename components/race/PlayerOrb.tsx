"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Trail, Sphere, MeshDistortMaterial } from "@react-three/drei"
import * as THREE from "three"

interface PlayerOrbProps {
  position: [number, number, number]
  progress: number
  color?: string
  streak?: number
  isMistake?: boolean
  isLocal?: boolean
}

export function PlayerOrb({
  position,
  progress,
  color = "#22d3ee",
  streak = 0,
  isMistake = false,
  isLocal = true,
}: PlayerOrbProps) {
  const orbRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const targetZ = useRef(position[2])

  const streakIntensity = useMemo(() => {
    if (streak >= 50) return 1
    if (streak >= 30) return 0.8
    if (streak >= 15) return 0.6
    if (streak >= 5) return 0.4
    return 0.2
  }, [streak])

  const orbColor = useMemo(() => {
    if (streak >= 50) return "#ff6b6b"
    if (streak >= 30) return "#ffa94d"
    if (streak >= 15) return "#69db7c"
    return color
  }, [streak, color])

  useFrame((state, delta) => {
    if (!orbRef.current || !glowRef.current) return

    const newZ = -progress * 0.5
    targetZ.current = THREE.MathUtils.lerp(targetZ.current, newZ, delta * 5)
    
    orbRef.current.position.z = targetZ.current
    glowRef.current.position.z = targetZ.current

    const wobble = Math.sin(state.clock.elapsedTime * 3) * 0.05
    orbRef.current.position.y = position[1] + wobble

    if (isMistake) {
      orbRef.current.scale.setScalar(0.8 + Math.random() * 0.4)
    } else {
      const targetScale = 1 + streakIntensity * 0.3
      orbRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 5
      )
    }

    glowRef.current.scale.setScalar(orbRef.current.scale.x * 2)
  })

  return (
    <group>
      <Trail
        width={1}
        length={6}
        color={orbColor}
        attenuation={(t) => t * t}
      >
        <mesh
          ref={orbRef}
          position={position}
        >
          <Sphere args={[0.3, 32, 32]}>
            <MeshDistortMaterial
              color={orbColor}
              emissive={orbColor}
              emissiveIntensity={streakIntensity}
              distort={isMistake ? 0.4 : 0.1}
              speed={isMistake ? 10 : 2}
              transparent
              opacity={0.9}
            />
          </Sphere>
        </mesh>
      </Trail>

      <mesh ref={glowRef} position={position}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial
          color={orbColor}
          transparent
          opacity={0.15 + streakIntensity * 0.1}
        />
      </mesh>

      {isLocal && (
        <pointLight
          position={position}
          color={orbColor}
          intensity={2 + streakIntensity * 3}
          distance={5}
        />
      )}
    </group>
  )
}
