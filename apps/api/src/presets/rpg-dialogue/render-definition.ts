import { RpgDialogueVideo, type RpgDialogueVideoProps } from './RpgDialogueVideo';
import type { PresetRenderDefinition } from '../types';

const defaultProps: RpgDialogueVideoProps = {
    imageUrl: '',
    audioUrl: '',
    phrase: 'nothing feels the same now',
    durationMs: 30000,
    fadeInMs: 0,
    fadeOutMs: 0,
};

export const rpgDialogueRenderDefinition: PresetRenderDefinition = {
    id: 'rpg-dialogue',
    compositionId: 'rpg-dialogue',
    component: RpgDialogueVideo,
    defaultProps,
    width: 1080,
    height: 1920,
    fps: 30,
};
