<template>
    <div class="flex flex-col gap-1.5">
        <label class="text-xs text-muted-foreground">Style preset</label>
        <Select v-model="value">
            <SelectTrigger>
                <SelectValue as-child>
                    <PresetOption v-if="selectedPreset" :preset="selectedPreset" />
                    <span v-else class="text-muted-foreground">Select a preset</span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem v-for="preset in presets" :key="preset.id" :value="preset.id">
                    <PresetOption :preset="preset" />
                </SelectItem>
            </SelectContent>
        </Select>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import PresetOption from '@/components/create/PresetOption.vue';
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from '@/components/ui/select';
    import type { PresetSelectFieldEmits, PresetSelectFieldProps } from './types';

    const props = defineProps<PresetSelectFieldProps>();
    const emit = defineEmits<PresetSelectFieldEmits>();

    const value = computed({
        get: () => props.modelValue,
        set: (presetId: string) => emit('update:modelValue', presetId),
    });
    const selectedPreset = computed(
        () => props.presets.find((preset) => preset.id === props.modelValue) ?? null,
    );
</script>
