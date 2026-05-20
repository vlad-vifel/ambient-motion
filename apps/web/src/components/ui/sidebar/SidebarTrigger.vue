<template>
    <Button
        :class="cn('', props.class)"
        data-sidebar="trigger"
        data-slot="sidebar-trigger"
        size="icon-sm"
        variant="ghost"
        @click="toggleSidebar"
    >
        <PanelLeftIcon class="cn-rtl-flip" />
        <span class="sr-only">Toggle Sidebar</span>
    </Button>
</template>

<script setup lang="ts">
    import { PanelLeftIcon } from 'lucide-vue-next';
    import type { HTMLAttributes } from 'vue';
    import { useSidebar } from './utils';
    import { Button } from '@/components/ui/button';
    import { cn } from '@/lib/utils';

    const props = defineProps<{
        class?: HTMLAttributes['class'];
    }>();

    const { toggleSidebar } = useSidebar();
</script>
