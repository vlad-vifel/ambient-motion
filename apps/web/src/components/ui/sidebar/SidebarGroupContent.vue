<template>
    <div
        :class="cn('text-sm w-full', props.class)"
        data-sidebar="group-content"
        data-slot="sidebar-group-content">
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
