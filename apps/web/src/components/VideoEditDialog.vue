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

                <template v-if="isRpg">
                    <RpgEntryCard
                        :phrase="phrase"
                        :choice-left="choiceLeft"
                        :choice-right="choiceRight"
                        @update:phrase="phrase = $event"
                        @update:choice-left="choiceLeft = $event"
                        @update:choice-right="choiceRight = $event"
                    />
                </template>
                <template v-else>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs text-muted-foreground">Phrase</label>
                        <input
                            v-model="phrase"
                            class="w-full px-3 py-2 text-sm rounded-md border border-input bg-transparent outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                            placeholder="nothing feels the same now"
                            @keydown.enter="submit"
                        />
                    </div>
                </template>

                <div class="flex items-center justify-between gap-2">
                    <Button
                        v-if="isRpg"
                        size="sm"
                        variant="outline"
                        :disabled="!selectedAsset"
                        @click="settingsOpen = true"
                    >
                        <SlidersHorizontal class="size-3.5 mr-1" />
                        Settings
                    </Button>
                    <span v-else />
                    <div class="flex items-center gap-2">
                        <Button size="sm" variant="ghost" @click="onCancel">Cancel</Button>
                        <Button :disabled="!canSubmit" size="sm" @click="submit">
                            <Loader2 v-if="submitting" class="size-3.5 mr-1 animate-spin" />
                            Recreate video
                        </Button>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>

    <AssetPickerDialog
        v-model:open="pickerOpen"
        :initial-asset="selectedAsset"
        @select="selectedAsset = $event"
    />

    <RpgSettingsDialog
        v-if="isRpg && selectedAsset"
        v-model:open="settingsOpen"
        :image-url="selectedAsset.url"
        :phrase="phrase"
        :choice-left="choiceLeft"
        :choice-right="choiceRight"
        :settings="settings"
        @apply="settings = $event"
    />
</template>

<script setup lang="ts">
    import { ImageIcon, Loader2, Pencil, SlidersHorizontal } from 'lucide-vue-next';
    import { computed, ref, watch } from 'vue';
    import AssetPickerDialog from '@/components/AssetPickerDialog.vue';
    import RpgEntryCard from '@/components/RpgEntryCard.vue';
    import RpgSettingsDialog from '@/components/RpgSettingsDialog.vue';
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
    import { DEFAULT_RPG_SETTINGS, type RpgSettings } from '@/types/rpgSettings';

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
    const choiceLeft = ref('');
    const choiceRight = ref('');
    const selectedAsset = ref<Asset | null>(null);
    const pickerOpen = ref(false);
    const settingsOpen = ref(false);
    const settings = ref<RpgSettings>({ ...DEFAULT_RPG_SETTINGS });
    const submitting = ref(false);

    const isRpg = computed(
        () => props.video?.choiceLeft != null || props.video?.choiceRight != null,
    );

    const settingsChanged = computed(
        () =>
            isRpg.value &&
            JSON.stringify(settings.value) !==
                JSON.stringify(props.video?.settings ?? DEFAULT_RPG_SETTINGS),
    );

    const canSubmit = computed(() => {
        if (!phrase.value.trim() || !selectedAsset.value || submitting.value) return false;
        const phraseChanged = phrase.value.trim() !== props.video?.phrase;
        const assetChanged = selectedAsset.value?.id !== props.video?.assetId;
        const choiceLeftChanged =
            isRpg.value && choiceLeft.value.trim() !== (props.video?.choiceLeft ?? '');
        const choiceRightChanged =
            isRpg.value && choiceRight.value.trim() !== (props.video?.choiceRight ?? '');
        return (
            phraseChanged ||
            assetChanged ||
            choiceLeftChanged ||
            choiceRightChanged ||
            settingsChanged.value
        );
    });

    watch(
        () => props.open,
        (v) => {
            if (v && props.video) {
                phrase.value = props.video.phrase;
                choiceLeft.value = props.video.choiceLeft ?? '';
                choiceRight.value = props.video.choiceRight ?? '';
                settings.value = { ...DEFAULT_RPG_SETTINGS, ...(props.video.settings ?? {}) };
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
            const updates: {
                phrase?: string;
                assetId?: string;
                choiceLeft?: string;
                choiceRight?: string;
                settings?: RpgSettings;
            } = {};
            if (phrase.value.trim() !== props.video.phrase) updates.phrase = phrase.value.trim();
            if (selectedAsset.value?.id !== props.video.assetId)
                updates.assetId = selectedAsset.value?.id;
            if (isRpg.value && choiceLeft.value.trim() !== (props.video.choiceLeft ?? ''))
                updates.choiceLeft = choiceLeft.value.trim();
            if (isRpg.value && choiceRight.value.trim() !== (props.video.choiceRight ?? ''))
                updates.choiceRight = choiceRight.value.trim();
            if (settingsChanged.value) updates.settings = settings.value;
            await videosStore.requeue(props.video.id, updates);
            emit('requeued');
            emit('update:open', false);
        } finally {
            submitting.value = false;
        }
    }
</script>
