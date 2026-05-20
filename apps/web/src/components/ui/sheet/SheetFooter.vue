<template>
    <div :class="cn('gap-2 p-4 mt-auto flex flex-col', props.class)" data-slot="sheet-footer">
        <slot />
    </div>
</template>

<script setup lang="ts">
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>
