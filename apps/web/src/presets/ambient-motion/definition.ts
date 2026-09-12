import { defineAsyncComponent } from 'vue';
import { PresetAccent, PresetEntryMode, type PresetDefinition } from '@/presets/types';

export const ambientMotionDefinition: PresetDefinition = {
    id: 'ambient-motion',
    accent: PresetAccent.Ambient,
    createComponent: defineAsyncComponent(
        () => import('@/presets/ambient-motion/components/AmbientMotionCreate.vue'),
    ),
    entryMode: PresetEntryMode.Phrase,
    supportsNoAudio: false,
    usesAssets: true,
};
