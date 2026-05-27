import { ref } from 'vue';

export interface Breadcrumb {
    label: string;
    onClick?: () => void;
}

const breadcrumbs = ref<Breadcrumb[]>([]);

export function useBreadcrumbs() {
    function setBreadcrumbs(items: Breadcrumb[]) {
        breadcrumbs.value = items;
    }

    function clearBreadcrumbs() {
        breadcrumbs.value = [];
    }

    return {
        breadcrumbs,
        setBreadcrumbs,
        clearBreadcrumbs,
    };
}
