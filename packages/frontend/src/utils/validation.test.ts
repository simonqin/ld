import { describe, expect, it } from 'vitest';
import { emailSchema, requiredString } from './validation';

const t = ((key: string, fallback?: string) => fallback ?? key) as any;

describe('validation utils', () => {
    it('requiredString returns required message', () => {
        const schema = requiredString(t);
        const result = schema.safeParse('');
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toBe('Required');
    });

    it('emailSchema returns invalid email message', () => {
        const schema = emailSchema(t);
        const result = schema.safeParse('not-an-email');
        expect(result.success).toBe(false);
        expect(result.error?.errors[0]?.message).toBe(
            'Email address is not valid',
        );
    });
});
