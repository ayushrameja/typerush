'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { GridBackground } from '@/components/home/GridBackground';
import { UsernameEditor } from '@/components/ui/UsernameEditor';
import { useIdentityStore } from '@/lib/stores/identityStore';
import { useHeartbeat } from '@/lib/hooks/useHeartbeat';
import { useLocalHistory, type LocalRaceResult } from '@/lib/hooks/useLocalHistory';
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

  useHeartbeat({
    playerId: identity?.playerId ?? "",
    playerToken: identity?.token ?? undefined,
    username: identity?.displayName ?? "",
    enabled: isReady && !!identity,
    status: "online",
  });

  const { raceHistory: localRaceHistory } = useLocalHistory();

  const serverRecentOpponents = useQuery(
    api.raceHistory.getRecentOpponents,
    isAuthenticated && identity ? { playerId: identity.playerId, limit: 5 } : 'skip'
  );

  const localRecentOpponents = useMemo(() => {
    if (isAuthenticated) return [];
    const map = new Map<string, {
      opponentId: string;
      opponentUsername: string;
      totalGames: number;
      wins: number;
      losses: number;
      lastPlayedAt: number;
    }>();

    for (const race of localRaceHistory) {
      const existing = map.get(race.opponentId);
      if (existing) {
        existing.totalGames += 1;
        if (race.won) existing.wins += 1;
        else existing.losses += 1;
        existing.lastPlayedAt = Math.max(existing.lastPlayedAt, race.completedAt);
      } else {
        map.set(race.opponentId, {
          opponentId: race.opponentId,
          opponentUsername: race.opponentUsername,
          totalGames: 1,
          wins: race.won ? 1 : 0,
          losses: race.won ? 0 : 1,
          lastPlayedAt: race.completedAt,
        });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
      .slice(0, 5);
  }, [localRaceHistory, isAuthenticated]);

  const recentOpponents = isAuthenticated ? serverRecentOpponents : localRecentOpponents;

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

          {recentOpponents && recentOpponents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <h2 className="arena-heading mb-4 text-3xl leading-none text-white">Recently Played</h2>
              <div className="space-y-2">
                {recentOpponents.map((opponent) => (
                  <div
                    key={opponent.opponentId}
                    className="arena-card flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-white/5 text-sm font-bold text-white/60">
                        {opponent.opponentUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{opponent.opponentUsername}</p>
                        <p className="text-xs text-white/45">
                          {opponent.totalGames} {opponent.totalGames === 1 ? 'game' : 'games'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[#73e78d]">{opponent.wins}W</span>
                      <span className="text-xs font-semibold text-[#ff6876]">{opponent.losses}L</span>
                      <span className="text-xs text-white/35">
                        {formatRelativeTime(opponent.lastPlayedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
