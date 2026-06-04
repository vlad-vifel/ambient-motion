<template>
    <Dialog :open="open" @update:open="(v) => v && emit('update:open', v)">
        <DialogContent
            class="max-w-sm p-0 gap-0 overflow-hidden"
            :disable-outside-close="true"
            :show-close-button="false"
        >
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>Edit video</DialogTitle>
                <DialogDescription class="sr-only">Dialog</DialogDescription>
            </DialogHeader>

            <div class="px-6 pb-6 flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="text-xs text-muted-foreground">Asset</label>
                    <div
                        class="group relative size-40 rounded-lg overflow-hidden bg-muted cursor-pointer"
                        @click="pickerOpen = true"
                    >
                        <img
                            v-if="selectedAsset"
                            :src="selectedAsset.url"
                            class="size-full object-cover"
                        />
                        <div v-else class="size-full flex items-center justify-center">
                            <ImageIcon class="size-5 text-muted-foreground" />
                        </div>
                        <button
                            class="absolute top-1 right-1 p-1 rounded bg-black/50 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100"
                            title="Change asset"
                            @click.stop="pickerOpen = true"
                        >
                            <Pencil class="size-3" />
                        </button>
                    </div>
                </div>

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

    <AssetPickerDialog
        v-model:open="pickerOpen"
        :initial-asset="selectedAsset"
        @select="selectedAsset = $event"
    />
</template>

<script setup lang="ts">
    import { ImageIcon, Loader2, Pencil } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import AssetPickerDialog from '@/components/AssetPickerDialog.vue';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogDescription,
    } from '@/components/ui/dialog';
    import type { Asset } from '@/stores/assets';
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
    const selectedAsset = ref<Asset | null>(null);
    const pickerOpen = ref(false);
    const submitting = ref(false);

    const canSubmit = computed(() => {
        if (!phrase.value.trim() || submitting.value) return false;
        const phraseChanged = phrase.value.trim() !== props.video?.phrase;
        const assetChanged = selectedAsset.value?.id !== props.video?.assetId;
        return phraseChanged || assetChanged;
    });

    watch(
        () => props.open,
        (v) => {
            if (v && props.video) {
                phrase.value = props.video.phrase;
                selectedAsset.value = props.video.asset
                    ? (props.video.asset as unknown as Asset)
                    : null;
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
            const updates: { phrase?: string; assetId?: string } = {};
            if (phrase.value.trim() !== props.video.phrase) updates.phrase = phrase.value.trim();
            if (selectedAsset.value?.id !== props.video.assetId)
                updates.assetId = selectedAsset.value?.id;
            await videosStore.requeue(props.video.id, updates);
            emit('requeued');
            emit('update:open', false);
        } finally {
            submitting.value = false;
        }
    }
</script>
