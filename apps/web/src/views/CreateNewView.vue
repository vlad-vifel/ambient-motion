<template>
    <div class="flex flex-col gap-6 max-w-xl mx-auto w-full">
        <div v-if="!ready" class="flex items-center justify-center h-64">
            <Loader2 class="size-6 text-muted-foreground animate-spin" />
        </div>
        <template v-else-if="step === 1">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 class="text-xl font-semibold">Create videos</h2>
                    <p class="text-sm text-muted-foreground mt-0.5">
                        Configure your generation session
                    </p>
                </div>
            </div>

            <div class="flex flex-col gap-1.5">
                <label class="text-xs text-muted-foreground">Style preset</label>
                <Select v-model="form.presetId">
                    <SelectTrigger>
                        <SelectValue as-child>
                            <div v-if="selectedPreset" class="flex items-center gap-2 w-full">
                                <span class="flex-1 flex justify-items-start">{{
                                    selectedPreset.name
                                }}</span>
                                <Badge variant="secondary" class="flex items-center gap-1 shrink-0">
                                    <component
                                        :is="formatIcons[selectedPreset.format]"
                                        class="size-3"
                                    />
                                    <span>{{ formatLabels[selectedPreset.format] }}</span>
                                </Badge>
                            </div>
                            <span v-else class="text-muted-foreground">Select a preset</span>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="preset in presetsStore.items"
                            :key="preset.id"
                            :value="preset.id"
                        >
                            <div class="flex items-center gap-2 w-full">
                                <span class="flex-1 flex justify-items-start">{{
                                    preset.name
                                }}</span>
                                <Badge variant="secondary" class="flex items-center gap-1 shrink-0">
                                    <component :is="formatIcons[preset.format]" class="size-3" />
                                    <span>{{ formatLabels[preset.format] }}</span>
                                </Badge>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div v-if="form.presetId" class="flex flex-col gap-1.5">
                <label class="text-xs text-muted-foreground">Audio track</label>
                <Select v-model="form.audioId">
                    <SelectTrigger
                        class="p-2 h-auto! border border-border bg-muted/20 hover:bg-muted/40"
                    >
                        <SelectValue as-child>
                            <div v-if="selectedAudio" class="w-full flex gap-3!">
                                <div
                                    class="size-8 rounded-md bg-muted shrink-0 flex items-center justify-center overflow-hidden"
                                >
                                    <img
                                        v-if="selectedAudio.coverUrl"
                                        :src="selectedAudio.coverUrl"
                                        class="size-full object-cover"
                                    />
                                    <Music v-else class="size-3.5 text-muted-foreground" />
                                </div>
                                <div class="flex-1 flex flex-col items-start gap-0.5">
                                    <span class="text-sm font-medium leading-none truncate">
                                        {{ selectedAudio.title }}
                                    </span>
                                    <span
                                        class="text-xs text-muted-foreground leading-none truncate"
                                    >
                                        {{ selectedAudio.artist }}
                                    </span>
                                </div>
                                <span class="text-xs text-muted-foreground shrink-0">{{
                                    formatDuration(selectedAudio.duration)
                                }}</span>
                            </div>
                            <span v-else-if="noAudio">No audio</span>
                            <span v-else class="text-muted-foreground">Select an audio track</span>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-if="isRpgPreset" :value="NO_AUDIO">
                            <div class="flex items-center gap-3">
                                <div
                                    class="size-8 rounded-md bg-muted shrink-0 flex items-center justify-center"
                                >
                                    <VolumeX class="size-3.5 text-muted-foreground" />
                                </div>
                                <span class="text-sm font-medium leading-none">No audio</span>
                            </div>
                        </SelectItem>
                        <SelectItem
                            v-for="track in audioStore.items"
                            :key="track.id"
                            :value="track.id"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="size-8 rounded-md bg-muted shrink-0 flex items-center justify-center overflow-hidden"
                                >
                                    <img
                                        v-if="track.coverUrl"
                                        :src="track.coverUrl"
                                        class="size-full object-cover"
                                    />
                                    <Music v-else class="size-3.5 text-muted-foreground" />
                                </div>
                                <div class="flex-1 flex flex-col items-start gap-0.5">
                                    <span class="text-sm font-medium leading-none truncate">
                                        {{ track.title }}
                                    </span>
                                    <span
                                        class="text-xs text-muted-foreground! leading-none truncate"
                                    >
                                        {{ track.artist }}
                                    </span>
                                </div>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
                <MiniAudioPlayer
                    v-if="selectedAudio?.url"
                    :key="selectedAudio.id"
                    :src="selectedAudio.url"
                    :duration-ms="selectedAudio.duration"
                />

                <div v-if="noAudio" class="flex items-center justify-between gap-3 mt-1">
                    <label class="text-sm text-muted-foreground">Video length (seconds)</label>
                    <NumberField
                        v-model="noAudioSeconds"
                        :min="1"
                        :max="300"
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

            <div v-if="form.audioId && !isRpgPreset" class="flex flex-col gap-1.5">
                <label class="text-xs text-muted-foreground">Fade in / out</label>
                <div
                    class="flex items-center gap-2 px-2 py-3 rounded-md border border-border bg-muted/30"
                >
                    <span
                        class="text-xs text-muted-foreground tabular-nums w-7 text-right shrink-0"
                    >
                        {{ formatDuration(fadeRange[0]) }}
                    </span>
                    <Slider
                        class="flex-1"
                        :min="0"
                        :max="selectedAudio ? selectedAudio.duration : 60000"
                        :step="100"
                        :model-value="fadeRange"
                        @update:model-value="(v) => v && (fadeRange = v as [number, number])"
                    />
                    <span class="text-xs text-muted-foreground tabular-nums w-7 shrink-0">
                        {{ formatDuration(fadeRange[1]) }}
                    </span>
                </div>
            </div>

            <div v-if="form.presetId" class="flex flex-col gap-1.5">
                <label class="text-xs text-muted-foreground">Assets</label>
                <Select v-model="form.assetSource">
                    <SelectTrigger>
                        <SelectValue as-child>
                            <div v-if="form.assetSource" class="flex items-center gap-2">
                                <Folders
                                    v-if="form.assetSource === 'all'"
                                    class="size-4 text-muted-foreground"
                                />
                                <Folder v-else class="size-4 text-muted-foreground" />
                                <span>{{
                                    form.assetSource === 'all'
                                        ? `All assets${dataLoaded ? ` (${totalAssetCount} available)` : ''}`
                                        : `${foldersStore.items.find((f) => f.id === form.assetSource)?.name}${dataLoaded ? ` (${assetCountByFolder[form.assetSource] ?? 0} available)` : ''}`
                                }}</span>
                            </div>
                            <span v-else class="text-muted-foreground">Select assets</span>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            <div class="flex items-center gap-2">
                                <Folders class="size-4 text-muted-foreground" />
                                <span
                                >All assets{{
                                    dataLoaded ? ` (${totalAssetCount} available)` : ''
                                }}</span
                                >
                            </div>
                        </SelectItem>
                        <SelectItem
                            v-for="folder in foldersStore.items"
                            :key="folder.id"
                            :value="folder.id"
                        >
                            <div class="flex items-center gap-2">
                                <Folder class="size-4 text-muted-foreground" />
                                <span
                                >{{ folder.name
                                }}{{
                                    dataLoaded
                                        ? ` (${assetCountByFolder[folder.id] ?? 0} available)`
                                        : ''
                                }}</span
                                >
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>

                <label
                    class="flex items-center gap-2 mt-2 cursor-pointer group"
                    @click="autoAssign = !autoAssign"
                >
                    <div
                        :class="[
                            'size-4 rounded-sm border transition-colors flex items-center justify-center shrink-0 group-hover:border-primary',
                            autoAssign
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-input bg-transparent',
                        ]"
                    >
                        <Check v-if="autoAssign" class="size-3" />
                    </div>
                    <span
                        :class="[
                            'text-sm select-none leading-none transition-colors',
                            autoAssign
                                ? 'text-foreground'
                                : 'text-muted-foreground group-hover:text-foreground',
                        ]"
                    >
                        Assign assets to each phrase automatically
                    </span>
                </label>
            </div>

            <div v-if="form.presetId" class="flex flex-col gap-2">
                <label class="text-xs text-muted-foreground"> Phrases </label>

                <template v-if="!isRpgPreset">
                    <div class="h-9 flex items-center gap-2">
                        <Input
                            v-model="aiTheme"
                            placeholder="Type theme or mood"
                            class="flex-1"
                            :disabled="generatingPhrases"
                        />
                        <NumberField
                            v-model="aiCount"
                            :min="1"
                            :max="20"
                            :disabled="generatingPhrases"
                            class="w-20"
                        >
                            <NumberFieldContent>
                                <NumberFieldDecrement />
                                <NumberFieldInput />
                                <NumberFieldIncrement />
                            </NumberFieldContent>
                        </NumberField>
                        <Button
                            class="h-full!"
                            variant="secondary"
                            :disabled="!aiTheme.trim() || generatingPhrases"
                            @click="generatePhrases"
                        >
                            <Loader2 v-if="generatingPhrases" class="size-3.5 animate-spin" />
                            <WandSparkles v-else class="size-3.5" />
                        </Button>
                    </div>

                    <label class="mb-2 flex items-center text-[12px] text-muted-foreground">
                        You can type theme or mood here to generate phrases
                    </label>
                </template>

                <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
                <p v-if="validationMessage" class="text-sm text-yellow-600">
                    {{ validationMessage }}
                </p>

                <template v-if="isRpgPreset">
                    <div ref="phrasesListRef" class="flex flex-col gap-3">
                        <div
                            v-for="(entry, i) in entries"
                            :key="i"
                            class="p-3 rounded-lg border border-border bg-muted/10"
                        >
                            <RpgEntryCard
                                :phrase="entry.phrase"
                                :choice-left="entry.choiceLeft"
                                :choice-right="entry.choiceRight"
                                :on-remove="entries.length > 1 ? () => removeEntry(i) : undefined"
                                @update:phrase="entry.phrase = $event"
                                @update:choice-left="entry.choiceLeft = $event"
                                @update:choice-right="entry.choiceRight = $event"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        class="self-start text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        @click="addEntry"
                    >
                        <Plus class="size-3.5" />
                        Add video
                    </button>
                </template>

                <template v-else>
                    <TooltipProvider>
                        <div ref="phrasesListRef" class="flex flex-col gap-2">
                            <div
                                v-for="(entry, i) in entries"
                                :key="i"
                                class="flex items-center gap-2"
                            >
                                <div class="relative flex-1">
                                    <Input v-model="entry.phrase" placeholder="Type a phrase" />
                                    <Tooltip v-if="entry.phrase.length > PHRASE_MAX_CHARS">
                                        <TooltipTrigger as-child>
                                            <div
                                                class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-default"
                                            >
                                                <AlertCircle class="size-4 text-yellow-500" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Exceeds recommended limit of
                                            {{ PHRASE_MAX_CHARS }} characters
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <button
                                    v-if="entries.length > 1"
                                    type="button"
                                    class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                    @click="removeEntry(i)"
                                >
                                    <X class="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </TooltipProvider>
                    <button
                        type="button"
                        class="self-start text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        @click="addEntry"
                    >
                        <Plus class="size-3.5" />
                        Add phrase
                    </button>
                </template>
            </div>

            <div
                class="sticky bottom-0 bg-background border-t border-border/50 py-4 flex items-center justify-between"
            >
                <Button size="sm" variant="ghost" @click="router.push('/create')">Cancel</Button>
                <Button size="sm" :disabled="!canSubmit || submitting" @click="handlePrimary">
                    <Loader2 v-if="submitting" class="size-3.5 mr-1 animate-spin" />
                    <span>{{
                        autoAssign
                            ? `Create videos${filledCount ? ` (${filledCount})` : ''}`
                            : 'Next'
                    }}</span>
                </Button>
            </div>
        </template>

        <template v-else>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 class="text-xl font-semibold">Assign assets</h2>
                    <p class="text-sm text-muted-foreground mt-0.5">
                        Review and adjust the asset for each phrase
                    </p>
                </div>
            </div>

            <div class="flex flex-col gap-4 sm:gap-3">
                <div
                    v-for="(entry, i) in entries"
                    :key="i"
                    class="flex flex-col sm:flex-row sm:items-center gap-3"
                >
                    <div
                        class="group relative size-32 rounded-lg overflow-hidden bg-muted shrink-0"
                    >
                        <img
                            v-if="entry.asset"
                            :src="entry.asset.url"
                            class="size-full object-cover"
                        />
                        <div v-else class="size-full flex items-center justify-center">
                            <ImageIcon class="size-5 text-muted-foreground" />
                        </div>
                        <button
                            class="absolute top-1 right-1 p-1 rounded bg-black/50 hover:bg-black/70 text-white transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                            title="Change asset"
                            @click="openPicker(i)"
                        >
                            <Pencil class="size-3" />
                        </button>
                    </div>

                    <template v-if="isRpgPreset">
                        <div class="flex-1 p-3 rounded-lg border border-border bg-muted/10">
                            <RpgEntryCard
                                :phrase="entry.phrase"
                                :choice-left="entry.choiceLeft"
                                :choice-right="entry.choiceRight"
                                @update:phrase="entry.phrase = $event"
                                @update:choice-left="entry.choiceLeft = $event"
                                @update:choice-right="entry.choiceRight = $event"
                            />
                        </div>
                        <div class="flex items-center gap-1 sm:flex-col shrink-0">
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="!entry.asset"
                                @click="openSettings(entry)"
                            >
                                <SlidersHorizontal class="size-3.5" />
                            </Button>
                            <button
                                v-if="entries.length > 1"
                                type="button"
                                class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                @click="removeEntry(i)"
                            >
                                <X class="size-3.5" />
                            </button>
                        </div>
                    </template>
                    <template v-else>
                        <TooltipProvider class="flex-1">
                            <div class="relative flex-1">
                                <Input v-model="entry.phrase" placeholder="Type a phrase" />
                                <Tooltip v-if="entry.phrase.length > PHRASE_MAX_CHARS">
                                    <TooltipTrigger as-child>
                                        <div
                                            class="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-default"
                                        >
                                            <AlertCircle class="size-4 text-yellow-500" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Exceeds recommended limit of
                                        {{ PHRASE_MAX_CHARS }} characters
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                        <button
                            v-if="entries.length > 1"
                            type="button"
                            class="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 self-start sm:self-auto"
                            @click="removeEntry(i)"
                        >
                            <X class="size-3.5" />
                        </button>
                    </template>
                </div>

                <button
                    type="button"
                    class="self-start text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    @click="addEntry"
                >
                    <Plus class="size-3.5" />
                    {{ isRpgPreset ? 'Add video' : 'Add phrase' }}
                </button>
            </div>

            <div
                class="sticky bottom-0 bg-background border-t border-border/50 py-4 flex items-center justify-between"
            >
                <Button size="sm" variant="ghost" @click="goBack">Back</Button>
                <Button size="sm" :disabled="!canSubmit || submitting" @click="submit">
                    <Loader2 v-if="submitting" class="size-3.5 mr-1 animate-spin" />
                    {{ `Create video${filledCount > 1 ? 's' : ''} (${filledCount})` }}
                </Button>
            </div>
        </template>
    </div>

    <AssetPickerDialog
        v-model:open="pickerOpen"
        :initial-asset="pickerInitialAsset"
        :exclude-asset-ids="pickerExcludeIds"
        @select="onPickerSelect"
    />

    <RpgSettingsDialog
        v-if="settingsItem?.asset"
        v-model:open="settingsOpen"
        :image-url="settingsItem.asset.url"
        :phrase="settingsItem.phrase"
        :choice-left="settingsItem.choiceLeft ?? ''"
        :choice-right="settingsItem.choiceRight ?? ''"
        :settings="settingsItem.settings"
        @apply="onSettingsApply"
    />
