<template>
    <Badge
        variant="ghost"
        :class="[
            'preset-badge flex items-center gap-1 shrink-0 border-0',
            `preset-badge--${accent}`,
        ]"
    >
        <span v-if="showName">{{ name }}</span>
        <component :is="formatIcon" v-if="formatIcon" class="size-3" />
        <span v-if="format">{{ formatLabel }}</span>
    </Badge>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { Badge } from '@/components/ui/badge';
    import { getPresetDefinition } from '@/presets/registry';
    import { formatIcons, formatLabels } from '@/lib/presetFormat';
    import { PresetAccent } from '@/presets/types';
    import type { PresetBadgeProps } from './types';

    const props = withDefaults(defineProps<PresetBadgeProps>(), {
        showName: true,
    });

    const accent = computed(
        () => getPresetDefinition(props.presetId)?.accent ?? PresetAccent.Default,
    );
    const formatIcon = computed(() => (props.format ? formatIcons[props.format] : undefined));
    const formatLabel = computed(() =>
        props.format ? (formatLabels[props.format] ?? props.format) : '',
    );
</script>

<style scoped>
    .preset-badge--ambient {
        border-color: color-mix(in oklab, rgb(56 189 248) 35%, transparent);
        background-color: color-mix(in oklab, rgb(56 189 248) 10%, transparent);
        color: rgb(125 211 252);
    }

    .preset-badge--dialogue {
        border-color: color-mix(in oklab, rgb(251 146 60) 35%, transparent);
        background-color: color-mix(in oklab, rgb(251 146 60) 10%, transparent);
        color: rgb(253 186 116);
    }

    .preset-badge--music {
        border-color: color-mix(in oklab, rgb(167 139 250) 35%, transparent);
        background-color: color-mix(in oklab, rgb(167 139 250) 10%, transparent);
        color: rgb(196 181 253);
    }
</style>
