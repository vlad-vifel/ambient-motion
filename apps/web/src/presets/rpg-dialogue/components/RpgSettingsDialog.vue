<template>
    <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
        <DialogContent fullscreen>
            <DialogHeader class="shrink-0 px-6 pb-4 pt-6">
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription class="sr-only">RPG dialogue render settings</DialogDescription>
            </DialogHeader>

            <div
                class="grid min-h-0 gap-6 overflow-y-auto px-6 pb-4 lg:grid-cols-[minmax(320px,430px)_1fr]"
            >
                <div class="flex flex-col items-center gap-3">
                    <div
                        ref="fullscreenContainer"
                        class="relative flex w-full justify-center"
                        :class="isPreviewFullscreen && 'h-dvh w-dvw items-center bg-black'"
                    >
                        <div
                            class="group relative overflow-hidden bg-black"
                            :style="previewViewportStyle"
                        >
                            <RpgPreviewCanvas
                                :image-url="imageUrl"
                                :phrase="phrase"
                                :choice-left="choiceLeft"
                                :choice-right="choiceRight"
                                :settings="draft"
                                :width="previewWidth"
                            />
                            <Button
                                v-if="!isPreviewFullscreen"
                                size="sm"
                                variant="secondary"
                                class="absolute bottom-3 right-3 z-10 size-9 p-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                title="Fullscreen preview"
                                @click.stop="toggleFullscreen"
                            >
                                <Maximize2 class="size-4" />
                                <span class="sr-only">Fullscreen preview</span>
                            </Button>
                        </div>
                        <Button
                            v-if="isPreviewFullscreen"
                            size="sm"
                            variant="secondary"
                            class="absolute right-5 top-5 z-10 size-10 p-0"
                            title="Exit fullscreen preview"
                            @click.stop="toggleFullscreen"
                        >
                            <X class="size-5" />
                            <span class="sr-only">Exit fullscreen preview</span>
                        </Button>
                    </div>
                </div>

                <div class="flex min-w-0 flex-col gap-5">
                    <div class="flex flex-col gap-2">
                        <span
                            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                        >Image</span
                        >
                        <div class="flex flex-col gap-2.5">
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm">Brightness (%)</label>
                                <NumberField
                                    v-model="draft.brightness"
                                    :min="0"
                                    :max="300"
                                    :step="5"
                                    class="w-28"
                                >
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                        <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm">Contrast (%)</label>
                                <NumberField
                                    v-model="draft.contrast"
                                    :min="0"
                                    :max="300"
                                    :step="5"
                                    class="w-28"
                                >
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                        <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <span
                            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                        >Text</span
                        >
                        <div class="flex flex-col gap-2.5">
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm">Vertical offset</label>
                                <NumberField
                                    v-model="draft.textOffsetY"
                                    :min="-960"
                                    :max="960"
                                    :step="1"
                                    class="w-28"
                                >
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                        <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm">Gap question / options</label>
                                <NumberField
                                    v-model="draft.gapQuestionOptions"
                                    :min="0"
                                    :max="600"
                                    :step="1"
                                    class="w-28"
                                >
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                        <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm">Gap between options</label>
                                <NumberField
                                    v-model="draft.gapOptions"
                                    :min="0"
                                    :max="800"
                                    :step="1"
                                    class="w-28"
                                >
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                        <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <span
                            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                        >Effects</span
                        >
                        <div class="flex flex-col gap-2.5">
                            <button
                                type="button"
                                role="checkbox"
                                :aria-checked="draft.vignette"
                                class="group flex items-center gap-2 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                @click="draft.vignette = !draft.vignette"
                            >
                                <span
                                    :class="[
                                        'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors group-hover:border-primary',
                                        draft.vignette
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input bg-transparent',
                                    ]"
                                >
                                    <Check v-if="draft.vignette" class="size-3" />
                                </span>
                                <span
                                    :class="[
                                        'select-none text-sm leading-none transition-colors',
                                        draft.vignette
                                            ? 'text-foreground'
                                            : 'text-muted-foreground group-hover:text-foreground',
                                    ]"
                                >Vignette</span
                                >
                            </button>
                            <div class="flex items-center justify-between gap-3">
                                <label class="text-sm">Darkening (%)</label>
                                <NumberField
                                    v-model="draft.overlayPercent"
                                    :min="0"
                                    :max="100"
                                    :step="5"
                                    class="w-28"
                                >
                                    <NumberFieldContent>
                                        <NumberFieldDecrement />
                                        <NumberFieldInput />
                                        <NumberFieldIncrement />
                                    </NumberFieldContent>
                                </NumberField>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="flex shrink-0 items-center justify-between gap-2 border-t border-border/50 px-6 py-4"
            >
                <Button size="sm" variant="ghost" :disabled="!hasChanges" @click="reset">
                    <RotateCcw class="size-3.5 mr-1.5" />
                    Reset
                </Button>
                <div class="flex items-center gap-2">
                    <Button size="sm" variant="ghost" @click="emit('update:open', false)"
                    >Cancel</Button
                    >
                    <Button size="sm" :disabled="!hasChanges" @click="apply">Apply</Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { Check, Maximize2, RotateCcw, X } from 'lucide-vue-next';
    import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
    import RpgPreviewCanvas from '@/presets/rpg-dialogue/components/RpgPreviewCanvas.vue';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
    } from '@/components/ui/dialog';
    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput,
    } from '@/components/ui/number-field';
    import {
        DEFAULT_RPG_SETTINGS,
        type RpgSettings,
        type RpgSettingsDialogEmits,
        type RpgSettingsDialogProps,
    } from '@/presets/rpg-dialogue/types';

    const props = defineProps<RpgSettingsDialogProps>();

    const emit = defineEmits<RpgSettingsDialogEmits>();

    const draft = reactive<RpgSettings>({ ...DEFAULT_RPG_SETTINGS });
    const initialSettings = ref<RpgSettings>({ ...DEFAULT_RPG_SETTINGS });
    const fullscreenContainer = ref<HTMLElement | null>(null);
    const isPreviewFullscreen = ref(false);
    const previewScale = ref(0.36);
    let previewResizeObserver: ResizeObserver | undefined;
    const previewWidth = computed(() => Math.max(1, Math.round(1080 * previewScale.value)));
    const previewViewportStyle = computed(() => ({
        width: `${previewWidth.value}px`,
        height: `${Math.round(previewWidth.value * (1920 / 1080))}px`,
    }));
    const hasChanges = computed(
        () => JSON.stringify(draft) !== JSON.stringify(initialSettings.value),
    );

    watch(
        () => props.open,
        (v) => {
            if (!v) return;
            initialSettings.value = { ...DEFAULT_RPG_SETTINGS, ...(props.settings ?? {}) };
            Object.assign(draft, initialSettings.value);
        },
        { immediate: true },
    );

    function reset() {
        Object.assign(draft, initialSettings.value);
    }

    function apply() {
        if (!hasChanges.value) return;
        emit('apply', { ...draft });
        emit('update:open', false);
    }

    function updatePreviewScale() {
        const container = fullscreenContainer.value;
        if (!container) return;
        const width = isPreviewFullscreen.value
            ? container.clientWidth
            : Math.min(container.clientWidth, 390);
        const height = isPreviewFullscreen.value
            ? container.clientHeight
            : Number.POSITIVE_INFINITY;
        previewScale.value = Math.min(width / 1080, height / 1920);
    }

    function syncFullscreenState() {
        isPreviewFullscreen.value = document.fullscreenElement === fullscreenContainer.value;
        void nextTick(updatePreviewScale);
    }

    async function toggleFullscreen() {
        await nextTick();
        const container = fullscreenContainer.value;
        if (!container) return;
        if (document.fullscreenElement === container) await document.exitFullscreen();
        else await container.requestFullscreen();
    }

    watch(
        () => props.open,
        async (open) => {
            previewResizeObserver?.disconnect();
            if (!open) return;
            await nextTick();
            updatePreviewScale();
            if (fullscreenContainer.value) {
                previewResizeObserver = new ResizeObserver(updatePreviewScale);
                previewResizeObserver.observe(fullscreenContainer.value);
            }
        },
    );

    onMounted(() => document.addEventListener('fullscreenchange', syncFullscreenState));
    onUnmounted(() => {
        document.removeEventListener('fullscreenchange', syncFullscreenState);
        previewResizeObserver?.disconnect();
    });
</script>
