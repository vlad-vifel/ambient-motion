import { MusicWidgetVideo, type MusicWidgetVideoProps } from './MusicWidgetVideo';
import { MUSIC_WIDGET_PRESET_ID } from './constants';
import type { PresetRenderDefinition } from '../types';

const defaultProps: MusicWidgetVideoProps = {
    imageUrl: '',
    audioUrl: '',
    phrase: 'and then she left',
    title: 'and then she left',
    artist: 'undercurrent.',
    durationMs: 30000,
    fadeInMs: 2000,
    fadeOutMs: 2000,
    fullAudioDurationMs: 240000,
    audioStartMs: 0,
    audioFadeInMs: 0,
    audioFadeOutMs: 0,
    settings: {
        overallBrightness: 100,
        watermarkBrightness: 100,
        backgroundBrightness: 80,
        contrast: 100,
        watermarkEnabled: true,
        watermarkText: 'ambient mode',
    },
};

export const musicWidgetRenderDefinition: PresetRenderDefinition = {
    id: MUSIC_WIDGET_PRESET_ID,
    compositionId: 'music-widget',
    component: MusicWidgetVideo,
    defaultProps,
    width: 1080,
    height: 1920,
    fps: 30,
};
