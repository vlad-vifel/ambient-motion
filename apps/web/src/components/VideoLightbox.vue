<template>
    <Dialog :open="open" @update:open="(v) => !v && emit('update:open', false)">
        <DialogContent
            class="max-w-xl p-0 gap-0 overflow-hidden flex flex-col"
            :disable-outside-close="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle class="truncate">{{ phrase }}</DialogTitle>
            </DialogHeader>
            <div class="flex-1 flex items-center justify-center overflow-hidden p-4 pt-1">
                <video
                    v-if="src"
                    :src="src"
                    controls
                    autoplay
                    class="max-w-full max-h-full rounded-md"
                />
            </div>
            <div v-if="src" class="px-4 pb-4 flex items-center justify-end gap-2">
                <button
                    class="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    @click="downloadVideo"
                >
                    <Download class="size-3.5" />
                    Download
                </button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Download } from 'lucide-vue-next';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

    const props = defineProps<{
        open: boolean;
        src: string | null;
        phrase?: string;
        videoId?: string;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
    }>();

    async function downloadVideo() {
        const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBase}/api/videos/${props.videoId}/download`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${props.phrase}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
</script>
