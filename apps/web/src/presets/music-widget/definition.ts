import { defineAsyncComponent } from 'vue';
import { PresetAccent, PresetEntryMode, type PresetDefinition } from '@/presets/types';
import MusicWidgetSettingsDialog from './components/MusicWidgetSettingsDialog.vue';
import { defaultMusicWidgetSettings } from './types';

export const musicWidgetDefinition: PresetDefinition = {
    id: 'music-widget',
    accent: PresetAccent.Music,
    createComponent: defineAsyncComponent(
        () => import('@/presets/music-widget/components/MusicWidgetCreateFlow.vue'),
    ),
    entryMode: PresetEntryMode.Track,
    supportsNoAudio: false,
    usesAssets: false,
    settingsDialogComponent: MusicWidgetSettingsDialog,
    defaultSettings: defaultMusicWidgetSettings,
};
