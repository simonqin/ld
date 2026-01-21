import { type Mock, vi } from 'vitest';
import { lightdashApi } from '../api';
import * as MetricFlowAPI from './MetricFlowAPI';

vi.mock('../api', () => ({
    lightdashApi: vi.fn(),
}));

const mockedApi = lightdashApi as unknown as Mock;
const api = MetricFlowAPI as Record<string, any>;

describe('MetricFlowAPI REST routing', () => {
    afterEach(() => {
        mockedApi.mockReset();
    });

    test('getMetricFlowDimensionValues uses REST route', async () => {
        mockedApi.mockResolvedValueOnce({
            status: 'ok',
            results: {
                search: '',
                results: [],
                cached: false,
                refreshedAt: new Date(),
            },
        });

        await MetricFlowAPI.getMetricFlowDimensionValues('proj', {
            dimension: 'country',
        });

        expect(mockedApi).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/projects/proj/metricflow/dimension-values',
                method: 'POST',
            }),
        );
    });

    test('getMetricFlowFields uses REST route', async () => {
        mockedApi.mockResolvedValueOnce({
            status: 'ok',
            results: { dimensions: [], metricsForDimensions: [] },
        });

        await api.getMetricFlowFields('proj', { metric_a: {} });

        expect(mockedApi).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/projects/proj/metricflow/fields',
                method: 'POST',
            }),
        );
    });

    test('getMetricDefinition uses REST route', async () => {
        mockedApi.mockResolvedValueOnce({
            status: 'ok',
            results: null,
        });

        await MetricFlowAPI.getMetricDefinition('proj', 'metric_a');

        expect(mockedApi).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/projects/proj/metricflow/metrics/metric_a/definition',
                method: 'GET',
            }),
        );
    });

    test('getMetricLineage uses REST route', async () => {
        mockedApi.mockResolvedValueOnce({
            status: 'ok',
            results: null,
        });

        await MetricFlowAPI.getMetricLineage('proj', 'metric_a');

        expect(mockedApi).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/projects/proj/metricflow/metrics/metric_a/lineage',
                method: 'GET',
            }),
        );
    });

    test('createMetricFlowQuery uses REST route', async () => {
        mockedApi.mockResolvedValueOnce({
            status: 'ok',
            results: { createQuery: { queryId: 'q1' } },
        });

        await MetricFlowAPI.createMetricFlowQuery('proj', {
            metrics: { metric_a: {} },
            dimensions: { dim_a: {} },
        });

        expect(mockedApi).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/projects/proj/metricflow/queries',
                method: 'POST',
            }),
        );
    });

    test('getMetricFlowQueryResults uses REST route', async () => {
        mockedApi.mockResolvedValueOnce({
            status: 'ok',
            results: {
                query: {
                    status: 'SUCCEEDED',
                    sql: null,
                    jsonResult: null,
                    error: null,
                },
            },
        });

        await MetricFlowAPI.getMetricFlowQueryResults('proj', 'q1');

        expect(mockedApi).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/projects/proj/metricflow/queries/q1',
                method: 'GET',
            }),
        );
    });
});
