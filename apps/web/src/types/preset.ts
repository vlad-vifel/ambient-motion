export interface VideoPreset {
    id: string;
    name: string;
    description: string | null;
    format: string;
    component: string;
    width: number;
    height: number;
    fps: number;
    createdAt: string;
}
