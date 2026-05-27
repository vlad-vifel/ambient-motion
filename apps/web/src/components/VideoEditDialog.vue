<template>
    <Dialog :open="open" @update:open="(v) => v && emit('update:open', v)">
        <DialogContent
            class="max-w-sm p-0 gap-0 overflow-hidden"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>Edit phrase</DialogTitle>
                <DialogDescription class="sr-only">Dialog</DialogDescription>
            </DialogHeader>

            <div class="px-6 pb-6 flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-muted-foreground">Phrase</label>
                    <input
                        v-model="phrase"
                        class="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                        placeholder="nothing feels the same now"
                        @keydown.enter="submit"
                    />
                </div>

                <div class="flex items-center justify-end gap-2">
                    <Button size="sm" variant="ghost" @click="onCancel">Cancel</Button>
                    <Button :disabled="!canSubmit" size="sm" @click="submit">
                        <Loader2 v-if="submitting" class="size-3.5 mr-1.5 animate-spin" />
                        Recreate video
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Loader2 } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog';
    import { useVideosStore } from '@/stores/videos';
    import type { Video } from '@/types/video';

    const props = defineProps<{
        open: boolean;
        video?: Video | null;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
        (e: 'requeued'): void;
    }>();

    const videosStore = useVideosStore();
    const phrase = ref('');
    const submitting = ref(false);

    const canSubmit = computed(
        () =>
            phrase.value.trim().length > 0 &&
            phrase.value.trim() !== props.video?.phrase &&
            !submitting.value,
    );

    watch(
        () => props.open,
        (v) => {
            if (v && props.video) {
                phrase.value = props.video.phrase;
            }
        },
        { immediate: true },
    );

    function onCancel() {
        emit('update:open', false);
    }

    async function submit() {
        if (!canSubmit.value || !props.video) return;
        submitting.value = true;
        try {
            await videosStore.requeue(props.video.id, phrase.value.trim());
            emit('requeued');
            emit('update:open', false);
        } finally {
            submitting.value = false;
        }
    }
</script>
