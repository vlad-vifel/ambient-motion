<template>
    <div :class="cn('bg-muted rounded-md animate-pulse', props.class)" data-slot="skeleton" />
</template>

<script setup lang="ts">
    import type { HTMLAttributes } from 'vue';
    import { cn } from '@/lib/utils';

    interface SkeletonProps {
        class?: HTMLAttributes['class'];
    }

    const props = defineProps<SkeletonProps>();
</script>
