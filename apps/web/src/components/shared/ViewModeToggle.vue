<template>
    <div class="flex gap-1 rounded-md border border-border bg-muted/20 p-0.5">
        <button
            :class="[
                'rounded p-1.5 transition-colors',
                modelValue === ViewMode.List
                    ? 'bg-background text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
            ]"
            title="List view"
            @click="emit('update:modelValue', ViewMode.List)"
        >
            <List class="size-4" />
        </button>
        <button
            :class="[
                'rounded p-1.5 transition-colors',
                modelValue === ViewMode.Grid
                    ? 'bg-background text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
            ]"
            title="Grid view"
            @click="emit('update:modelValue', ViewMode.Grid)"
        >
            <Grid class="size-4" />
        </button>
    </div>
</template>

<script setup lang="ts">
    import { Grid, List } from 'lucide-vue-next';
    import { ViewMode } from '@/types/ui';
    import type { ViewModeToggleProps } from './types';

    defineProps<ViewModeToggleProps>();

    const emit = defineEmits<{
        (event: 'update:modelValue', value: ViewMode): void;
    }>();
</script>
