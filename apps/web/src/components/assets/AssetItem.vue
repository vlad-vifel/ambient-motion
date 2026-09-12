<template>
    <div
        v-if="viewMode === ViewMode.List"
        class="group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
        :class="selectionMode && selected && 'border-border bg-muted/50'"
        @click="selectionMode ? emit('select') : emit('preview')"
    >
        <Checkbox
            v-if="selectionMode"
            :model-value="selected"
            class="pointer-events-none shrink-0"
        />
        <div class="size-9 shrink-0 overflow-hidden rounded-md bg-muted">
            <img :src="asset.url" class="size-full object-cover" />
        </div>
        <p class="min-w-0 flex-1 truncate text-sm font-medium">{{ asset.filename }}</p>
        <div class="flex shrink-0 items-center gap-2">
            <Badge v-if="asset.isUsed" variant="secondary" class="text-xs">used</Badge>
            <span class="text-xs text-muted-foreground">{{ formatFileSize(asset.size) }}</span>
        </div>
        <div v-if="!selectionMode" class="flex shrink-0 items-center gap-1">
            <button class="item-action" title="Rename" @click.stop="emit('edit')">
                <Pencil class="size-3.5" />
            </button>
            <button class="item-delete-action" title="Delete" @click.stop="emit('delete')">
                <Trash2 class="size-3.5" />
            </button>
        </div>
        <DropdownMenu v-if="!selectionMode">
            <DropdownMenuTrigger as-child class="sm:hidden" @click.stop
            ><button class="item-action"><MoreVertical class="size-4" /></button
            ></DropdownMenuTrigger>
            <DropdownMenuContent align="end" @click.stop>
                <DropdownMenuItem @click="emit('edit')"
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
    <div
        v-else
        class="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted"
        :class="selectionMode && selected && 'ring-2 ring-primary'"
        @click="selectionMode ? emit('select') : emit('preview')"
    >
        <img :src="asset.url" class="size-full object-cover bg-muted" />
        <div v-if="selectionMode" class="absolute left-2 top-2 z-10">
            <Checkbox :model-value="selected" class="pointer-events-none bg-background/80" />
        </div>
        <div
            class="absolute inset-0 flex flex-col justify-end p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            :style="{ background: 'linear-gradient(to top, rgba(0, 0, 0, 0.75), transparent 35%)' }"
        >
            <p class="truncate text-xs leading-snug text-white">{{ asset.filename }}</p>
        </div>
        <div v-if="asset.isUsed" class="absolute left-2 top-2 flex">
            <Badge variant="secondary" class="text-xs">used</Badge>
        </div>
        <div
            v-if="!selectionMode"
            class="absolute right-2 top-2 hidden gap-0.5 sm:group-hover:flex"
        >
            <button class="item-action grid-action" title="Rename" @click.stop="emit('edit')">
                <Pencil class="size-3.5" />
            </button>
            <button
                class="item-delete-action grid-action"
                title="Delete"
                @click.stop="emit('delete')"
            >
                <Trash2 class="size-3.5" />
            </button>
        </div>
        <div v-if="!selectionMode" class="absolute right-2 top-2 sm:hidden" @click.stop>
            <DropdownMenu>
                <DropdownMenuTrigger as-child
                ><button class="rounded bg-muted p-1 text-foreground">
                    <MoreVertical class="size-3.5" /></button
                ></DropdownMenuTrigger>
                <DropdownMenuContent align="end" @click.stop>
                    <DropdownMenuItem @click="emit('edit')"
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
    import { MoreVertical, Pencil, Trash2 } from 'lucide-vue-next';
    import { Badge } from '@/components/ui/badge';
    import { Checkbox } from '@/components/ui/checkbox';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu';
    import { ViewMode } from '@/types/ui';
    import type { AssetItemProps } from './types';
    import { formatFileSize } from './utils';

    defineProps<AssetItemProps>();

    const emit = defineEmits<{
        (event: 'select'): void;
        (event: 'preview'): void;
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
    .group:hover .grid-action {
        background-color: color-mix(in oklab, var(--muted) 50%, transparent);
    }
</style>
