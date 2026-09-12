import type { GenerationSession } from '@/types/session';

export function getSessionAudioLabel(session: GenerationSession, trackCount?: number) {
    if (session.presetId === 'music-widget') {
        return `${trackCount ?? session.trackCount ?? 0} tracks`;
    }
    if (session.noAudio) return 'No audio';
    return session.audio
        ? session.audio.title + (session.audio.artist ? ` – ${session.audio.artist}` : '')
        : 'No audio track';
}
