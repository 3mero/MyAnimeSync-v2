'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface CodeBlockProps {
    text: string;
    highlightText?: string;
    onHighlightChange?: (count: number) => void;
    currentMatchIndex?: number;
}

export function CodeBlock({ text, highlightText, onHighlightChange, currentMatchIndex }: CodeBlockProps) {
    const contentRef = useRef<HTMLPreElement>(null);

    const highlightedContent = React.useMemo(() => {
        if (!highlightText) {
            onHighlightChange?.(0);
            return text;
        }
        const parts = text.split(new RegExp(`(${highlightText})`, 'gi'));
        let matchCount = 0;
        
        const content = parts.map((part, index) => {
            if (part.toLowerCase() === highlightText.toLowerCase()) {
                const isCurrent = matchCount === currentMatchIndex;
                const matchId = `match-${matchCount}`;
                matchCount++;
                return (
                    <mark
                        key={index}
                        id={matchId}
                        className={cn(
                            "rounded px-1",
                            isCurrent ? "bg-primary text-primary-foreground" : "bg-yellow-500/50 text-white"
                        )}
                    >
                        {part}
                    </mark>
                );
            }
            return part;
        });

        onHighlightChange?.(matchCount);
        return content;
    }, [text, highlightText, onHighlightChange, currentMatchIndex]);

    useEffect(() => {
        if (highlightText && currentMatchIndex !== undefined) {
            const element = document.getElementById(`match-${currentMatchIndex}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentMatchIndex, highlightText]);

    return (
        <div className="relative font-mono text-xs p-3 bg-black/50 rounded-md">
            <pre ref={contentRef} className="whitespace-pre-wrap break-all">
                {highlightedContent}
            </pre>
        </div>
    );
}
