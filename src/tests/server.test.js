
const request = require('supertest');
const { app, secureLog } = require('../../server');

// Mock console.error
const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Secure Logging', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should sanitize Notion API errors with body', () => {
        const notionError = {
            code: 'validation_error',
            status: 400,
            message: 'Invalid property',
            body: JSON.stringify({
                object: 'error',
                status: 400,
                code: 'validation_error',
                message: 'Invalid property',
                sensitive_data: 'DO_NOT_LEAK'
            })
        };

        secureLog('Test Error:', notionError);

        expect(consoleErrorMock).toHaveBeenCalledWith(
            'Test Error:',
            expect.stringContaining('"message":"Invalid property"')
        );
        expect(consoleErrorMock).toHaveBeenCalledWith(
            'Test Error:',
            expect.stringContaining('"code":"validation_error"')
        );
        expect(consoleErrorMock).toHaveBeenCalledWith(
            'Test Error:',
            expect.not.stringContaining('sensitive_data')
        );
        expect(consoleErrorMock).toHaveBeenCalledWith(
            'Test Error:',
            expect.not.stringContaining('DO_NOT_LEAK')
        );
    });

    test('should handle standard Error objects', () => {
        const error = new Error('Standard error');
        secureLog('Test Standard Error:', error);

        expect(consoleErrorMock).toHaveBeenCalledWith(
            'Test Standard Error:',
            expect.stringContaining('"message":"Standard error"')
        );
        expect(consoleErrorMock).toHaveBeenCalledWith(
            'Test Standard Error:',
            expect.stringContaining('"stack":')
        );
    });

    test('should handle plain strings', () => {
        secureLog('Test String Error:', 'Something went wrong');

        // When error is a string, secureLog falls through and uses it as is.
        // JSON.stringify("string") -> "string" (with quotes)
        expect(consoleErrorMock).toHaveBeenCalledWith(
            'Test String Error:',
            '"Something went wrong"'
        );
    });
});
