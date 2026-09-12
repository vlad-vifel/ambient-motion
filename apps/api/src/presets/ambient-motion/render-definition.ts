import { AmbientMotion, type AmbientMotionProps } from './AmbientMotion';
import type { PresetRenderDefinition } from '../types';

const defaultProps: AmbientMotionProps = {
    imageUrl: '',
    audioUrl: '',
    phrase: 'nothing feels the same now',
    durationMs: 30000,
    fadeInMs: 0,
    fadeOutMs: 0,
};

export const ambientMotionRenderDefinition: PresetRenderDefinition = {
    id: 'ambient-motion',
    compositionId: 'ambient-motion',
    component: AmbientMotion,
    defaultProps,
    width: 1080,
    height: 1080,
    fps: 30,
};
