import type { Component } from 'vue';
import { RectangleHorizontal, RectangleVertical, Square } from 'lucide-vue-next';

export const formatLabels: Record<string, string> = {
    LANDSCAPE_16_9: '16:9',
    STANDARD_4_3: '4:3',
    SQUARE_1_1: '1:1',
    PORTRAIT_3_4: '3:4',
    VERTICAL_9_16: '9:16',
};

export const formatIcons: Record<string, Component> = {
    LANDSCAPE_16_9: RectangleHorizontal,
    STANDARD_4_3: RectangleHorizontal,
    SQUARE_1_1: Square,
    PORTRAIT_3_4: RectangleVertical,
    VERTICAL_9_16: RectangleVertical,
};
