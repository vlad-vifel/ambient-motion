import { defineAsyncComponent } from 'vue';
import { PresetAccent, PresetEntryMode, type PresetDefinition } from '@/presets/types';
import RpgEntryCard from './components/RpgEntryCard.vue';
import RpgSettingsDialog from './components/RpgSettingsDialog.vue';
import { DEFAULT_RPG_SETTINGS } from './types';

export const rpgDialogueDefinition: PresetDefinition = {
    id: 'rpg-dialogue',
    accent: PresetAccent.Dialogue,
    createComponent: defineAsyncComponent(
        () => import('@/presets/rpg-dialogue/components/RpgDialogueCreate.vue'),
    ),
    entryMode: PresetEntryMode.Dialogue,
    supportsNoAudio: true,
    usesAssets: true,
    entryCardComponent: RpgEntryCard,
    settingsDialogComponent: RpgSettingsDialog,
    defaultSettings: () => ({ ...DEFAULT_RPG_SETTINGS }),
};
