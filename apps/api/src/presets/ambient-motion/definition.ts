import { ambientMotionRenderDefinition } from './render-definition';
import { PresetAssetSource, PresetAudioRenderStrategy, type PresetDefinition } from '../types';

export const ambientMotionPreset: PresetDefinition = {
    ...ambientMotionRenderDefinition,
    display: {
        name: 'Ambient Motion',
        description: 'Square cinematic video with atmospheric text and grain',
        format: 'SQUARE_1_1',
    },
    applyGrain: true,
    assetSource: PresetAssetSource.Asset,
    audioRenderStrategy: PresetAudioRenderStrategy.Remotion,
};
