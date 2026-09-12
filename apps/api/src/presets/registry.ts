import { ambientMotionPreset } from './ambient-motion/definition';
import { musicWidgetPreset } from './music-widget/definition';
import { rpgDialoguePreset } from './rpg-dialogue/definition';
import type { PresetDefinition } from './types';

const presetDefinitions = [ambientMotionPreset, musicWidgetPreset, rpgDialoguePreset] as const;

const presetById = new Map<string, PresetDefinition>(
    presetDefinitions.map((preset) => [preset.id, preset]),
);

export function getPresetDefinition(id: string): PresetDefinition {
    const preset = presetById.get(id);
    if (!preset) throw new Error(`Unsupported preset: ${id}`);
    return preset;
}

export function hasPresetDefinition(id: string): boolean {
    return presetById.has(id);
}

export { presetDefinitions };
