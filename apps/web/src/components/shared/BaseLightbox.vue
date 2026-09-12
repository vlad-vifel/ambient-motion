<template>
    <Dialog :open="open" @update:open="(v) => !v && emit('update:open', false)">
        <DialogContent class="max-w-xl p-0 gap-0 flex flex-col max-h-[95vh]" :no-max-width="true">
            <DialogHeader class="px-6 pt-6 pb-4 shrink-0">
                <slot name="title" :item="current" />
                <DialogDescription v-if="items.length > 1" class="text-xs">
                    {{ currentIndex + 1 }} / {{ items.length }}
                </DialogDescription>
                <DialogDescription v-else class="sr-only">Preview</DialogDescription>
            </DialogHeader>

            <div
                class="flex items-center justify-center overflow-hidden p-4 pt-1 relative flex-1 min-h-0 h-0"
            >
                <button
                    v-if="currentIndex > 0"
                    class="sm:hidden absolute left-5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors z-10"
                    @click.stop="prev"
                >
                    <ChevronLeft class="size-4" />
                </button>

                <slot name="media" :item="current" />

                <button
                    v-if="currentIndex < items.length - 1"
                    class="sm:hidden absolute right-5 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors z-10"
                    @click.stop="next"
                >
                    <ChevronRight class="size-4" />
                </button>
            </div>

            <slot name="footer" :item="current" />

            <button
                v-if="items.length > 1 && currentIndex > 0"
                class="hidden sm:flex absolute -left-11 top-1/2 -translate-y-1/2 size-8 rounded-full bg-zinc-900 border border-white/10 items-center justify-center text-white transition-colors hover:bg-zinc-800"
                @click="prev"
            >
                <ChevronLeft class="size-4" />
            </button>
            <button
                v-if="items.length > 1 && currentIndex < items.length - 1"
                class="hidden sm:flex absolute -right-11 top-1/2 -translate-y-1/2 size-8 rounded-full bg-zinc-900 border border-white/10 items-center justify-center text-white transition-colors hover:bg-zinc-800"
                @click="next"
            >
                <ChevronRight class="size-4" />
            </button>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { Dialog, DialogContent, DialogDescription, DialogHeader } from '@/components/ui/dialog';

    const props = defineProps<{
        open: boolean;
        items: { src: string }[];
        initialIndex?: number;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
    }>();

    const currentIndex = ref(0);

    const current = computed(() => props.items[currentIndex.value] ?? null);

    watch(
        () => props.open,
        (v) => {
            if (v) currentIndex.value = props.initialIndex ?? 0;
        },
    );

    watch(
        () => props.initialIndex,
        (idx) => {
            if (props.open && idx !== undefined) currentIndex.value = idx;
        },
    );

    function prev() {
        if (currentIndex.value > 0) currentIndex.value--;
    }

    function next() {
        if (currentIndex.value < props.items.length - 1) currentIndex.value++;
    }

    function onKeydown(e: KeyboardEvent) {
        if (!props.open) return;
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
    }

    watch(
        () => props.open,
        (v) => {
            if (v) window.addEventListener('keydown', onKeydown);
            else window.removeEventListener('keydown', onKeydown);
        },
    );
</script>
