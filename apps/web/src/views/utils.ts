import type { GenerationSession } from '@/types/session';

export function formatAudioDuration(milliseconds: number): string {
    const seconds = Math.round(milliseconds / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
    return bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(0)} KB`
        : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getSessionLabel(session: GenerationSession): string {
    return session.name || `Session #${session.index}`;
}

export function getAuthErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') return 'Something went wrong. Please try again.';
    if ('response' in error) {
        const axiosError = error as {
            response?: { data?: { error?: string; message?: string } };
            code?: string;
        };
        const message = axiosError.response?.data?.error || axiosError.response?.data?.message;
        if (message) {
            const normalized = message.toLowerCase();
            if (normalized.includes('email') && normalized.includes('already'))
                return 'This email is already registered. Please log in or use a different email.';
            if (normalized.includes('invalid') || normalized.includes('incorrect'))
                return 'Invalid email or password. Please try again.';
            return message;
        }
        if (axiosError.code === 'ERR_NETWORK')
            return 'Cannot connect to server. Make sure the API is running.';
    }
    return 'Something went wrong. Please try again.';
}
