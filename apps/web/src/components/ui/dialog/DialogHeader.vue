<template>
    <div :class="cn('gap-2 flex flex-col', props.class)" data-slot="dialog-header">
        <slot />
    </div>
</template>

<script setup lang="ts">
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    const props = defineProps<{
        class?: HTMLAttributes['class'];
    }>();
</script>
