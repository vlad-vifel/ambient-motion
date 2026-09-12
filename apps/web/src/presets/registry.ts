import { ambientMotionDefinition } from './ambient-motion/definition';
import { musicWidgetDefinition } from './music-widget/definition';
import { rpgDialogueDefinition } from './rpg-dialogue/definition';
import type { PresetDefinition } from './types';

const presetDefinitions = new Map<string, PresetDefinition>([
    [ambientMotionDefinition.id, ambientMotionDefinition],
    [musicWidgetDefinition.id, musicWidgetDefinition],
    [rpgDialogueDefinition.id, rpgDialogueDefinition],
]);

export function getPresetDefinition(id: string): PresetDefinition | null {
    return presetDefinitions.get(id) ?? null;
}
