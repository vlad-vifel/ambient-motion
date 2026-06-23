import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function downloadVideoFile(videoId: string, phrase: string) {
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiBase}/api/videos/${videoId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${phrase}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
