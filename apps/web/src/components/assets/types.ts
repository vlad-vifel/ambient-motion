import type { Asset } from '@/stores/assets';
import type { Folder } from '@/stores/folders';
import type { ViewMode } from '@/types/ui';

export interface AssetItemProps {
    asset: Asset;
    viewMode: ViewMode;
    selectionMode: boolean;
    selected: boolean;
}

export interface AssetFolderItemProps {
    folder: Folder;
    viewMode: ViewMode;
    selectionMode: boolean;
}
