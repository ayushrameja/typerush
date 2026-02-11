'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { GridBackground } from '@/components/home/GridBackground';
import { UsernameEditor } from '@/components/ui/UsernameEditor';
import { useIdentityStore } from '@/lib/stores/identityStore';
import { generateTextForDuration } from '@/lib/utils/words';

export default function RaceLobbyPage() {
  const router = useRouter();
  const { identity, isReady } = useIdentityStore();
  const { isAuthenticated } = useConvexAuth();
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isFindingMatch, setIsFindingMatch] = useState(false);
  const [error, setError] = useState('');

  const createLobby = useMutation(api.lobbies.createLobby);
  const joinLobbyByCode = useMutation(api.lobbies.joinLobbyByCode);
  const findOrCreateMatch = useMutation(api.lobbies.findOrCreateMatch);
  const updateAnonUsername = useMutation(api.anonymous.updateUsername);

  const handleCreateRoom = async () => {
    if (!identity) return;

    setIsCreating(true);
    setError('');

    try {
      const textToType = generateTextForDuration(60);
      const result = await createLobby({
        playerId: identity.playerId,
        playerToken: identity.token ?? undefined,
        username: identity.displayName,
        textToType,
      });

      router.push(`/race/${result.lobbyId}?host=true`);
    } catch (createError) {
      const msg = createError instanceof Error ? createError.message : 'Failed to create room.';
      setError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!identity) return;

    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const result = await joinLobbyByCode({
        playerId: identity.playerId,
        playerToken: identity.token ?? undefined,
        username: identity.displayName,
        roomCode: joinCode,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/race/${result.lobbyId}`);
    } catch (joinError) {
      const msg = joinError instanceof Error ? joinError.message : 'Failed to join room';
      setError(msg);
    } finally {
      setIsJoining(false);
    }
  };

  const handleFindMatch = async () => {
    if (!identity) return;

    setIsFindingMatch(true);
    setError('');

    try {
      const textToType = generateTextForDuration(60);
      const result = await findOrCreateMatch({
        playerId: identity.playerId,
        playerToken: identity.token ?? undefined,
        username: identity.displayName,
        textToType,
      });

      if (result.role === 'host') {
        router.push(`/race/${result.lobbyId}?host=true&matchmaking=true`);
      } else {
        router.push(`/race/${result.lobbyId}`);
      }
    } catch (matchError) {
      const msg = matchError instanceof Error ? matchError.message : 'Failed to find match.';
      setError(msg);
    } finally {
      setIsFindingMatch(false);
    }
  };

  const handleUsernameChange = async (newName: string) => {
    if (!identity?.token) return;
    const result = await updateAnonUsername({ token: identity.token, newUsername: newName });
    if (!result.ok) throw new Error(result.error);
  };

  const waiting = !isReady || !identity;

  return (
    <div className="arena-shell min-h-screen px-4 py-12">
      <GridBackground />
      <div className="relative mx-auto max-w-3xl pt-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold tracking-[0.05em] text-white/60 transition-colors hover:text-white/85"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <div className="arena-chip">Multiplayer</div>
          <h1 className="arena-heading mt-4 text-7xl leading-none text-white">1v1 Race</h1>
          <p className="mt-2 text-white/58">Queue random, create a room, or join by code.</p>
        </motion.div>

        {!isAuthenticated && identity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 rounded-2xl border border-white/14 bg-white/5 p-4 flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">Playing as</span>
              <UsernameEditor
                currentName={identity.username}
                discriminator={identity.discriminator}
                onSave={handleUsernameChange}
              />
            </div>
            <Link
              href="/login"
              className="text-sm font-semibold text-[#ff9ea8] transition-colors hover:text-white"
            >
              Sign in to save progress →
            </Link>
          </motion.div>
        )}

        <div className="grid gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6">
              <h2 className="arena-heading text-4xl leading-none text-white">Quick Match</h2>
              <p className="mb-4 mt-2 text-white/58">Find a random opponent and start immediately.</p>
              <Button onClick={handleFindMatch} isLoading={isFindingMatch} disabled={waiting} className="w-full" size="lg">
                Find Opponent
              </Button>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6">
              <h2 className="arena-heading text-4xl leading-none text-white">Create Room</h2>
              <p className="mb-4 mt-2 text-white/58">Host a private room and share your room code.</p>
              <Button
                onClick={handleCreateRoom}
                isLoading={isCreating}
                disabled={waiting}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                Create Private Room
              </Button>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-6">
              <h2 className="arena-heading text-4xl leading-none text-white">Join Room</h2>
              <p className="mb-4 mt-2 text-white/58">Enter a room code from your teammate.</p>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter room code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 uppercase"
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinRoom}
                  isLoading={isJoining}
                  disabled={waiting || !joinCode.trim()}
                  variant="secondary"
                >
                  Join
                </Button>
              </div>
            </Card>
          </motion.div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[#ff8d97]">
              {error}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
