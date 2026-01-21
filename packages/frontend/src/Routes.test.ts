import { readFileSync } from 'fs';
import { describe, expect, test } from 'vitest';

describe('Routes', () => {
    test('dbtsemanticlayer route removed', () => {
        const content = readFileSync('src/Routes.tsx', 'utf8');
        expect(content).not.toContain('/projects/:projectUuid/dbtsemanticlayer');
    });
});
