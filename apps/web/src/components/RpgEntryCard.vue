<template>
    <div class="flex flex-col gap-2">
        <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
                <label class="text-xs text-muted-foreground">Question</label>
                <button
                    v-if="onRemove"
                    type="button"
                    class="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    @click="onRemove"
                >
                    <X class="size-3.5" />
                </button>
            </div>
            <Input
                :model-value="phrase"
                placeholder="Type a question"
                @update:model-value="emit('update:phrase', String($event))"
            />
        </div>
        <div class="flex gap-2">
            <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-xs text-muted-foreground">Left option</label>
                <Input
                    :model-value="choiceLeft"
                    placeholder="Type left option"
                    @update:model-value="emit('update:choiceLeft', String($event))"
                />
            </div>
            <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-xs text-muted-foreground">Right option</label>
                <Input
                    :model-value="choiceRight"
                    placeholder="Type right option"
                    @update:model-value="emit('update:choiceRight', String($event))"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { Input } from '@/components/ui/input';
    import { X } from 'lucide-vue-next';

    defineProps<{
        phrase: string;
        choiceLeft: string;
        choiceRight: string;
        onRemove?: () => void;
    }>();

    const emit = defineEmits<{
        (e: 'update:phrase', v: string): void;
        (e: 'update:choiceLeft', v: string): void;
        (e: 'update:choiceRight', v: string): void;
    }>();
</script>
