import { VideoStatus } from '@/types/video';

const STATUS_CLASSES: Record<VideoStatus, string> = {
    [VideoStatus.Draft]: 'bg-muted text-muted-foreground',
    [VideoStatus.Queued]: 'bg-muted text-muted-foreground',
    [VideoStatus.Generating]: 'bg-blue-500/15 text-blue-400',
    [VideoStatus.Completed]: 'bg-emerald-500/15 text-emerald-400',
    [VideoStatus.Failed]: 'bg-destructive/15 text-destructive',
};

const STATUS_LABELS: Record<VideoStatus, string> = {
    [VideoStatus.Draft]: 'draft',
    [VideoStatus.Queued]: 'queued',
    [VideoStatus.Generating]: 'creating',
    [VideoStatus.Completed]: 'done',
    [VideoStatus.Failed]: 'failed',
};

export function getVideoStatusClass(status: VideoStatus): string {
    return STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground';
}

export function getVideoStatusLabel(status: VideoStatus): string {
    return STATUS_LABELS[status] ?? status.toLowerCase();
}
