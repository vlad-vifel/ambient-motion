<template>
    <StandardCreateFlow :preset-id="presetId" @step-change="emit('step-change', $event)" />
</template>

<script setup lang="ts">
    import StandardCreateFlow from '@/presets/shared/StandardCreateFlow.vue';
    import type { AmbientMotionCreateProps } from '../types';

    defineProps<AmbientMotionCreateProps>();
    const emit = defineEmits<{
        (event: 'step-change', step: 1 | 2): void;
    }>();
</script>
