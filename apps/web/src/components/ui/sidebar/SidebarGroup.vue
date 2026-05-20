<template>
    <div
        :class="cn('p-2 relative flex w-full min-w-0 flex-col', props.class)"
        data-sidebar="group"
        data-slot="sidebar-group">
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
