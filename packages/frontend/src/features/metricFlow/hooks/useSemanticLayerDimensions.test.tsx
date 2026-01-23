import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type Mock, vi } from 'vitest';
import { getMetricFlowFields } from '../../../api/MetricFlowAPI';
import useSemanticLayerDimensions from './useSemanticLayerDimensions';

vi.mock('../../../api/MetricFlowAPI', () => ({
    getMetricFlowFields: vi.fn(),
}));

const mockedGetMetricFlowFields = getMetricFlowFields as unknown as Mock;
describe('useSemanticLayerDimensions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createWrapper = () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        return ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };

    test('uses REST fields', async () => {
        mockedGetMetricFlowFields.mockResolvedValue({
            dimensions: [],
            metricsForDimensions: [],
        });
        renderHook(() => useSemanticLayerDimensions('proj', { metric_a: {} }), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(mockedGetMetricFlowFields).toHaveBeenCalledWith('proj', {
                metric_a: {},
            });
        });
    });
});