</template>

<script setup lang="ts">
    import {
        AlertCircle,
        Check,
        Folder,
        Folders,
        ImageIcon,
        Loader2,
        Music,
        Pencil,
        Plus,
        RectangleHorizontal,
        RectangleVertical,
        SlidersHorizontal,
        Square,
        VolumeX,
        WandSparkles,
        X,
    } from 'lucide-vue-next';
    import type { Component } from 'vue';
    import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { useBreadcrumbs } from '@/composables/useBreadcrumbs';
    import AssetPickerDialog from '@/components/AssetPickerDialog.vue';
    import MiniAudioPlayer from '@/components/MiniAudioPlayer.vue';
    import RpgEntryCard from '@/components/RpgEntryCard.vue';
    import RpgSettingsDialog from '@/components/RpgSettingsDialog.vue';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import {
        Tooltip,
        TooltipContent,
        TooltipProvider,
        TooltipTrigger,
    } from '@/components/ui/tooltip';
    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput,
    } from '@/components/ui/number-field';
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select';
    import { Slider } from '@/components/ui/slider';
    import { useAudioStore } from '@/stores/audio';
    import type { Asset } from '@/stores/assets';
    import { useFoldersStore } from '@/stores/folders';
    import { usePresetsStore } from '@/stores/presets';
    import { useSessionsStore } from '@/stores/sessions';
    import type { RpgSettings } from '@/types/rpgSettings';
    import api from '@/lib/api';

    const PHRASE_MAX_CHARS = 45;

    const formatLabels: Record<string, string> = {
        LANDSCAPE_16_9: '16:9',
        STANDARD_4_3: '4:3',
        SQUARE_1_1: '1:1',
        PORTRAIT_3_4: '3:4',
        VERTICAL_9_16: '9:16',
    };

    const formatIcons: Record<string, Component> = {
        LANDSCAPE_16_9: RectangleHorizontal,
        STANDARD_4_3: RectangleHorizontal,
        SQUARE_1_1: Square,
        PORTRAIT_3_4: RectangleVertical,
        VERTICAL_9_16: RectangleVertical,
    };

    const router = useRouter();
    const breadcrumbsComposable = useBreadcrumbs();
    const audioStore = useAudioStore();
    const foldersStore = useFoldersStore();
    const sessionsStore = useSessionsStore();
    const presetsStore = usePresetsStore();

    const route = useRoute();

    type Entry = {
        phrase: string;
        choiceLeft: string;
        choiceRight: string;
        asset: Asset | null;
        settings?: RpgSettings;
    };

    const step = ref<1 | 2>(1);
    const submitting = ref(false);
    const error = ref('');
    const entries = ref<Entry[]>([{ phrase: '', choiceLeft: '', choiceRight: '', asset: null }]);
    const allAssets = ref<Asset[]>([]);
    const dataLoaded = ref(false);
    const ready = ref(false);
    const aiTheme = ref('');
    const aiCount = ref(3);
    const generatingPhrases = ref(false);
    const fadeRange = ref<[number, number]>([0, 0]);
    const autoAssign = ref(false);

    const draftId = ref<string | null>(null);
    const populating = ref(false);

    const phrasesListRef = ref<HTMLElement | null>(null);
    const pickerOpen = ref(false);
    const pickerIndex = ref(0);
    const pickerInitialAsset = ref<Asset | null>(null);
    const pickerExcludeIds = ref<string[]>([]);
    const settingsOpen = ref(false);
    const settingsItem = ref<Entry | null>(null);

    function openSettings(entry: Entry) {
        settingsItem.value = entry;
        settingsOpen.value = true;
    }

    function onSettingsApply(settings: RpgSettings) {
        if (settingsItem.value) settingsItem.value.settings = settings;
    }

    const form = reactive({
        audioId: '',
        assetSource: 'all',
        presetId: '',
    });

    const NO_AUDIO = 'none';
    const noAudioSeconds = ref(15);
    const noAudio = computed(() => form.audioId === NO_AUDIO);

    const selectedAudio = computed(
        () => audioStore.items.find((t) => t.id === form.audioId) ?? null,
    );

    watch(selectedAudio, (audio) => {
        if (populating.value) return;
        if (audio) {
            fadeRange.value = [0, audio.duration];
        }
    });

    const selectedPreset = computed(
        () => presetsStore.items.find((p) => p.id === form.presetId) ?? null,
    );

    const isRpgPreset = computed(() => form.presetId === 'rpg-dialogue');

    watch(isRpgPreset, (rpg) => {
        if (!rpg && form.audioId === NO_AUDIO) form.audioId = '';
    });

    function isEntryFilled(e: Entry): boolean {
        if (isRpgPreset.value) {
            return !!(e.phrase.trim() && e.choiceLeft.trim() && e.choiceRight.trim());
        }
        return !!e.phrase.trim();
    }

    const filledCount = computed(() => entries.value.filter(isEntryFilled).length);

    const assetCountByFolder = computed(() => {
        const counts: Record<string, number> = {};
        for (const asset of allAssets.value.filter((a) => !a.isUsed)) {
            const folderId = asset.folderId || 'none';
            counts[folderId] = (counts[folderId] ?? 0) + 1;
        }
        return counts;
    });

    const totalAssetCount = computed(() => allAssets.value.filter((a) => !a.isUsed).length);

    const resolvedAssets = computed(() => {
        if (form.assetSource === 'all') return allAssets.value.filter((a) => !a.isUsed);
        return allAssets.value.filter((a) => a.folderId === form.assetSource && !a.isUsed);
    });

    const resolvedAssetIds = computed(() => resolvedAssets.value.map((a) => a.id));

    const canSubmit = computed(
        () =>
            !submitting.value &&
            form.audioId &&
            (!noAudio.value || noAudioSeconds.value > 0) &&
            form.presetId &&
            resolvedAssetIds.value.length >= filledCount.value &&
            filledCount.value > 0,
    );

    const validationMessage = computed(() => {
        if (!form.audioId) return '';
        if (filledCount.value === 0) return '';
        if (resolvedAssetIds.value.length < filledCount.value) {
            return `Need at least ${filledCount.value} assets, but only ${resolvedAssetIds.value.length} available`;
        }
        return '';
    });

    onMounted(async () => {
        breadcrumbsComposable.setBreadcrumbs([
            { label: 'Create', onClick: () => router.push('/create') },
            { label: 'New video session' },
        ]);
        await Promise.all([
            audioStore.fetchAll(),
            foldersStore.fetchAll(),
            presetsStore.fetchAll(),
            api.get<Asset[]>('/api/assets').then((res) => {
                allAssets.value = res.data;
            }),
        ]);
        dataLoaded.value = true;

        const id = route.params.id as string | undefined;
        if (id) await populateFromDraft(id);
        ready.value = true;
    });

    async function populateFromDraft(id: string) {
        populating.value = true;
        try {
            const session =
                sessionsStore.current?.id === id
                    ? sessionsStore.current
                    : await sessionsStore.fetchOne(id);
            draftId.value = session.id;
            form.presetId = session.presetId;
            form.assetSource = session.assetSource ?? 'all';
            autoAssign.value = session.autoAssign ?? false;
            if (session.noAudio) {
                form.audioId = NO_AUDIO;
                noAudioSeconds.value = Math.round(session.durationMs / 1000) || 15;
            } else {
                form.audioId = session.audioId ?? '';
            }
            fadeRange.value = [
                session.fadeInMs ?? 0,
                session.durationMs - (session.fadeOutMs ?? 0),
            ];
            const vids = session.videos ?? [];
            if (vids.length) {
                entries.value = vids.map((v) => ({
                    phrase: v.phrase,
                    choiceLeft: v.choiceLeft ?? '',
                    choiceRight: v.choiceRight ?? '',
                    asset: v.asset ? (v.asset as unknown as Asset) : null,
                    settings: v.settings ?? undefined,
                }));
            }
        } finally {
            await nextTick();
            populating.value = false;
        }
    }

    async function generatePhrases() {
        if (!aiTheme.value.trim()) return;
        generatingPhrases.value = true;
        try {
            const res = await api.post<{ phrases: string[] }>('/api/ai/phrases', {
                theme: aiTheme.value,
                count: aiCount.value,
            });
            const existing = entries.value.filter((e) => e.phrase.trim());
            const generated: Entry[] = res.data.phrases.map((phrase) => ({
                phrase,
                choiceLeft: '',
                choiceRight: '',
                asset: null,
            }));
            const merged = [...existing, ...generated];
            entries.value = merged.length
                ? merged
                : [{ phrase: '', choiceLeft: '', choiceRight: '', asset: null }];
        } catch {
            error.value = 'Failed to generate phrases';
        } finally {
            generatingPhrases.value = false;
        }
    }

    function scrollPhrasesToBottom() {
        let el: Element | null = phrasesListRef.value;
        while (el && el !== document.body) {
            const { overflowY } = window.getComputedStyle(el);
            if (overflowY === 'auto' || overflowY === 'scroll') {
                el.scrollTop = el.scrollHeight;
                return;
            }
            el = el.parentElement;
        }
    }

    async function addEntry() {
        entries.value.push({ phrase: '', choiceLeft: '', choiceRight: '', asset: null });
        if (step.value === 2) assignMissingAssets();
        await nextTick();
        scrollPhrasesToBottom();
    }

    function removeEntry(i: number) {
        entries.value.splice(i, 1);
        if (!entries.value.length) {
            entries.value = [{ phrase: '', choiceLeft: '', choiceRight: '', asset: null }];
        }
    }

    function shuffleArray<T>(arr: T[]): T[] {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function assignMissingAssets() {
        const usedIds = new Set(entries.value.map((e) => e.asset?.id).filter(Boolean) as string[]);
        const pool = shuffleArray(resolvedAssets.value.filter((a) => !usedIds.has(a.id)));
        let pi = 0;
        for (const entry of entries.value) {
            if (!entry.asset && pi < pool.length) {
                entry.asset = pool[pi++];
            }
        }
    }

    function goToStep2() {
        entries.value = entries.value.filter(isEntryFilled);
        if (!entries.value.length) {
            entries.value = [{ phrase: '', choiceLeft: '', choiceRight: '', asset: null }];
            return;
        }
        assignMissingAssets();
        step.value = 2;
    }

    function goBack() {
        step.value = 1;
    }

    function openPicker(i: number) {
        pickerIndex.value = i;
        pickerInitialAsset.value = entries.value[i]?.asset ?? null;
        pickerExcludeIds.value = entries.value
            .filter((_, idx) => idx !== i)
            .map((e) => e.asset?.id)
            .filter(Boolean) as string[];
        pickerOpen.value = true;
    }

    function onPickerSelect(asset: Asset) {
        const entry = entries.value[pickerIndex.value];
        if (entry) entry.asset = asset;
    }

    function handlePrimary() {
        if (!canSubmit.value) return;
        if (autoAssign.value) {
            submit();
        } else {
            goToStep2();
        }
    }

    function formatDuration(ms: number): string {
        const totalSeconds = Math.round(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function currentDurationMs(): number {
        return noAudio.value
            ? Math.round(noAudioSeconds.value * 1000)
            : Math.round(selectedAudio.value?.duration ?? 0);
    }

    function buildDraftPayload() {
        const durationMs = currentDurationMs();
        return {
            id: draftId.value ?? undefined,
            audioId: noAudio.value ? undefined : form.audioId || undefined,
            noAudio: noAudio.value,
            assetIds: resolvedAssetIds.value,
            assetSource: form.assetSource,
            autoAssign: autoAssign.value,
            durationMs,
            fadeInMs: noAudio.value ? 0 : fadeRange.value[0],
            fadeOutMs: noAudio.value ? 0 : durationMs - fadeRange.value[1],
            presetId: form.presetId,
            entries: entries.value
                .filter((e) => e.phrase.trim())
                .map((e) => ({
                    phrase: e.phrase,
                    choiceLeft: e.choiceLeft || null,
                    choiceRight: e.choiceRight || null,
                    assetId: autoAssign.value ? null : (e.asset?.id ?? null),
                    settings: e.settings ?? null,
                })),
        };
    }

    function canAutoSave(): boolean {
        return !!draftId.value && !!form.presetId;
    }

    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    function scheduleDraftSave() {
        if (populating.value || submitting.value) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(flushDraftSave, 800);
    }

    async function flushDraftSave() {
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        if (populating.value || submitting.value || !canAutoSave()) return;
        try {
            await sessionsStore.saveDraft(buildDraftPayload());
        } catch {
            // autosave failures are non-blocking
        }
    }

    watch(
        [
            () => form.audioId,
            () => form.assetSource,
            () => form.presetId,
            fadeRange,
            noAudioSeconds,
            autoAssign,
            entries,
        ],
        scheduleDraftSave,
        { deep: true },
    );

    onBeforeUnmount(() => {
        if (saveTimer) clearTimeout(saveTimer);
    });

    function buildPhrasePayload() {
        return entries.value.filter(isEntryFilled).map((e) => ({
            phrase: e.phrase,
            choiceLeft: isRpgPreset.value ? e.choiceLeft : null,
            choiceRight: isRpgPreset.value ? e.choiceRight : null,
            assetId: autoAssign.value ? null : (e.asset?.id ?? null),
            settings: e.settings ?? null,
        }));
    }

    async function submit() {
        if (!canSubmit.value) return;
        error.value = '';
        submitting.value = true;
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }
        try {
            const phrasePayload = buildPhrasePayload();
            if (draftId.value) {
                await sessionsStore.saveDraft(buildDraftPayload());
                await sessionsStore.generate(draftId.value, phrasePayload);
            } else {
                const durationMs = currentDurationMs();
                const session = await sessionsStore.create({
                    audioId: noAudio.value ? undefined : form.audioId,
                    noAudio: noAudio.value,
                    assetIds: resolvedAssetIds.value,
                    durationMs,
                    fadeInMs: noAudio.value ? 0 : fadeRange.value[0],
                    fadeOutMs: noAudio.value ? 0 : durationMs - fadeRange.value[1],
                    presetId: form.presetId,
                });
                await sessionsStore.generate(session.id, phrasePayload);
                router.push(`/create/${session.id}`);
            }
        } catch (e: unknown) {
            error.value =
                (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
                'Failed to create videos';
        } finally {
            submitting.value = false;
        }
    }
</script>
