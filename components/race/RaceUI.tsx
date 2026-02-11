"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatTime } from "@/lib/utils/calculateStats";

interface RaceUIProps {
  status: "waiting" | "countdown" | "racing" | "finished";
  countdown: number;
  timeLeft: number;
  player1: {
    username: string;
    progress: number;
    wpm: number;
  };
  player2?: {
    username: string;
    progress: number;
    wpm: number;
  };
  winner?: string;
  onRestart?: () => void;
  hostDisconnected?: boolean;
  guestDisconnected?: boolean;
}

export function RaceUI({
  status,
  countdown,
  timeLeft,
  player1,
  player2,
  winner,
  onRestart,
  hostDisconnected,
  guestDisconnected,
}: RaceUIProps) {
  const opponentDisconnected = hostDisconnected || guestDisconnected;
  return (
    <div className="absolute inset-0 pointer-events-none">
      <AnimatePresence mode="wait">
        {status === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[#0d1118]/84 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-[#ff4655] border-t-transparent"
              />
              <p className="arena-heading text-5xl leading-none text-white">
                Waiting for opponent...
              </p>
            </div>
          </motion.div>
        )}

        {status === "countdown" && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.span
              key={countdown}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="arena-heading text-[11rem] leading-none text-[#ff8f9a]"
              style={{ textShadow: "0 0 58px rgba(255, 70, 85, 0.58)" }}
            >
              {countdown === 0 ? "GO" : countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {status === "racing" && (
        <>
          <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-2xl border border-white/14 bg-[#0f131b]/82 px-8 py-4 backdrop-blur-sm">
            <p className="arena-heading text-center text-6xl leading-none text-[#ff9ea7]">
              {formatTime(timeLeft)}
            </p>
          </div>

          <div className="absolute left-6 right-6 top-6">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-semibold tracking-wide text-[#ff9ea7]">
                {player1.username}
              </span>
              {player2 && (
                <span className="text-sm font-semibold tracking-wide text-white/75">
                  {player2.username}
                </span>
              )}
            </div>

            <div className="relative h-3 overflow-hidden rounded-full bg-white/12">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-[#ff4655] to-[#ff8792]"
                initial={{ width: 0 }}
                animate={{ width: `${player1.progress}%` }}
                transition={{ type: "spring", stiffness: 100 }}
              />
              {player2 && (
                <motion.div
                  className="absolute left-0 top-1 h-1 rounded-full bg-linear-to-r from-white/85 to-white/35"
                  initial={{ width: 0 }}
                  animate={{ width: `${player2.progress}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                />
              )}
            </div>
          </div>
        </>
      )}

      {status === "finished" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-[#0d1118]/90 backdrop-blur-sm"
        >
          <div className="text-center">
            <motion.h2
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="arena-heading mb-4 text-7xl leading-none"
            >
              {opponentDisconnected
                ? <span className="text-[#f0ad4e]">Opponent Left</span>
                : winner === player1.username
                ? <span className="text-[#73e78d]">Victory</span>
                : <span className="text-[#ff6876]">Defeat</span>}
            </motion.h2>

            {opponentDisconnected && (
              <p className="mb-4 text-sm text-white/58">
                Your opponent disconnected from the race.
              </p>
            )}

            <div className="mb-8 flex justify-center gap-12">
              <div className="text-center">
                <p className="mb-1 text-sm text-white/46">{player1.username}</p>
                <p className="text-4xl font-bold text-[#ff9ea7]">
                  {player1.wpm}
                </p>
                <p className="text-xs text-white/45">WPM</p>
              </div>
              {player2 && (
                <div className="text-center">
                  <p className="mb-1 text-sm text-white/46">
                    {player2.username}
                  </p>
                  <p className="text-4xl font-bold text-white/85">
                    {player2.wpm}
                  </p>
                  <p className="text-xs text-white/45">WPM</p>
                </div>
              )}
            </div>

            {onRestart && (
              <button
                onClick={onRestart}
                className="arena-button px-8 py-3 font-semibold"
              >
                Race Again
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
