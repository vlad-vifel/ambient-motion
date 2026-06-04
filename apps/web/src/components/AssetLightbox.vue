<template>
    <BaseLightbox
        :open="open"
        :items="items"
        :initial-index="initialIndex"
        @update:open="emit('update:open', $event)"
    >
        <template #title="{ item }">
            <div class="flex items-center gap-2 h-5">
                <DialogTitle>{{ (item as LightboxAsset).filename }}</DialogTitle>
                <Badge
                    v-if="(item as LightboxAsset).isUsed"
                    variant="secondary"
                    class="text-[10px] shrink-0"
                >
                    used
                </Badge>
            </div>
        </template>
        <template #media="{ item }">
            <img
                :src="(item as LightboxAsset).src"
                class="max-w-full max-h-full object-contain rounded-md"
            />
        </template>
    </BaseLightbox>
</template>

<script setup lang="ts">
    import { Badge } from '@/components/ui/badge';
    import { DialogTitle } from '@/components/ui/dialog';
    import BaseLightbox from './BaseLightbox.vue';

    export interface LightboxAsset {
        src: string;
        filename?: string;
        isUsed?: boolean;
    }

    defineProps<{
        open: boolean;
        items: LightboxAsset[];
        initialIndex?: number;
    }>();

    const emit = defineEmits<{
        (e: 'update:open', v: boolean): void;
    }>();
</script>
