import type { MusicWidgetTiming } from './types';

export function hasInvalidMusicWidgetTiming({
    audioStartMs,
    durationMs,
    audioFadeInMs,
    audioFadeOutMs,
    fullDurationMs,
}: MusicWidgetTiming) {
    return (
        audioStartMs < 0 ||
        durationMs <= 0 ||
        audioStartMs + durationMs > fullDurationMs ||
        audioFadeInMs < 0 ||
        audioFadeOutMs < 0 ||
        audioFadeInMs + audioFadeOutMs > durationMs
    );
}

export function formatMusicWidgetVideoTitle(artist: string, title: string) {
    return artist.trim() ? `${artist.trim()} - ${title.trim()}` : title.trim();
}
