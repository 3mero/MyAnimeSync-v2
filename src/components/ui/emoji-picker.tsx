'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from './button';
import { Smile } from 'lucide-react';
// import Picker from '@emoji-mart/react';
// import data from '@emoji-mart/data'

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
    
    const handleSelect = (emoji: any) => {
        onEmojiSelect(emoji.native);
    }
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Smile className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none">
                 <div>Emoji picker has been disabled due to a dependency conflict.</div>
            </PopoverContent>
        </Popover>
    )
}
