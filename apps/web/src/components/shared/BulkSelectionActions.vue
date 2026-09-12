<template>
    <Button size="sm" variant="ghost" @click="emit('toggle-all')">
        {{ allSelected ? 'Deselect all' : 'Select all' }}
    </Button>
    <Button
        v-if="intent === SelectionIntent.Download"
        size="sm"
        variant="outline"
        :disabled="downloading || !selectedCount"
        @click="emit('download')"
    >
        <Loader2 v-if="downloading" class="mr-1 size-3.5 animate-spin" />
        <Download v-else class="mr-1 size-3.5" />
        Download{{ selectedCount ? ` (${selectedCount})` : '' }}
    </Button>
    <Button
        v-else
        size="sm"
        variant="outline"
        class="text-destructive hover:text-destructive"
        :disabled="!selectedCount"
        @click="emit('delete')"
    >
        <Trash2 class="mr-1 size-3.5" />
        {{ deleteLabel }}{{ selectedCount ? ` (${selectedCount})` : '' }}
    </Button>
    <Button size="sm" variant="ghost" @click="emit('cancel')">Cancel</Button>
</template>

<script setup lang="ts">
    import { Download, Loader2, Trash2 } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { SelectionIntent } from '@/types/ui';
    import type { BulkSelectionActionsProps } from './types';

    withDefaults(defineProps<BulkSelectionActionsProps>(), {
        deleteLabel: 'Delete',
        intent: null,
        downloading: false,
    });

    const emit = defineEmits<{
        (event: 'toggle-all'): void;
        (event: 'download'): void;
        (event: 'delete'): void;
        (event: 'cancel'): void;
    }>();
</script>
