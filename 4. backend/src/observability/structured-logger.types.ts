import type { LogLevel } from "@nestjs/common";

export type LogEntry = {
    timestamp: string;
    level: LogLevel;
    context?: string;
    message: unknown;
    stack?: string;
    additionalParams?: unknown[];
    serializationError?: string;
};
