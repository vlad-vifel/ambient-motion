<template>
    <div
        v-if="viewMode === ViewMode.List"
        class="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
        @click="!selectionMode && emit('open')"
    >
        <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/60">
            <FolderIcon class="size-4 text-muted-foreground" />
        </div>
        <p class="min-w-0 flex-1 truncate text-sm font-medium">{{ folder.name }}</p>
        <div class="flex shrink-0 items-center gap-1">
            <button class="item-action" title="Rename" @click.stop="emit('rename')">
                <Pencil class="size-3.5" />
            </button>
            <button class="item-delete-action" title="Delete" @click.stop="emit('delete')">
                <Trash2 class="size-3.5" />
            </button>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger as-child class="sm:hidden" @click.stop>
                <button class="item-action"><MoreVertical class="size-4" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" @click.stop>
                <DropdownMenuItem @click="emit('rename')"
                ><Pencil class="size-3.5" />Rename</DropdownMenuItem
                >
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click="emit('delete')"
                >
                    <Trash2 class="size-3.5" />Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
    <div
        v-else
        class="group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
        @click="!selectionMode && emit('open')"
    >
        <FolderIcon class="size-8 text-muted-foreground" />
        <p class="w-full truncate text-center text-xs font-medium">{{ folder.name }}</p>
        <div class="absolute right-2 top-2 hidden gap-0.5 sm:group-hover:flex">
            <button class="item-action" title="Rename" @click.stop="emit('rename')">
                <Pencil class="size-3.5" />
            </button>
            <button class="item-delete-action" title="Delete" @click.stop="emit('delete')">
                <Trash2 class="size-3.5" />
            </button>
        </div>
        <div class="absolute right-2 top-2 sm:hidden" @click.stop>
            <DropdownMenu>
                <DropdownMenuTrigger as-child
                ><button class="rounded bg-muted p-1 text-foreground">
                    <MoreVertical class="size-3.5" /></button
                ></DropdownMenuTrigger>
                <DropdownMenuContent align="end" @click.stop>
                    <DropdownMenuItem @click="emit('rename')"
                    ><Pencil class="size-3.5" />Rename</DropdownMenuItem
                    >
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        class="text-destructive focus:text-destructive"
                        @click="emit('delete')"
                    ><Trash2 class="size-3.5" />Delete</DropdownMenuItem
                    >
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Folder as FolderIcon, MoreVertical, Pencil, Trash2 } from 'lucide-vue-next';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu';
    import { ViewMode } from '@/types/ui';
    import type { AssetFolderItemProps } from './types';

    defineProps<AssetFolderItemProps>();

    const emit = defineEmits<{
        (event: 'open'): void;
        (event: 'rename'): void;
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
