<template>
    <BaseLightbox
        :open="open"
        :items="items"
        :initial-index="initialIndex"
        @update:open="emit('update:open', $event)"
    >
        <template #title="{ item }">
            <DialogTitle class="truncate">{{ (item as LightboxVideo).phrase }}</DialogTitle>
        </template>
        <template #media="{ item }">
            <video
                :key="(item as LightboxVideo).src"
                :src="(item as LightboxVideo).src"
                controls
                autoplay
                class="rounded-md"
                style="max-height: calc(95vh - 140px); max-width: 100%; width: auto; height: auto"
            />
        </template>
        <template #footer="{ item }">
            <div class="px-4 pb-4 shrink-0 flex items-center justify-end gap-2">
                <button
                    class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    @click="downloadVideo(item as LightboxVideo)"
                >
                    <Download class="size-3.5" />
                    Download
                </button>
            </div>
        </template>
    </BaseLightbox>
</template>

<script setup lang="ts">
    import { Download } from 'lucide-vue-next';
    import { DialogTitle } from '@/components/ui/dialog';
    import BaseLightbox from './BaseLightbox.vue';

    export interface LightboxVideo {
        src: string;
        phrase: string;
        videoId?: string;
    }

    defineProps<{
        open: boolean;
        items: LightboxVideo[];
        initialIndex?: number;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
    }>();

    async function downloadVideo(item: LightboxVideo) {
        if (!item.videoId) return;
        const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBase}/api/videos/${item.videoId}/download`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${item.phrase}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
</script>
