export interface RpgSettings {
    brightness: number;
    contrast: number;
    textOffsetY: number;
    gapQuestionOptions: number;
    gapOptions: number;
    vignette: boolean;
    overlayPercent: number;
}

export interface RpgDialogueCreateProps {
    presetId: string;
}

export interface RpgEntryCardProps {
    phrase: string;
    choiceLeft: string;
    choiceRight: string;
    onRemove?: () => void;
}

export interface RpgEntryCardEmits {
    (event: 'update:phrase', value: string): void;
    (event: 'update:choiceLeft', value: string): void;
    (event: 'update:choiceRight', value: string): void;
}

export interface RpgSettingsDialogProps {
    open: boolean;
    imageUrl: string;
    phrase: string;
    choiceLeft: string;
    choiceRight: string;
    settings?: RpgSettings | null;
}

export interface RpgSettingsDialogEmits {
    (event: 'update:open', value: boolean): void;
    (event: 'apply', settings: RpgSettings): void;
}

export interface RpgPreviewCanvasProps {
    imageUrl: string;
    phrase: string;
    choiceLeft: string;
    choiceRight: string;
    settings: RpgSettings;
    width?: number;
}

export const RpgChoiceIconVariant = {
    Cross: 'x',
    Circle: 'o',
} as const;

export type RpgChoiceIconVariant = (typeof RpgChoiceIconVariant)[keyof typeof RpgChoiceIconVariant];

export interface RpgChoiceIconProps {
    variant: RpgChoiceIconVariant;
    size: number;
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
