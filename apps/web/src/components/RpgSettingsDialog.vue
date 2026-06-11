<template>
    <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
        <DialogContent class="max-w-2xl p-0 gap-0 overflow-hidden" :no-max-width="true">
            <DialogHeader class="px-6 pt-6 pb-4">
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription class="sr-only">RPG dialogue render settings</DialogDescription>
            </DialogHeader>

            <div class="px-6 pb-4 flex flex-col sm:flex-row gap-6">
                <div class="flex justify-center shrink-0">
                    <RpgPreviewCanvas
                        :image-url="imageUrl"
                        :phrase="phrase"
                        :choice-left="choiceLeft"
                        :choice-right="choiceRight"
                        :settings="draft"
                        :width="260"
                    />
                </div>

                <div class="flex-1 flex flex-col gap-4 min-w-0">
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
                            <label class="flex items-center justify-between gap-3 cursor-pointer">
                                <span class="text-sm">Vignette</span>
                                <Checkbox v-model="draft.vignette" />
                            </label>
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
                class="px-6 py-4 border-t border-border/50 flex items-center justify-between gap-2"
            >
                <Button size="sm" variant="ghost" @click="reset">
                    <RotateCcw class="size-3.5 mr-1.5" />
                    Reset
                </Button>
                <div class="flex items-center gap-2">
                    <Button size="sm" variant="ghost" @click="emit('update:open', false)"
                    >Cancel</Button
                    >
                    <Button size="sm" @click="apply">Apply</Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup lang="ts">
    import { RotateCcw } from 'lucide-vue-next';
    import { reactive, watch } from 'vue';
    import RpgPreviewCanvas from '@/components/RpgPreviewCanvas.vue';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
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
    import { DEFAULT_RPG_SETTINGS, type RpgSettings } from '@/types/rpgSettings';

    const props = defineProps<{
        open: boolean;
        imageUrl: string;
        phrase: string;
        choiceLeft: string;
        choiceRight: string;
        settings?: RpgSettings | null;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
        (e: 'apply', settings: RpgSettings): void;
    }>();

    const draft = reactive<RpgSettings>({ ...DEFAULT_RPG_SETTINGS });

    watch(
        () => props.open,
        (v) => {
            if (v) Object.assign(draft, DEFAULT_RPG_SETTINGS, props.settings ?? {});
        },
        { immediate: true },
    );

    function reset() {
        Object.assign(draft, DEFAULT_RPG_SETTINGS);
    }

    function apply() {
        emit('apply', { ...draft });
        emit('update:open', false);
    }
</script>
