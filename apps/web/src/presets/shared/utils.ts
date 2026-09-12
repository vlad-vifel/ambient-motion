import type { StandardCreateEntry } from './types';

export function shuffleArray<T>(items: T[]): T[] {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

export function isStandardEntryFilled(entry: StandardCreateEntry, isDialogue: boolean): boolean {
    if (isDialogue)
        return Boolean(entry.phrase.trim() && entry.choiceLeft.trim() && entry.choiceRight.trim());
    return Boolean(entry.phrase.trim());
}

export function formatStandardDuration(milliseconds: number): string {
    const seconds = Math.round(milliseconds / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
