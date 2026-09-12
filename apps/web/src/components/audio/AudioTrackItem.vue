<template>
    <div
        v-if="viewMode === ViewMode.List"
        class="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40 sm:cursor-auto"
        :class="[selectionMode && 'cursor-pointer! border-border', selected && 'bg-muted/50']"
        @click="selectionMode ? emit('select') : emit('activate')"
    >
        <Checkbox
            v-if="selectionMode"
            :model-value="selected"
            class="pointer-events-none shrink-0"
        />
        <button
            class="group/cover relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
            @click.stop="selectionMode ? emit('select') : emit('play')"
        >
            <img
                v-if="track.coverUrl"
                class="absolute inset-0 size-full object-cover"
                :src="track.coverUrl"
            />
            <Music
                v-else
                class="size-4 text-muted-foreground transition-all duration-150 sm:group-hover/cover:text-transparent"
            />
            <span
                class="absolute inset-0 hidden items-center justify-center rounded-md bg-black/30 opacity-0 transition-opacity duration-150 sm:flex group-hover/cover:opacity-100"
            ><Pause v-if="isPlaying" class="size-3.5 fill-white text-white" /><Play
                v-else
                class="size-3.5 translate-x-px fill-white text-white"
            /></span>
        </button>
        <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ track.title }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ track.artist || '—' }}</p>
        </div>
        <a
            v-if="track.sourceType === AudioSourceType.Spotify && track.sourceUrl"
            :href="track.sourceUrl"
            target="_blank"
            rel="noopener"
            class="inline-flex h-5 shrink-0 cursor-pointer items-center rounded-full bg-emerald-500/10 px-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
            title="Open in Spotify"
            @click.stop
        >Spotify</a
        >
        <span class="shrink-0 text-xs text-muted-foreground">{{
            formatAudioDuration(track.duration)
        }}</span>
        <div v-if="!selectionMode" class="flex shrink-0 items-center gap-1">
            <button class="item-action" title="Edit" @click.stop="emit('edit')">
                <Pencil class="size-3.5" /></button
            ><button class="item-delete-action" title="Delete" @click.stop="emit('delete')">
                <Trash2 class="size-3.5" />
            </button>
        </div>
        <DropdownMenu v-if="!selectionMode"
        ><DropdownMenuTrigger as-child class="sm:hidden" @click.stop
        ><button class="item-action">
            <MoreVertical class="size-4" /></button></DropdownMenuTrigger
        ><DropdownMenuContent align="end" @click.stop
        ><DropdownMenuItem @click="emit('edit')"
        ><Pencil class="size-3.5" />Edit</DropdownMenuItem
        ><DropdownMenuSeparator /><DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="emit('delete')"
        ><Trash2 class="size-3.5" />Delete</DropdownMenuItem
        ></DropdownMenuContent
        ></DropdownMenu
        >
    </div>
    <div
        v-else
        class="group flex cursor-pointer flex-col gap-2 rounded-lg border border-transparent bg-muted/20 p-3 transition-colors hover:bg-muted/40 sm:cursor-auto"
        :class="selectionMode && selected && 'border-border bg-muted/50'"
        @click="selectionMode ? emit('select') : emit('activate')"
    >
        <button
            class="group/cover relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-muted"
            @click.stop="selectionMode ? emit('select') : emit('play')"
        >
            <Checkbox
                v-if="selectionMode"
                :model-value="selected"
                class="pointer-events-none absolute left-2 top-2 z-10 bg-background/80"
            />
            <img
                v-if="track.coverUrl"
                class="absolute inset-0 size-full object-cover"
                :src="track.coverUrl"
            />
            <Music
                v-else
                class="size-8 text-muted-foreground transition-all duration-150 sm:group-hover/cover:text-transparent"
            />
            <span
                class="absolute inset-0 hidden items-center justify-center rounded-md bg-black/30 opacity-0 transition-opacity duration-150 sm:flex group-hover/cover:opacity-100"
            ><Pause v-if="isPlaying" class="size-6 fill-white text-white" /><Play
                v-else
                class="size-6 translate-x-px fill-white text-white"
            /></span>
        </button>
        <div class="min-w-0 space-y-1">
            <div class="flex min-w-0 items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{{ track.title }}</p>
                    <p class="truncate text-xs text-muted-foreground">{{ track.artist || '—' }}</p>
                </div>
                <span class="shrink-0 text-xs text-muted-foreground">{{
                    formatAudioDuration(track.duration)
                }}</span>
            </div>
            <div class="flex min-h-7 items-center justify-between gap-2">
                <a
                    v-if="track.sourceType === AudioSourceType.Spotify && track.sourceUrl"
                    :href="track.sourceUrl"
                    target="_blank"
                    rel="noopener"
                    class="inline-flex h-5 cursor-pointer items-center rounded-full bg-emerald-500/10 px-2 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                    title="Open in Spotify"
                    @click.stop
                >Spotify</a
                ><span v-else />
                <div v-if="!selectionMode" class="flex shrink-0 items-center gap-0.5">
                    <button class="item-action" title="Edit" @click.stop="emit('edit')">
                        <Pencil class="size-3.5" /></button
                    ><button class="item-delete-action" title="Delete" @click.stop="emit('delete')">
                        <Trash2 class="size-3.5" />
                    </button>
                </div>
                <DropdownMenu v-if="!selectionMode"
                ><DropdownMenuTrigger as-child class="sm:hidden" @click.stop
                ><button class="rounded bg-muted p-1 text-foreground">
                    <MoreVertical class="size-3.5" /></button></DropdownMenuTrigger
                ><DropdownMenuContent align="end" @click.stop
                ><DropdownMenuItem @click="emit('edit')"
                ><Pencil class="size-3.5" />Edit</DropdownMenuItem
                ><DropdownMenuSeparator /><DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click="emit('delete')"
                ><Trash2 class="size-3.5" />Delete</DropdownMenuItem
                ></DropdownMenuContent
                ></DropdownMenu
                >
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { MoreVertical, Music, Pause, Pencil, Play, Trash2 } from 'lucide-vue-next';
    import { Checkbox } from '@/components/ui/checkbox';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu';
    import { AudioSourceType } from '@/types/audio';
    import { ViewMode } from '@/types/ui';
    import type { AudioTrackItemProps } from './types';
    import { formatAudioDuration } from './utils';

    defineProps<AudioTrackItemProps>();
    const emit = defineEmits<{
        (event: 'select'): void;
        (event: 'activate'): void;
        (event: 'play'): void;
        (event: 'edit'): void;
        (event: 'delete'): void;
    }>();
</script>

<style scoped>
    .item-action,
    .item-delete-action {
        border-radius: 0.25rem;
        padding: 0.375rem;
        color: var(--muted-foreground);
        transition:
            color 150ms,
            background-color 150ms;
    }
    .item-action:hover {
        background-color: var(--muted);
        color: var(--foreground);
    }
    .item-delete-action:hover {
        background-color: color-mix(in oklab, var(--destructive) 10%, transparent);
        color: var(--destructive);
    }
</style>
