'use client';

import type { JikanStaff } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function TabLoading() {
    return (
        <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export function StaffTab({ staff }: { staff: JikanStaff[] | null }) {
    const { t } = useTranslation();
    if (!staff) return <TabLoading />;
    if (staff.length === 0) return <div className="text-center py-8 text-muted-foreground">{t('no_staff_found')}</div>;
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {staff.map((s, index) => (
                <Link href={`/person/${s.person.mal_id}`} key={`${s.person.mal_id}-${s.positions[0]}-${index}`}>
                    <Card className="text-center p-3 hover:bg-muted/50 transition-colors group">
                        <div className="relative aspect-square w-24 mx-auto rounded-full overflow-hidden mb-2">
                             <Image src={s.person.images.jpg.image_url} alt={s.person.name} fill className="object-cover" />
                        </div>
                        <p className="font-semibold truncate group-hover:text-primary">{s.person.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.positions.join(', ')}</p>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
