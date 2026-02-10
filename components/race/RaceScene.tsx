"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { PerspectiveCamera, Environment } from "@react-three/drei"
import { NeonTunnel } from "./NeonTunnel"
import { PlayerOrb } from "./PlayerOrb"

interface PlayerData {
  id: string
  username: string
  progress: number
  wpm: number
  streak: number
  isMistake: boolean
}

interface RaceSceneProps {
  player1: PlayerData
  player2?: PlayerData
  gameSpeed?: number
}

export function RaceScene({
  player1,
  player2,
  gameSpeed = 1,
}: RaceSceneProps) {
  const isSplitView = !!player2

  return (
    <div className="relative h-full w-full">
      <Canvas className="h-full w-full" gl={{ antialias: true, alpha: true }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 1, 5]} fov={75} near={0.1} far={200} />

          <color attach="background" args={["#080a0f"]} />

          <NeonTunnel speed={gameSpeed} />

          <PlayerOrb
            position={isSplitView ? [-1, 0, 0] : [0, 0, 0]}
            progress={player1.progress}
            color="#ff4655"
            streak={player1.streak}
            isMistake={player1.isMistake}
            isLocal
          />

          {player2 && (
            <PlayerOrb
              position={[1, 0, 0]}
              progress={player2.progress}
              color="#d9dde4"
              streak={player2.streak}
              isMistake={player2.isMistake}
              isLocal={false}
            />
          )}

          <Environment preset="night" />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        <div className="rounded-xl border border-white/14 bg-[#0f131b]/80 px-4 py-2 backdrop-blur-sm">
          <p className="text-xs text-white/45">{player1.username}</p>
          <p className="text-lg font-bold text-[#ff9ca6]">{player1.wpm} WPM</p>
        </div>

        {player2 && (
          <div className="rounded-xl border border-white/14 bg-[#0f131b]/80 px-4 py-2 text-right backdrop-blur-sm">
            <p className="text-xs text-white/45">{player2.username}</p>
            <p className="text-lg font-bold text-white/85">{player2.wpm} WPM</p>
          </div>
        )}
      </div>
    </div>
  )
}
