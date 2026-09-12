import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';
import { SelectionIntent } from '@/types/ui';

interface SelectableVideo {
    id: string;
}

export function useVideoSelection<T extends SelectableVideo>(items: MaybeRefOrGetter<T[]>) {
    const selectionIntent = ref<SelectionIntent | null>(null);
    const selectedIds = ref<string[]>([]);
    const downloading = ref(false);

    const selectedItems = computed(() => {
        const selected = new Set(selectedIds.value);
        return toValue(items).filter((item) => selected.has(item.id));
    });

    const allSelected = computed(() => {
        const availableItems = toValue(items);
        return availableItems.length > 0 && selectedIds.value.length === availableItems.length;
    });

    function startSelection(intent: SelectionIntent) {
        selectionIntent.value = intent;
        selectedIds.value = [];
    }

    function exitSelection() {
        selectionIntent.value = null;
        selectedIds.value = [];
    }

    function toggleSelect(id: string) {
        const index = selectedIds.value.indexOf(id);
        if (index === -1) selectedIds.value.push(id);
        else selectedIds.value.splice(index, 1);
    }

    function toggleSelectAll() {
        selectedIds.value = allSelected.value ? [] : toValue(items).map((item) => item.id);
    }

    async function downloadSelected(download: (item: T) => Promise<void>) {
        if (downloading.value || !selectedItems.value.length) return;
        downloading.value = true;
        try {
            for (const item of selectedItems.value) {
                await download(item);
                await new Promise((resolve) => setTimeout(resolve, 300));
            }
        } finally {
            downloading.value = false;
            exitSelection();
        }
    }

    return {
        allSelected,
        downloading,
        selectedIds,
        selectionIntent,
        startSelection,
        exitSelection,
        toggleSelect,
        toggleSelectAll,
        downloadSelected,
    };
}
