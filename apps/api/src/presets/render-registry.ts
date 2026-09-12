import { ambientMotionRenderDefinition } from './ambient-motion/render-definition';
import { musicWidgetRenderDefinition } from './music-widget/render-definition';
import { rpgDialogueRenderDefinition } from './rpg-dialogue/render-definition';

export const renderPresetDefinitions = [
    ambientMotionRenderDefinition,
    musicWidgetRenderDefinition,
    rpgDialogueRenderDefinition,
] as const;
