<template>
    <div
        class="group flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
        @click="$emit('click')"
    >
        <div
            class="relative size-9 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center"
        >
            <img
                v-if="video.thumbnailUrl"
                :src="video.thumbnailUrl"
                class="absolute inset-0 size-full object-cover"
            />
            <Loader2
                v-else-if="video.status === 'QUEUED' || video.status === 'GENERATING'"
                class="size-4 text-muted-foreground animate-spin"
            />
            <AlertCircle v-else-if="video.status === 'FAILED'" class="size-4 text-destructive" />
            <Film v-else class="size-4 text-muted-foreground" />
        </div>

        <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ video.phrase }}</p>
        </div>

        <span :class="['text-xs px-2 py-0.5 rounded-full shrink-0', statusClass(video.status)]">
            {{ statusLabel(video.status) }}
        </span>

        <div
            v-if="video.status !== 'QUEUED' && video.status !== 'GENERATING'"
            class="hidden sm:group-hover:flex items-center gap-0.5 shrink-0"
        >
            <button
                v-if="video.status === 'COMPLETED' && video.videoUrl"
                class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Download"
                @click.stop="downloadVideo"
            >
                <Download class="size-3.5" />
            </button>

            <button
                v-if="video.status === 'COMPLETED'"
                class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Edit"
                @click.stop="$emit('edit')"
            >
                <Pencil class="size-3.5" />
            </button>

            <button
                class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete"
                @click.stop="$emit('delete')"
            >
                <Trash2 class="size-3.5" />
            </button>
        </div>

        <DropdownMenu>
            <DropdownMenuTrigger as-child class="sm:hidden" @click.stop>
                <button
                    class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                    <MoreVertical class="size-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" @click.stop>
                <DropdownMenuItem v-if="video.status === 'COMPLETED'" @click="$emit('edit')">
                    <Pencil class="size-4" />
                    Edit phrase
                </DropdownMenuItem>
                <DropdownMenuItem
                    v-if="video.status === 'COMPLETED' && video.videoUrl"
                    @click="downloadVideo"
                >
                    <Download class="size-4" />
                    Download
                </DropdownMenuItem>
                <DropdownMenuSeparator v-if="video.status === 'COMPLETED'" />
                <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click="$emit('delete')"
                >
                    <Trash2 class="size-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
</template>

<script setup lang="ts">
    import {
        AlertCircle,
        Download,
        Film,
        Loader2,
        MoreVertical,
        Pencil,
        Trash2,
    } from 'lucide-vue-next';
    import type { Video } from '@/types/video';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu';

    const props = defineProps<{
        video: Video;
    }>();

    defineEmits<{
        click: [];
        delete: [];
        edit: [];
    }>();

    function statusClass(status: string) {
        const map: Record<string, string> = {
            QUEUED: 'bg-muted text-muted-foreground',
            GENERATING: 'bg-blue-500/15 text-blue-400',
            COMPLETED: 'bg-emerald-500/15 text-emerald-400',
            FAILED: 'bg-destructive/15 text-destructive',
        };
        return map[status] ?? 'bg-muted text-muted-foreground';
    }

    function statusLabel(status: string) {
        const map: Record<string, string> = {
            QUEUED: 'queued',
            GENERATING: 'creating',
            COMPLETED: 'done',
            FAILED: 'failed',
        };
        return map[status] ?? status.toLowerCase();
    }

    async function downloadVideo() {
        const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiBase}/api/videos/${props.video.id}/download`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${props.video.phrase}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
</script>
