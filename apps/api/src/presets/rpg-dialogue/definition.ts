import { rpgDialogueRenderDefinition } from './render-definition';
import { PresetAssetSource, PresetAudioRenderStrategy, type PresetDefinition } from '../types';

export const rpgDialoguePreset: PresetDefinition = {
    ...rpgDialogueRenderDefinition,
    display: {
        name: 'RPG Dialogue',
        description:
            'Vertical cinematic video with dot-matrix overlay, purple color grading and RPG-style dialogue text',
        format: 'VERTICAL_9_16',
    },
    applyGrain: false,
    assetSource: PresetAssetSource.Asset,
    audioRenderStrategy: PresetAudioRenderStrategy.Remotion,
};
