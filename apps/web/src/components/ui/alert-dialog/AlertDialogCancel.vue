<script setup lang="ts">
    import { reactiveOmit } from '@vueuse/core';
    import type { AlertDialogCancelProps } from 'reka-ui';
    import { AlertDialogCancel } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import type { ButtonVariants } from '@/components/ui/button';
    import { buttonVariants } from '@/components/ui/button';
    import { cn } from '@/lib/utils';

    const props = withDefaults(
        defineProps<
            AlertDialogCancelProps & {
                class?: HTMLAttributes['class'];
                variant?: ButtonVariants['variant'];
                size?: ButtonVariants['size'];
            }
        >(),
        {
            variant: 'outline' as ButtonVariants['variant'],
            size: 'sm' as ButtonVariants['size'],
            class: undefined,
        },
    );

    const emit = defineEmits<{
        click: [MouseEvent];
    }>();

    const delegatedProps = reactiveOmit(props, 'class', 'variant', 'size');
</script>

<template>
    <AlertDialogCancel
        v-bind="delegatedProps"
        :class="cn('', buttonVariants({ variant, size }), props.class)"
        data-slot="alert-dialog-cancel"
        @click="emit('click', $event)"
    >
        <slot />
    </AlertDialogCancel>
</template>
