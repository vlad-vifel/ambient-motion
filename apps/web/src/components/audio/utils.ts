export function formatAudioTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function formatAudioDuration(milliseconds: number): string {
    return formatAudioTime(milliseconds / 1000);
}

export function formatFileSize(bytes: number): string {
    return bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(0)} KB`
        : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
