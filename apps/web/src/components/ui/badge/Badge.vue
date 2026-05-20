<template>
    <Primitive
        :class="cn(badgeVariants({ variant }), props.class)"
        data-slot="badge"
        :data-variant="variant"
        v-bind="delegatedProps"
    >
        <slot />
    </Primitive>
</template>

<script setup lang="ts">
    import { reactiveOmit } from '@vueuse/core';
    import type { PrimitiveProps } from 'reka-ui';
    import { Primitive } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import type { BadgeVariants } from '.';
    import { badgeVariants } from '.';
    import { cn } from '@/lib/utils';

    const props = defineProps<
        PrimitiveProps & {
            variant?: BadgeVariants['variant'];
            class?: HTMLAttributes['class'];
        }
    >();

    const delegatedProps = reactiveOmit(props, 'class');
</script>
