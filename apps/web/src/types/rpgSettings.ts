export interface RpgSettings {
    brightness: number;
    contrast: number;
    textOffsetY: number;
    gapQuestionOptions: number;
    gapOptions: number;
    vignette: boolean;
    overlayPercent: number;
}

export const DEFAULT_RPG_SETTINGS: RpgSettings = {
    brightness: 90,
    contrast: 105,
    textOffsetY: 0,
    gapQuestionOptions: 48,
    gapOptions: 151,
    vignette: true,
    overlayPercent: 10,
};
