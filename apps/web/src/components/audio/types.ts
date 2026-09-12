import type { Audio } from '@/stores/audio';
import type { ViewMode } from '@/types/ui';

export interface AudioTrackItemProps {
    track: Audio;
    viewMode: ViewMode;
    selectionMode: boolean;
    selected: boolean;
    isPlaying: boolean;
}
