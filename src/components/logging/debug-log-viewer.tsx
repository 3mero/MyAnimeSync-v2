'use client';

import { useAuth } from "@/hooks/use-auth";
import { useLogger } from "@/hooks/use-logger";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle, Bug } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { format } from "date-fns";

export function DebugLogViewer() {
    const { showDebugLogs, setDebugLogs } = useAuth();
    const { logs } = useLogger();

    if (!showDebugLogs) {
        return null;
    }

    const recentLogs = logs.slice(0, 10);

    return (
        <Alert variant="destructive" className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl z-50 shadow-2xl">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    <AlertTitle>صندوق تصحيح الأخطاء المؤقت</AlertTitle>
                </div>
                <button onClick={() => setDebugLogs(false)} className="p-1 rounded-full hover:bg-destructive/20">
                     <XCircle className="h-5 w-5" />
                </button>
            </div>
            <AlertDescription className="mt-2">
                هذه هي آخر 10 أحداث تم تسجيلها في النظام. قد تساعد هذه المعلومات في تشخيص سبب التجمد.
            </AlertDescription>
            <ScrollArea className="mt-4 h-64 w-full bg-black/50 p-2 rounded-md font-mono text-xs text-white">
                {recentLogs.length > 0 ? (
                    recentLogs.map((log, index) => (
                        <div key={index} className="p-1 border-b border-gray-700">
                           <span className="text-gray-400">{format(log.timestamp, 'HH:mm:ss.SSS')}</span>
                           <span className={`ml-2 font-bold ${log.type === 'error' ? 'text-red-400' : 'text-blue-300'}`}>[{log.type.toUpperCase()}]</span>
                           <span className="ml-2">{log.message}</span>
                        </div>
                    ))
                ) : (
                    <p>لا توجد سجلات لعرضها.</p>
                )}
            </ScrollArea>
        </Alert>
    );
}
