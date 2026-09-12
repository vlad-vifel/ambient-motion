<template>
    <div class="flex w-full items-center gap-2">
        <span class="flex-1 text-left">{{ preset.name }}</span>
        <PresetBadge
            :preset-id="preset.id"
            :name="preset.name"
            :format="preset.format"
            :show-name="false"
        />
    </div>
</template>

<script setup lang="ts">
    import PresetBadge from '@/components/shared/PresetBadge.vue';
    import type { PresetOptionProps } from './types';

    defineProps<PresetOptionProps>();
</script>
