<template>
    <div ref="root" class="relative">
        <button
            type="button"
            class="flex w-full items-center gap-3 rounded-md border border-border bg-muted/20 text-left transition-colors hover:bg-muted/40"
            :class="selectedOptions.length ? 'h-12 p-2' : 'h-10 px-3'"
            :aria-expanded="open"
            aria-haspopup="listbox"
            @click="open = !open"
            @keydown.esc.prevent="open = false"
        >
            <template v-if="selectedOptions.length === 1">
                <img
                    v-if="selectedOptions[0].imageUrl"
                    :src="selectedOptions[0].imageUrl"
                    class="size-8 rounded-md object-cover"
                />
                <span v-else class="flex size-8 items-center justify-center rounded-md bg-muted"
                ><Music class="size-3.5 text-muted-foreground"
                /></span>
                <span class="min-w-0 flex-1"
                ><span class="block truncate text-sm font-medium">{{
                    selectedOptions[0].label
                }}</span
                ><span
                    v-if="selectedOptions[0].description"
                    class="block truncate text-xs text-muted-foreground"
                >{{ selectedOptions[0].description }}</span
                ></span
                >
            </template>
            <template v-else-if="selectedOptions.length">
                <span class="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted"
                ><Music class="size-3.5 text-muted-foreground"
                /></span>
                <span class="min-w-0 flex-1 truncate text-sm font-medium"
                >{{ selectedOptions.length }} {{ multipleLabel }}</span
                >
            </template>
            <span v-else class="min-w-0 flex-1 truncate text-sm text-muted-foreground">{{
                placeholder
            }}</span>
            <ChevronDown
                class="size-4 shrink-0 text-muted-foreground transition-transform"
                :class="open && 'rotate-180'"
            />
        </button>

        <div
            v-if="open"
            role="listbox"
            aria-multiselectable="true"
            class="absolute inset-x-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg"
        >
            <button
                v-for="option in options"
                :key="option.value"
                type="button"
                role="option"
                :aria-selected="isSelected(option.value)"
                class="flex w-full items-center gap-3 rounded-sm p-2 text-left transition-colors hover:bg-muted"
                @click="toggleOption(option.value)"
            >
                <img
                    v-if="option.imageUrl"
                    :src="option.imageUrl"
                    class="size-8 rounded-md object-cover"
                />
                <span v-else class="flex size-8 items-center justify-center rounded-md bg-muted"
                ><Music class="size-3.5 text-muted-foreground"
                /></span>
                <span class="min-w-0 flex-1"
                ><span class="block truncate text-sm">{{ option.label }}</span
                ><span
                    v-if="option.description"
                    class="block truncate text-xs text-muted-foreground"
                >{{ option.description }}</span
                ></span
                >
                <Check v-if="isSelected(option.value)" class="size-4 shrink-0 text-primary" />
            </button>
            <p v-if="!options.length" class="p-3 text-center text-sm text-muted-foreground">
                {{ emptyText }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onMounted, onUnmounted, ref } from 'vue';
    import { Check, ChevronDown, Music } from 'lucide-vue-next';

    export type MultiSelectOption = {
        value: string;
        label: string;
        description?: string;
        imageUrl?: string | null;
    };

    const props = withDefaults(
        defineProps<{
            modelValue: string[];
            options: MultiSelectOption[];
            placeholder?: string;
            multipleLabel?: string;
            emptyText?: string;
            maxSelected?: number;
        }>(),
        {
            placeholder: 'Select options',
            multipleLabel: 'selected',
            emptyText: 'No options available.',
            maxSelected: Number.POSITIVE_INFINITY,
        },
    );
    const emit = defineEmits<{ (event: 'update:modelValue', value: string[]): void }>();

    const root = ref<HTMLElement | null>(null);
    const open = ref(false);
    const selectedOptions = computed(() =>
        props.options.filter((option) => props.modelValue.includes(option.value)),
    );

    function isSelected(value: string) {
        return props.modelValue.includes(value);
    }
    function toggleOption(value: string) {
        if (isSelected(value)) {
            emit(
                'update:modelValue',
                props.modelValue.filter((selected) => selected !== value),
            );
            return;
        }
        if (props.modelValue.length >= props.maxSelected) return;
        emit('update:modelValue', [...props.modelValue, value]);
    }
    function closeOnOutsidePointer(event: PointerEvent) {
        if (root.value && !root.value.contains(event.target as Node)) open.value = false;
    }
    onMounted(() => document.addEventListener('pointerdown', closeOnOutsidePointer));
    onUnmounted(() => document.removeEventListener('pointerdown', closeOnOutsidePointer));
</script>
