export const ViewMode = {
    List: 'list',
    Grid: 'grid',
} as const;

export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode];

export const FilterValue = {
    All: 'all',
    None: 'none',
} as const;

export type FilterValue = (typeof FilterValue)[keyof typeof FilterValue];

export const AuthMode = {
    Login: 'login',
    Register: 'register',
} as const;

export type AuthMode = (typeof AuthMode)[keyof typeof AuthMode];

export const SelectionIntent = {
    Download: 'download',
    Delete: 'delete',
} as const;

export type SelectionIntent = (typeof SelectionIntent)[keyof typeof SelectionIntent];

export const AssetTargetType = {
    Asset: 'asset',
    Folder: 'folder',
} as const;

export type AssetTargetType = (typeof AssetTargetType)[keyof typeof AssetTargetType];
