export type CalmAudioTrackId = 'breathing-guide' | 'steady-voice' | 'soft-tone';
export type CalmAudioDurationSeconds = 60 | 120 | 300;
export type CalmAudioCueId = 'start' | 'inhale' | 'hold' | 'exhale';

export type CalmAudioTrack = {
  id: CalmAudioTrackId;
  title: string;
  durationSeconds: number;
  description: string;
  assetUri: string | null;
};

export const CALM_AUDIO_TRACKS: CalmAudioTrack[] = [
  {
    id: 'breathing-guide',
    title: 'Guided breathing cues',
    durationSeconds: 300,
    description: 'Simple sound cues for inhale, hold, and slow exhale.',
    assetUri: 'bundled-cues',
  },
  {
    id: 'steady-voice',
    title: 'Steady reassurance',
    durationSeconds: 45,
    description: 'Short grounding statements for abandonment fear, shame, or conflict.',
    assetUri: null,
  },
  {
    id: 'soft-tone',
    title: 'Soft background tone',
    durationSeconds: 120,
    description: 'Optional low-volume sound bed for the two-minute reset.',
    assetUri: null,
  },
];

export function getCalmAudioTrack(trackId: CalmAudioTrackId): CalmAudioTrack | null {
  return CALM_AUDIO_TRACKS.find((track) => track.id === trackId) ?? null;
}

export function isCalmAudioAvailable(trackId: CalmAudioTrackId): boolean {
  return Boolean(getCalmAudioTrack(trackId)?.assetUri);
}

export function isAnyCalmAudioAvailable(): boolean {
  return false;
}

export async function prepareCalmAudio(trackId: CalmAudioTrackId): Promise<{ available: boolean; track: CalmAudioTrack | null }> {
  const track = getCalmAudioTrack(trackId);
  return {
    available: Boolean(track?.assetUri),
    track,
  };
}
