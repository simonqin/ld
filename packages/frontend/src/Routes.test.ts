import { readFileSync } from 'fs';
import { describe, expect, test } from 'vitest';

describe('Routes', () => {
    test('metricflow route exists', () => {
        const content = readFileSync('src/Routes.tsx', 'utf8');
        expect(content).toContain('/projects/:projectUuid/metricflow');
    });
});
