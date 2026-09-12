import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (!axios.isAxiosError<{ error?: string }>(error)) return fallback;
    return error.response?.data?.error ?? fallback;
}
