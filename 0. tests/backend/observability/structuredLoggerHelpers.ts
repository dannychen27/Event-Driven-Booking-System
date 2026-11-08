import { LogOutputSpy } from "./structuredLogger.types";


export const getLoggedEntry = (stdoutSpy: LogOutputSpy) => {
    const firstCall = stdoutSpy.mock.calls[0];

    if (!firstCall) {
        throw new Error('Expected logger to write at least one log entry');
    }

    const output = firstCall[0];

    if (typeof output !== 'string') {
        throw new Error('Expected logger output to be a string');
    }

    return JSON.parse(output.trim());
};
