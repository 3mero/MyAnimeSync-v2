'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'warn' | 'error' | 'network';
  details?: any;
}

interface LoggerContextType {
  logs: LogEntry[];
  addLog: (message: string, type?: LogEntry['type'], details?: any) => void;
  clearLogs: () => void;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

export function LoggerProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', details?: any) => {
    if (process.env.NODE_ENV === 'development') {
        let finalDetails = details;
        // If the detail is an error object, extract its stack for better debugging.
        if (type === 'error' && details instanceof Error) {
            finalDetails = {
                message: details.message,
                stack: details.stack,
                ...finalDetails
            };
        } else if (type === 'error' && typeof details === 'object' && details !== null && details.error instanceof Error) {
             finalDetails = {
                ...finalDetails,
                stack: details.error.stack,
                errorMessage: details.error.message
            };
        }


        const newLog: LogEntry = {
            timestamp: new Date(),
            message,
            type,
            details: finalDetails,
        };
        // Add new log to the top of the array and keep only the last 100 logs
        setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 100));
    }
  }, []);
  
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);


  const value = { logs, addLog, clearLogs };

  return (
    <LoggerContext.Provider value={value}>
      {children}
    </LoggerContext.Provider>
  );
}

export function useLogger() {
  const context = useContext(LoggerContext);
  if (context === undefined) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return context;
}
