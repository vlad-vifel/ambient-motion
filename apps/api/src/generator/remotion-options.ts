import type { ChromiumOptions } from '@remotion/renderer';

const supportedRenderers = new Set<NonNullable<ChromiumOptions['gl']>>([
    'swangle',
    'angle',
    'egl',
    'swiftshader',
    'vulkan',
    'angle-egl',
]);

export function getChromiumOptions(): ChromiumOptions {
    const renderer = process.env.REMOTION_GL;
    return {
        gl:
            renderer && supportedRenderers.has(renderer as NonNullable<ChromiumOptions['gl']>)
                ? (renderer as NonNullable<ChromiumOptions['gl']>)
                : 'angle',
    };
}
