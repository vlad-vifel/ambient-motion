import type { SelectionIntent, ViewMode } from '@/types/ui';

export interface ViewModeToggleProps {
    modelValue: ViewMode;
}

export interface PresetBadgeProps {
    presetId: string;
    name: string;
    format?: string | null;
    showName?: boolean;
}

export interface BulkSelectionActionsProps {
    selectedCount: number;
    allSelected: boolean;
    deleteLabel?: string;
    intent?: SelectionIntent | null;
    downloading?: boolean;
}
