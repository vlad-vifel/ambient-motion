<template>
    <div :class="cn('gap-1.5 p-4 flex flex-col', props.class)" data-slot="sheet-header">
        <slot />
    </div>
</template>

<script setup lang="ts">
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>
