<template>
    <DialogPortal>
        <DialogOverlay />
        <DialogContent
            v-bind="{ ...$attrs, ...forwarded }"
            :class="
                cn(
                    'bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-6 rounded-xl p-6 text-sm ring-1 duration-100 sm:max-w-md fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none',
                    props.class,
                )
            "
            data-slot="dialog-content"
            @interact-outside="(e: any) => handleInteractOutside(e)"
            @pointer-down-outside="(e: any) => handlePointerDownOutside(e)"
        >
            <slot />

            <DialogClose v-if="showCloseButton" as-child data-slot="dialog-close">
                <Button class="absolute top-4 right-4" size="icon-sm" variant="ghost">
                    <XIcon />
                    <span class="sr-only">Close</span>
                </Button>
            </DialogClose>
        </DialogContent>
    </DialogPortal>
</template>

<script setup lang="ts">
    import { reactiveOmit } from '@vueuse/core';
    import { XIcon } from 'lucide-vue-next';
    import type { DialogContentEmits, DialogContentProps } from 'reka-ui';
    import { DialogClose, DialogContent, DialogPortal, useForwardPropsEmits } from 'reka-ui';
    import type { HTMLAttributes } from 'vue';
    import DialogOverlay from './DialogOverlay.vue';
    import { Button } from '@/components/ui/button';
    import { cn } from '@/lib/utils';

    defineOptions({
        inheritAttrs: false,
    });

    const props = withDefaults(
        defineProps<
            DialogContentProps & {
                class?: HTMLAttributes['class'];
                showCloseButton?: boolean;
                disableOutsideClose?: boolean;
            }
        >(),
        {
            class: undefined,
            showCloseButton: true,
            disableOutsideClose: false,
        },
    );
    const emits = defineEmits<
        DialogContentEmits & { interactOutside: [e: Event]; pointerDownOutside: [e: Event] }
    >();

    const delegatedProps = reactiveOmit(props, 'class', 'disableOutsideClose');

    const forwarded = useForwardPropsEmits(delegatedProps, emits);

    function handleInteractOutside(e: Event) {
        if (props.disableOutsideClose) {
            e.preventDefault();
            return;
        }
        emits('interactOutside', e);
    }

    function handlePointerDownOutside(e: Event) {
        if (props.disableOutsideClose) {
            e.preventDefault();
            return;
        }
        emits('pointerDownOutside', e);
    }
</script>
