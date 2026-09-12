import {
    computed,
    nextTick,
    onMounted,
    onUnmounted,
    ref,
    watch,
    type ComputedRef,
    type Ref,
    type VNodeRef,
} from 'vue';

const PREVIEW_WIDTH = 1080;
const PREVIEW_HEIGHT = 1920;
const MAX_INLINE_WIDTH = 390;

export function useScaledPreview(active: Ref<boolean> | ComputedRef<boolean>) {
    const fullscreenContainer = ref<HTMLElement | null>(null);
    const isPreviewFullscreen = ref(false);
    const previewScale = ref(0.36);
    let resizeObserver: ResizeObserver | undefined;

    const previewViewportStyle = computed(() => ({
        width: `${PREVIEW_WIDTH * previewScale.value}px`,
        height: `${PREVIEW_HEIGHT * previewScale.value}px`,
    }));
    const previewCanvasStyle = computed(() => ({
        transform: `scale(${previewScale.value})`,
        transformOrigin: 'top left',
    }));
    const setFullscreenContainer: VNodeRef = (element) => {
        fullscreenContainer.value = element instanceof HTMLElement ? element : null;
    };

    function updatePreviewScale() {
        const container = fullscreenContainer.value;
        if (!container) return;
        const width = isPreviewFullscreen.value
            ? container.clientWidth
            : Math.min(container.clientWidth, MAX_INLINE_WIDTH);
        const height = isPreviewFullscreen.value
            ? container.clientHeight
            : Number.POSITIVE_INFINITY;
        previewScale.value = Math.min(width / PREVIEW_WIDTH, height / PREVIEW_HEIGHT);
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

    watch(active, async (isActive) => {
        resizeObserver?.disconnect();
        if (!isActive) return;
        await nextTick();
        updatePreviewScale();
        const container = fullscreenContainer.value;
        if (!container) return;
        resizeObserver = new ResizeObserver(updatePreviewScale);
        resizeObserver.observe(container);
    });
    onMounted(() => document.addEventListener('fullscreenchange', syncFullscreenState));
    onUnmounted(() => {
        document.removeEventListener('fullscreenchange', syncFullscreenState);
        resizeObserver?.disconnect();
    });

    return {
        isPreviewFullscreen,
        previewCanvasStyle,
        previewViewportStyle,
        setFullscreenContainer,
        toggleFullscreen,
    };
}
