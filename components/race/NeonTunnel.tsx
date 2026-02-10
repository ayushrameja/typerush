"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface NeonTunnelProps {
  speed?: number
}

export function NeonTunnel({ speed = 1 }: NeonTunnelProps) {
  const tunnelRef = useRef<THREE.Group>(null)
  const ringsRef = useRef<THREE.Group>(null)

  const ringCount = 60
  const ringSpacing = 2

  const rings = useMemo(() => {
    return Array.from({ length: ringCount }, (_, i) => ({
      position: -i * ringSpacing,
      scale: 1 + Math.sin(i * 0.1) * 0.1,
      rotation: i * 0.05,
    }))
  }, [])

  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring) => {
        ring.position.z += delta * speed * 10
        if (ring.position.z > 5) {
          ring.position.z = -ringCount * ringSpacing + 5
        }
        ring.rotation.z += delta * 0.1
      })
    }
  })

  return (
    <group ref={tunnelRef}>
      <ambientLight intensity={0.1} />
      
      <fog attach="fog" args={["#090b10", 10, 100]} />

      <group ref={ringsRef}>
        {rings.map((ring, i) => (
          <mesh
            key={i}
            position={[0, 0, ring.position]}
            rotation={[0, 0, ring.rotation]}
            scale={ring.scale}
          >
            <torusGeometry args={[4, 0.03, 8, 64]} />
            <meshBasicMaterial
              color={i % 3 === 0 ? "#ff4655" : i % 3 === 1 ? "#ff7a86" : "#ffffff"}
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 0, -60]} rotation={[0, 0, 0]}>
        <circleGeometry args={[20, 32]} />
        <meshBasicMaterial color="#ff4655" transparent opacity={0.05} />
      </mesh>

      <gridHelper
        args={[200, 40, "#ff6674", "#3a2024"]}
        position={[0, -4, -50]}
        rotation={[0, 0, 0]}
      />
    </group>
  )
}
