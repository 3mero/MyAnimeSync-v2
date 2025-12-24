'use client';

import Link from "next/link";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface PaginationControlsProps {
    basePath: string;
    currentPage: number;
    hasNextPage: boolean;
    searchParams?: string;
    onPageChange?: (page: number) => void;
}

export function PaginationControls({ basePath, currentPage, hasNextPage, searchParams, onPageChange }: PaginationControlsProps) {
    const { t } = useTranslation();

    const constructUrl = (page: number) => {
        if (basePath === '/search') {
            // For search, we just trigger the function, not change URL
            return '#';
        }
        const params = new URLSearchParams(searchParams);
        const path = `${basePath}/${page}`;
        const queryString = params.toString();
        return `${path}${queryString ? `?${queryString}` : ''}`;
    }
    
    const handlePrevClick = (e: React.MouseEvent) => {
        if (basePath === '/search' && onPageChange) {
            e.preventDefault();
            onPageChange(currentPage - 1);
        }
    }
    
    const handleNextClick = (e: React.MouseEvent) => {
         if (basePath === '/search' && onPageChange) {
            e.preventDefault();
            onPageChange(currentPage + 1);
        }
    }

    const hasPrevPage = currentPage > 1;

    return (
        <div className="flex items-center justify-center gap-4 mt-12">
            {hasPrevPage && (
                 <Button asChild={basePath !== '/search'} variant="outline">
                    <Link href={constructUrl(currentPage - 1)} onClick={handlePrevClick}>
                         <ChevronLeft className="mr-2" />
                        {t('previous')}
                    </Link>
                </Button>
            )}
            <span className="font-semibold text-lg">{t('page')} {currentPage}</span>
             {hasNextPage && (
                 <Button asChild={basePath !== '/search'} variant="outline">
                    <Link href={constructUrl(currentPage + 1)} onClick={handleNextClick}>
                        {t('next')}
                        <ChevronRight className="ml-2" />
                    </Link>
                </Button>
            )}
        </div>
    )
}
