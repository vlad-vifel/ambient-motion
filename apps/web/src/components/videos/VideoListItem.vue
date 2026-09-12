<template>
    <div
        class="group flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
        :class="selected && 'bg-muted/50 border-border'"
        @click="selectable ? $emit('toggle-select') : $emit('click')"
    >
        <Checkbox v-if="selectable" :model-value="selected" class="pointer-events-none shrink-0" />
        <div
            class="relative size-9 rounded-md bg-muted shrink-0 overflow-hidden flex items-center justify-center"
        >
            <img
                v-if="video.thumbnailUrl"
                :src="video.thumbnailUrl"
                class="absolute inset-0 size-full object-cover"
            />
            <Loader2
                v-else-if="
                    video.status === VideoStatus.Queued || video.status === VideoStatus.Generating
                "
                class="size-4 text-muted-foreground animate-spin"
            />
            <AlertCircle
                v-else-if="video.status === VideoStatus.Failed"
                class="size-4 text-destructive"
            />
            <Film v-else class="size-4 text-muted-foreground" />
        </div>

        <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ video.title }}</p>
        </div>

        <span v-if="showPreset && video.preset" class="hidden sm:inline-flex">
            <PresetBadge
                :preset-id="video.preset.id"
                :name="video.preset.name"
                :format="video.preset.format"
            />
        </span>

        <span :class="['text-xs px-2 py-0.5 rounded-full shrink-0', statusClass(video.status)]">
            {{ statusLabel(video.status) }}
        </span>

        <div v-if="!selectable" class="hidden items-center gap-0.5 shrink-0 sm:flex">
            <button
                :disabled="!canDownload"
                class="p-1.5 rounded text-muted-foreground transition-colors enabled:hover:bg-muted enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                title="Download"
                @click.stop="downloadVideo"
            >
                <Download class="size-3.5" />
            </button>

            <button
                :disabled="!canEdit"
                class="p-1.5 rounded text-muted-foreground transition-colors enabled:hover:bg-muted enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
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

        <DropdownMenu v-if="!selectable">
            <DropdownMenuTrigger as-child class="sm:hidden" @click.stop>
                <button
                    class="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                    <MoreVertical class="size-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" @click.stop>
                <DropdownMenuItem :disabled="!canEdit" @click="$emit('edit')">
                    <Pencil class="size-4" />
                    Edit phrase
                </DropdownMenuItem>
                <DropdownMenuItem :disabled="!canDownload" @click="downloadVideo">
                    <Download class="size-4" />
                    Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
    import { computed } from 'vue';
    import {
        AlertCircle,
        Download,
        Film,
        Loader2,
        MoreVertical,
        Pencil,
        Trash2,
    } from 'lucide-vue-next';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu';
    import { Checkbox } from '@/components/ui/checkbox';
    import PresetBadge from '@/components/shared/PresetBadge.vue';
    import { downloadVideoFile } from '@/lib/utils';
    import {
        getVideoStatusClass as statusClass,
        getVideoStatusLabel as statusLabel,
    } from './utils';
    import { VideoStatus } from '@/types/video';
    import type { VideoListItemEmits, VideoListItemProps } from './types';

    const props = withDefaults(defineProps<VideoListItemProps>(), {
        selectable: false,
        selected: false,
        showPreset: true,
    });

    defineEmits<VideoListItemEmits>();

    const canDownload = computed(
        () => props.video.status === VideoStatus.Completed && !!props.video.videoUrl,
    );
    const canEdit = computed(
        () =>
            props.video.status === VideoStatus.Completed ||
            props.video.status === VideoStatus.Failed,
    );

    async function downloadVideo() {
        await downloadVideoFile(props.video.id, props.video.title);
    }
</script>
