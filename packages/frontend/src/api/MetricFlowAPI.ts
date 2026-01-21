import { type FieldValueSearchResult, type Filters } from '@lightdash/common';
import { lightdashApi } from '../api';

export enum MetricFlowDimensionType {
    CATEGORICAL = 'CATEGORICAL',
    TIME = 'TIME',
}

export enum MetricFlowMetricType {
    SIMPLE = 'SIMPLE',
    CUMULATIVE = 'CUMULATIVE',
    DERIVED = 'DERIVED',
    RATIO = 'RATIO',
}

export enum TimeGranularity {
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH',
    QUARTER = 'QUARTER',
    YEAR = 'YEAR',
}

export type MetricFlowSemanticModel = {
    name: string;
    label?: string | null;
    description?: string | null;
};

export type MetricFlowOrderBy =
    | {
          type: 'metric';
          name: string;
          descending: boolean;
      }
    | {
          type: 'groupBy';
          name: string;
          grain?: TimeGranularity;
          descending: boolean;
      };

export type MetricFlowDimensionValuesRequest = {
    dimension: string;
    metrics?: string[];
    search?: string;
    limit?: number;
};

export function getMetricFlowDimensionValues(
    projectUuid: string,
    data: MetricFlowDimensionValuesRequest,
): Promise<FieldValueSearchResult<string>> {
    return lightdashApi<FieldValueSearchResult<string>>({
        url: `/projects/${projectUuid}/metricflow/dimension-values`,
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export type GetMetricFlowFieldsResponse = {
    dimensions: Array<{
        name: string;
        label?: string | null;
        description?: string;
        type: MetricFlowDimensionType;
        queryableGranularities: TimeGranularity[];
        semanticModel?: MetricFlowSemanticModel | null;
    }>;
    metricsForDimensions: Array<{
        name: string;
        label?: string | null;
        description?: string;
        type: MetricFlowMetricType;
        semanticModels?: MetricFlowSemanticModel[] | null;
        dimensions: Array<{
            name: string;
            label?: string | null;
            description?: string;
            type: MetricFlowDimensionType;
            queryableGranularities: TimeGranularity[];
            semanticModel?: MetricFlowSemanticModel | null;
        }>;
    }>;
};

export type GetSemanticLayerMetricsResponse = {
    metricsForDimensions: Array<{
        name: string;
        label?: string | null;
        description?: string;
        type: MetricFlowMetricType;
        semanticModels?: MetricFlowSemanticModel[] | null;
        dimensions: Array<{
            name: string;
            label?: string | null;
            description?: string;
            type: MetricFlowDimensionType;
            queryableGranularities: TimeGranularity[];
            semanticModel?: MetricFlowSemanticModel | null;
        }>;
    }>;
};

export function getMetricFlowFields(
    projectUuid: string,
    metrics: Record<string, {}>,
): Promise<GetMetricFlowFieldsResponse> {
    return lightdashApi<GetMetricFlowFieldsResponse>({
        url: `/projects/${projectUuid}/metricflow/fields`,
        method: 'POST',
        body: JSON.stringify({
            metrics: Object.keys(metrics),
        }),
    });
}

export function getMetricFlowMetricsForDimensions(
    projectUuid: string,
    dimensions: Record<string, { grain?: TimeGranularity }>,
): Promise<GetSemanticLayerMetricsResponse> {
    return lightdashApi<GetSemanticLayerMetricsResponse>({
        url: `/projects/${projectUuid}/metricflow/fields`,
        method: 'POST',
        body: JSON.stringify({
            dimensions: Object.entries(dimensions).map(([name, options]) => ({
                name,
                grain: options.grain ?? null,
            })),
        }),
    });
}

export type MetricDefinitionFilter = {
    dimension: string;
    operator: string;
    values?: Array<string | number | boolean | null>;
};

export type MetricDefinition = {
    name: string;
    label?: string | null;
    description?: string | null;
    type?: MetricFlowMetricType | string;
    formulaDisplay?: string | null;
    filterRaw?: string | null;
    filterStructured?: MetricDefinitionFilter[];
    filters?: MetricDefinitionFilter[];
    inputs?: {
        inputMetrics?: Array<{
            name: string;
            label?: string | null;
            filterRaw?: string | null;
            filterStructured?: MetricDefinitionFilter[];
        }>;
        inputMeasures?: Array<{
            name: string;
            label?: string | null;
            agg?: string | null;
            expr?: string | null;
            filterRaw?: string | null;
        }>;
    };
    dimensions?: Array<{
        name: string;
        label?: string | null;
    }>;
    semanticModels?: Array<{
        name: string;
        label?: string | null;
        description?: string | null;
    }>;
};

export type MetricLineageNode = {
    id: string;
    type: string;
    label?: string | null;
    name?: string | null;
    description?: string | null;
    metricType?: string | null;
    formulaDisplay?: string | null;
    filterRaw?: string | null;
    filterStructured?: MetricDefinitionFilter[] | null;
    agg?: string | null;
    expr?: string | null;
    identifier?: string | null;
    alias?: string | null;
    semanticModel?: string | null;
    relationType?: string | null;
    resourceType?: string | null;
    schema?: string | null;
    database?: string | null;
};

export type MetricLineageEdge = {
    from: string;
    to: string;
    type?: string | null;
};

export type MetricLineage = {
    metricDefinition?: MetricDefinition;
    lineage?: {
        nodes: MetricLineageNode[];
        edges: MetricLineageEdge[];
    };
};

export type CreateMetricFlowQueryResponse = {
    createQuery: {
        queryId: string;
    };
};

export async function getMetricDefinition(
    projectUuid: string,
    metricName: string,
): Promise<MetricDefinition | null> {
    return lightdashApi<MetricDefinition | null>({
        url: `/projects/${projectUuid}/metricflow/metrics/${encodeURIComponent(
            metricName,
        )}/definition`,
        method: 'GET',
    });
}

export async function getMetricLineage(
    projectUuid: string,
    metricName: string,
): Promise<MetricLineage | null> {
    return lightdashApi<MetricLineage | null>({
        url: `/projects/${projectUuid}/metricflow/metrics/${encodeURIComponent(
            metricName,
        )}/lineage`,
        method: 'GET',
    });
}

export type CompileMetricFlowSqlResponse = {
    sql: string | null;
    warnings: string[];
};

export function createMetricFlowQuery(
    projectUuid: string,
    data: {
        metrics: Record<string, {}>;
        dimensions: Record<string, { grain?: TimeGranularity }>;
        filters?: Filters;
        orderBy?: MetricFlowOrderBy[];
    },
): Promise<CreateMetricFlowQueryResponse> {
    const metrics = Object.keys(data.metrics).map((name) => ({ name }));
    const groupBy = Object.entries(data.dimensions ?? {}).map(
        ([name, options]) => ({
            name,
            grain: options.grain ?? null,
        }),
    );
    const orderBy =
        data.orderBy?.map((order) => {
            if (order.type === 'metric') {
                return {
                    metric: { name: order.name },
                    descending: order.descending,
                };
            }
            return {
                groupBy: {
                    name: order.name,
                    grain: order.grain ?? null,
                },
                descending: order.descending,
            };
        }) ?? [];

    return lightdashApi<CreateMetricFlowQueryResponse>({
        url: `/projects/${projectUuid}/metricflow/queries`,
        method: 'POST',
        body: JSON.stringify({
            metrics,
            groupBy,
            filters: data.filters,
            orderBy,
        }),
    });
}

export function compileMetricFlowSql(
    projectUuid: string,
    data: {
        metrics: Record<string, {}>;
        dimensions: Record<string, { grain?: TimeGranularity }>;
        filters?: Filters;
        orderBy?: MetricFlowOrderBy[];
        limit?: number;
    },
): Promise<CompileMetricFlowSqlResponse> {
    const metrics = Object.keys(data.metrics).map((name) => ({ name }));
    const groupBy = Object.entries(data.dimensions ?? {}).map(
        ([name, options]) => ({
            name,
            grain: options.grain ?? null,
        }),
    );
    const orderBy =
        data.orderBy?.map((order) => {
            if (order.type === 'metric') {
                return {
                    metric: { name: order.name },
                    descending: order.descending,
                };
            }
            return {
                groupBy: {
                    name: order.name,
                    grain: order.grain ?? null,
                },
                descending: order.descending,
            };
        }) ?? [];

    return lightdashApi<CompileMetricFlowSqlResponse>({
        url: `/projects/${projectUuid}/metricflow/compile-sql`,
        method: 'POST',
        body: JSON.stringify({
            metrics,
            groupBy,
            filters: data.filters,
            orderBy,
            limit: data.limit,
        }),
    });
}

export enum QueryStatus {
    SUCCEEDED = 'SUCCEEDED',
    RUNNING = 'RUNNING',
    FAILED = 'FAILED',
}

export type MetricFlowJsonResults = {
    schema: {
        fields: Array<{
            name: string;
            type: string;
        }>;
        primaryKey: Array<string>;
        pandas_version: string;
    };
    data: Array<{
        index: number;
        [key: string]: string | number | boolean | null;
    }>;
};

export type GetMetricFlowQueryResultsResponse = {
    query: {
        status: QueryStatus;
        sql: string | null;
        jsonResult: MetricFlowJsonResults | null;
        error: string | null;
    };
};

export function getMetricFlowQueryResults(
    projectUuid: string,
    queryId: string,
): Promise<GetMetricFlowQueryResultsResponse> {
    return lightdashApi<GetMetricFlowQueryResultsResponse>({
        url: `/projects/${projectUuid}/metricflow/queries/${encodeURIComponent(
            queryId,
        )}`,
        method: 'GET',
    });
}
