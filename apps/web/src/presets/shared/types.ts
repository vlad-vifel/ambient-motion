import type { Asset } from '@/stores/assets';

export interface StandardCreateFlowProps {
    presetId: string;
}

export interface StandardCreateEntry {
    phrase: string;
    choiceLeft: string;
    choiceRight: string;
    asset: Asset | null;
    settings?: unknown;
}

export interface StandardCreateForm {
    audioId: string;
    assetSource: string;
    presetId: string;
}
