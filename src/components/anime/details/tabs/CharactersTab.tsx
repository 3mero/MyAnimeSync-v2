'use client';

import { CharacterList } from '../../character-list';
import type { JikanCharacter } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface CharactersTabProps {
    characters: JikanCharacter[] | null;
    isLoading: boolean;
    error: string | null;
}


export function CharactersTab({ characters, isLoading, error }: CharactersTabProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    return <CharacterList characters={characters} isLoading={isLoading} error={error} />;
}
