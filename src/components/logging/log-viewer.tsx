'use client';

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLogger, type LogEntry } from "@/hooks/use-logger";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Copy, Trash2, Info, AlertTriangle, XCircle, Network, ChevronDown, ChevronRight, Eye, EyeOff, Code, History } from "lucide-react";
import { format } from 'date-fns';
import { useState, useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Card, CardContent } from "../ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const logIcons = {
    info: <Info className="h-4 w-4 text-blue-400" />,
    warn: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
    error: <XCircle className="h-4 w-4 text-red-400" />,
    network: <Network className="h-4 w-4 text-purple-400" />,
};

const logTypeClasses = {
    info: 'border-l-blue-500',
    warn: 'border-l-yellow-500',
    error: 'border-l-red-500',
    network: 'border-l-purple-500',
};

function LogDetails({ details }: { details: any }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const handleCopy = (content: any) => {
        const textToCopy = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        navigator.clipboard.writeText(textToCopy);
        toast({ title: t('log_copied_to_clipboard') });
    };

    const isNetworkLog = details && (details.query || details.variables || details.response);
    const isErrorLog = details && details.stack;
    
    if (!isNetworkLog && !isErrorLog) return null;

    return (
        <Card className="mt-2 bg-background/50">
            <CardContent className="p-3 space-y-2 text-xs">
                {isErrorLog && (
                     <div>
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold flex items-center gap-2"><Code className="w-4 h-4"/> Stack Trace</h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(details.stack)}><Copy className="h-3 w-3" /></Button>
                        </div>
                        <pre className="bg-black/40 p-2 rounded-md overflow-x-auto text-red-300 font-mono text-xs whitespace-pre-wrap">
                            {details.stack}
                        </pre>
                    </div>
                )}
                {isNetworkLog && (
                    <>
                        {details.query && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-semibold">{t('log_query')}</h4>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy({query: details.query})}><Copy className="h-3 w-3" /></Button>
                                </div>
                                <pre className="bg-black/40 p-2 rounded-md overflow-x-auto text-sky-300">
                                    {details.query.split('(')[0]}
                                </pre>
                            </div>
                        )}
                         {details.variables && (
                            <div>
                                 <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-semibold">{t('log_variables')}</h4>
                                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(details.variables)}><Copy className="h-3 w-3" /></Button>
                                </div>
                                <pre className="bg-black/40 p-2 rounded-md overflow-x-auto">
                                    {JSON.stringify(details.variables, null, 2)}
                                </pre>
                            </div>
                        )}
                         {details.response && (
                            <div>
                                 <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-semibold">{t('log_response')}</h4>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(details.response)}><Copy className="h-3 w-3" /></Button>
                                </div>
                                <pre className="bg-black/40 p-2 rounded-md overflow-x-auto">
                                   {JSON.stringify(details.response, null, 2)}
                                </pre>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function LogRow({ log }: { log: LogEntry }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent collapsible from opening/closing
        navigator.clipboard.writeText(log.message);
        toast({ title: t('log_message_copied') });
    };

    const hasDetails = log.details && (log.type === 'network' || log.type === 'error');

    const TriggerContent = (
        <div className={cn("flex items-start justify-between gap-4 p-2 rounded-md hover:bg-muted/50 w-full border-l-4", logTypeClasses[log.type])}>
            <div className="flex items-start gap-2 flex-grow min-w-0">
                 <span className="mt-0.5">{logIcons[log.type]}</span>
                 <div className="flex-grow">
                    <p className="font-mono text-xs text-muted-foreground">
                        {format(log.timestamp, 'HH:mm:ss.SSS')}
                    </p>
                    <p className="font-mono text-sm break-words whitespace-pre-wrap">
                        {log.message}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
                 <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                </Button>
                {hasDetails && (
                    <div className="h-8 w-8 flex items-center justify-center">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                )}
            </div>
        </div>
    );

    if (hasDetails) {
        return (
             <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <div className="cursor-pointer">
                        {TriggerContent}
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <LogDetails details={log.details} />
                </CollapsibleContent>
            </Collapsible>
        )
    }

    return TriggerContent;
}


function LogList({ logs, type }: { logs: LogEntry[], type: LogEntry['type'] | 'all' }) {
    const { t } = useTranslation();
    const filteredLogs = useMemo(() => {
        if (type === 'all') return logs;
        return logs.filter(log => log.type === type);
    }, [logs, type]);

    if (filteredLogs.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                <p>{t('log_no_entries')} for this category.</p>
            </div>
        );
    }
    
    return (
        <ScrollArea className="h-[45vh] pr-4">
            <div className="space-y-1">
                {filteredLogs.map((log, index) => (
                    <LogRow key={`${log.timestamp.toISOString()}-${index}`} log={log} />
                ))}
            </div>
        </ScrollArea>
    );
}

export function LogViewer() {
  const { logs, clearLogs } = useLogger();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const errorCount = useMemo(() => logs.filter(log => log.type === 'error').length, [logs]);
  const networkCount = useMemo(() => logs.filter(log => log.type === 'network').length, [logs]);
  const infoCount = useMemo(() => logs.filter(log => log.type === 'info' || log.type === 'warn').length, [logs]);

  const handleCopyAll = () => {
    const logText = logs.map(log => 
        `[${log.type.toUpperCase()}] ${format(log.timestamp, 'HH:mm:ss.SSS')}: ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(logText);
    toast({ title: "تم نسخ كل السجلات" });
  }

  return (
    <div className="h-full flex flex-col">
        <Tabs defaultValue="all" className="w-full flex-grow flex flex-col overflow-hidden">
            <div className="flex-shrink-0">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">{t('all')} <Badge variant="secondary" className="ml-2">{logs.length}</Badge></TabsTrigger>
                    <TabsTrigger value="error" className={cn(errorCount > 0 && "text-red-500")}>{t('log_errors')} <Badge variant={errorCount > 0 ? "destructive" : "secondary"} className="ml-2">{errorCount}</Badge></TabsTrigger>
                    <TabsTrigger value="network">{t('log_network')} <Badge variant="secondary" className="ml-2">{networkCount}</Badge></TabsTrigger>
                    <TabsTrigger value="info">{t('log_info')} <Badge variant="secondary" className="ml-2">{infoCount}</Badge></TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-grow overflow-hidden mt-2">
                <TabsContent value="all" className="m-0 h-full"><LogList logs={logs} type="all" /></TabsContent>
                <TabsContent value="error" className="m-0 h-full"><LogList logs={logs} type="error" /></TabsContent>
                <TabsContent value="network" className="m-0 h-full"><LogList logs={logs} type="network" /></TabsContent>
                <TabsContent value="info" className="m-0 h-full"><LogList logs={logs.filter(l => l.type === 'info' || l.type === 'warn')} type="all" /></TabsContent>
            </div>
             <div className="flex-shrink-0 border-t pt-2 mt-2 flex justify-end items-center gap-2">
                 <Button variant="outline" onClick={handleCopyAll} disabled={logs.length === 0}>
                    <Copy className="mr-2 h-4 w-4" /> نسخ الكل
                </Button>
                <Button variant="destructive" onClick={clearLogs} disabled={logs.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" /> {t('log_clear')}
                </Button>
            </div>
        </Tabs>
    </div>
  );
}
