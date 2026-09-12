<template>
    <img
        :src="icon"
        aria-hidden="true"
        :style="{
            width: `${size}px`,
            height: `${size}px`,
            display: 'block',
            flexShrink: 0,
            transform: 'scaleY(-1)',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.75))',
        }"
    />
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import choiceOIcon from '@/assets/presets/rpg-dialogue/controls/choice-o.svg';
    import choiceXIcon from '@/assets/presets/rpg-dialogue/controls/choice-x.svg';
    import { RpgChoiceIconVariant, type RpgChoiceIconProps } from '../types';

    const props = defineProps<RpgChoiceIconProps>();

    const icon = computed(() =>
        props.variant === RpgChoiceIconVariant.Cross ? choiceXIcon : choiceOIcon,
    );
</script>
