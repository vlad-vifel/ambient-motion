import React, { useId } from 'react';
import { AbsoluteFill } from 'remotion';

interface PixelGridOverlayProps {
    cellSize?: number;
    lineColor?: string;
    lineThickness?: number;
    blur?: number;
}

export const PixelGridOverlay: React.FC<PixelGridOverlayProps> = ({
    cellSize = 5,
    lineColor = '#000000',
    lineThickness = 0,
    blur = 0,
}) => {
    const rawId = useId();
    const gridId = `pixel-grid-${rawId.replace(/:/g, '')}`;

    return (
        <>
            {blur > 0 && <AbsoluteFill style={{ backdropFilter: `blur(${blur}px)` }} />}

            <AbsoluteFill>
                <svg
                    width="100%"
                    height="100%"
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern
                            id={gridId}
                            width={cellSize}
                            height={cellSize}
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
                                fill="none"
                                stroke={lineColor}
                                strokeWidth={lineThickness}
                            />
                        </pattern>
                    </defs>
                    {/*<rect width="100%" height="100%" fill={`url(#${gridId})`} opacity={0.5} />*/}
                </svg>
            </AbsoluteFill>
        </>
    );
};
