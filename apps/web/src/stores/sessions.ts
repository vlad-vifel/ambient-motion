import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/lib/api';
import type { GenerationSession } from '@/types/session';
import type { Video } from '@/types/video';

export const useSessionsStore = defineStore('sessions', () => {
    const items = ref<GenerationSession[]>([]);
    const current = ref<GenerationSession | null>(null);
    const loading = ref(false);
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    async function fetchAll() {
        loading.value = true;
        try {
            const { data } = await api.get<GenerationSession[]>('/api/sessions');
            items.value = data;
        } finally {
            loading.value = false;
        }
    }

    async function fetchOne(id: string) {
        const { data } = await api.get<GenerationSession>(`/api/sessions/${id}`);
        current.value = data;
        return data;
    }

    async function create(payload: {
        name?: string;
        audioId: string;
        assetIds: string[];
        durationMs: number;
        fadeInMs: number;
        fadeOutMs: number;
        presetId: string;
    }): Promise<GenerationSession> {
        const { data } = await api.post<GenerationSession>('/api/sessions', payload);
        items.value.unshift(data);
        return data;
    }

    async function rename(id: string, name: string) {
        const { data } = await api.patch<GenerationSession>(`/api/sessions/${id}`, { name });
        const idx = items.value.findIndex((s) => s.id === id);
        if (idx !== -1) items.value[idx] = { ...items.value[idx], name: data.name };
        if (current.value?.id === id) current.value = { ...current.value, name: data.name };
        return data;
    }

    async function remove(id: string) {
        await api.delete(`/api/sessions/${id}`);
        items.value = items.value.filter((s) => s.id !== id);
        if (current.value?.id === id) current.value = null;
    }

    async function generate(id: string, phrases: string[]): Promise<Video[]> {
        const { data } = await api.post<{ jobs: Video[] }>(`/api/sessions/${id}/generate`, {
            phrases,
        });
        if (current.value?.id === id) {
            current.value = {
                ...current.value,
                videos: [...data.jobs, ...(current.value.videos ?? [])],
            };
        }
        return data.jobs;
    }

    function updateVideos(sessionId: string, videos: Video[]) {
        if (current.value?.id === sessionId) {
            current.value = { ...current.value, videos };
        }
    }

    function hasActiveJobs(): boolean {
        return (current.value?.videos ?? []).some(
            (v) => v.status === 'QUEUED' || v.status === 'GENERATING',
        );
    }

    function startPolling(intervalMs = 3000) {
        stopPolling();
        const sessionId = current.value?.id;
        if (!sessionId) return;

        const tick = async () => {
            try {
                const session = await fetchOne(sessionId);
                updateVideos(sessionId, session.videos);
                if (hasActiveJobs()) {
                    pollTimer = setTimeout(tick, intervalMs);
                }
            } catch (err) {
                console.error('[Sessions] Polling failed:', err);
                // Continue polling even on error, but with increased backoff
                if (hasActiveJobs()) {
                    pollTimer = setTimeout(tick, intervalMs * 2);
                }
            }
        };
        tick();
    }

    function stopPolling() {
        if (pollTimer !== null) {
            clearTimeout(pollTimer);
            pollTimer = null;
        }
    }

    return {
        items,
        current,
        loading,
        fetchAll,
        fetchOne,
        create,
        rename,
        remove,
        generate,
        startPolling,
        stopPolling,
    };
});
