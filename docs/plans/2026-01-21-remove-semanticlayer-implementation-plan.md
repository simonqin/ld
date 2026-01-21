# Remove SemanticLayer Usage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove dbt Semantic Layer (GraphQL) usage from the frontend and route all MetricFlow queries through the Lightdash backend MetricFlow REST proxy.

**Architecture:** Replace GraphQL-based `MetricFlowAPI` functions with REST calls to `/api/v1/projects/:projectUuid/metricflow/*`, update hooks/pages/routes to use REST fields/queries, and remove `/dbtsemanticlayer` routes and menu items. Keep MetricFlow UI but move it under a MetricFlow-specific route.

**Tech Stack:** React + TypeScript, lightdashApi client, React Query, Jest (frontend tests).

### Task 1: Replace MetricFlow API GraphQL calls with REST and add tests

**Files:**
- Create: `packages/frontend/src/api/MetricFlowAPI.test.ts`
- Modify: `packages/frontend/src/api/MetricFlowAPI.ts`

**Step 1: Write the failing test**

```typescript
import { lightdashApi } from '../api';
import {
    getMetricFlowDimensionValues,
    createMetricFlowQuery,
    getMetricFlowQueryResults,
    getMetricDefinition,
    getMetricLineage,
    getMetricFlowFields,
    getMetricFlowMetricsForDimensions,
} from './MetricFlowAPI';

jest.mock('../api', () => ({
    lightdashApi: jest.fn(),
}));

const mockedApi = lightdashApi as jest.Mock;

test('metricflow API uses REST routes', async () => {
    mockedApi.mockResolvedValueOnce({ status: 'ok', results: { search: '', results: [], cached: false, refreshedAt: new Date() } });
    await getMetricFlowDimensionValues('proj', { dimension: 'country' });
    expect(mockedApi).toHaveBeenCalledWith(expect.objectContaining({
        url: '/projects/proj/metricflow/dimension-values',
        method: 'POST',
    }));
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F frontend test packages/frontend/src/api/MetricFlowAPI.test.ts`
Expected: FAIL, because routes still point to `/dbtsemanticlayer` or functions missing.

**Step 3: Write minimal implementation**

```typescript
export function getMetricFlowDimensionValues(projectUuid: string, data: MetricFlowDimensionValuesRequest) {
    return lightdashApi<FieldValueSearchResult<string>>({
        url: `/projects/${projectUuid}/metricflow/dimension-values`,
        method: 'POST',
        body: JSON.stringify(data),
    });
}
```

Add REST wrappers:
- `getMetricFlowFields(projectUuid, metrics)` → POST `/projects/:projectUuid/metricflow/fields`
- `getMetricFlowMetricsForDimensions(projectUuid, dimensions)` → same endpoint with `dimensions` body
- `createMetricFlowQuery(projectUuid, data)` → POST `/projects/:projectUuid/metricflow/queries`
- `getMetricFlowQueryResults(projectUuid, queryId)` → GET `/projects/:projectUuid/metricflow/queries/:queryId`
- `getMetricDefinition(projectUuid, metricName)` → GET `/projects/:projectUuid/metricflow/metrics/:metricName/definition`
- `getMetricLineage(projectUuid, metricName)` → GET `/projects/:projectUuid/metricflow/metrics/:metricName/lineage`
- `compileMetricFlowSql(projectUuid, data)` → POST `/projects/:projectUuid/metricflow/compile-sql`

Remove GraphQL-only helpers (`serializeFiltersInput`, `parseGraphqlJsonScalar`, etc.) and delete `getSemanticLayerDimensions`/`getSemanticLayerMetrics`.

**Step 4: Run test to verify it passes**

Run: `pnpm -F frontend test packages/frontend/src/api/MetricFlowAPI.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/frontend/src/api/MetricFlowAPI.ts packages/frontend/src/api/MetricFlowAPI.test.ts
git commit -m "refactor: move metricflow api to rest"
```

### Task 2: Update hooks and MetricFlow page to use REST fields APIs

**Files:**
- Modify: `packages/frontend/src/features/metricFlow/hooks/useSemanticLayerDimensions.ts`
- Modify: `packages/frontend/src/features/metricFlow/hooks/useSemanticLayerMetrics.ts`
- Modify: `packages/frontend/src/pages/MetricFlow.tsx`

**Step 1: Write the failing test**

```typescript
import { getMetricFlowFields } from '../../api/MetricFlowAPI';
import useSemanticLayerDimensions from './useSemanticLayerDimensions';

jest.mock('../../api/MetricFlowAPI');

const mockedGetFields = getMetricFlowFields as jest.Mock;

test('useSemanticLayerDimensions uses REST fields', () => {
    mockedGetFields.mockResolvedValue({ dimensions: [], metricsForDimensions: [] });
    // Render hook and assert getMetricFlowFields called with metrics.
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F frontend test packages/frontend/src/features/metricFlow/hooks/useSemanticLayerDimensions.test.ts`
Expected: FAIL because hook still calls GraphQL function.

**Step 3: Write minimal implementation**

```typescript
return useQuery({
    queryFn: () => getMetricFlowFields(projectUuid!, metrics),
    ...
});
```

Do the same for metrics-for-dimensions hook (call new REST helper). Update MetricFlow page usages if it still calls removed GraphQL helpers.

**Step 4: Run test to verify it passes**

Run: `pnpm -F frontend test packages/frontend/src/features/metricFlow/hooks/useSemanticLayerDimensions.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/frontend/src/features/metricFlow/hooks/useSemanticLayerDimensions.ts packages/frontend/src/features/metricFlow/hooks/useSemanticLayerMetrics.ts packages/frontend/src/pages/MetricFlow.tsx
git commit -m "refactor: use metricflow rest fields"
```

### Task 3: Remove /dbtsemanticlayer routes and menu entries

**Files:**
- Modify: `packages/frontend/src/Routes.tsx`
- Modify: `packages/frontend/src/components/NavBar/ExploreMenu.tsx`

**Step 1: Write the failing test**

```typescript
import { routes } from './Routes';

test('dbtsemanticlayer route removed', () => {
    expect(routes.flatMap(r => r.children ?? [])).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ path: '/projects/:projectUuid/dbtsemanticlayer' })])
    );
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F frontend test packages/frontend/src/Routes.test.tsx`
Expected: FAIL because route still exists.

**Step 3: Write minimal implementation**

Replace route path with `/projects/:projectUuid/metricflow` and update nav link/title (remove `hasDbtSemanticLayer` gating if semantic layer is removed).

**Step 4: Run test to verify it passes**

Run: `pnpm -F frontend test packages/frontend/src/Routes.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/frontend/src/Routes.tsx packages/frontend/src/components/NavBar/ExploreMenu.tsx
git commit -m "refactor: rename metricflow route"
```

### Task 4: Remove remaining dbtsemanticlayer references

**Files:**
- Modify: `packages/frontend/src/api/MetricFlowAPI.ts`
- Modify: `packages/frontend/src/components/NavBar/ExploreMenu.tsx`
- Modify: `packages/frontend/src/Routes.tsx`
- Modify: `packages/frontend/src/pages/MetricFlow.tsx`

**Step 1: Write the failing test**

```typescript
import { readFileSync } from 'fs';

test('dbtsemanticlayer strings removed', () => {
    const content = readFileSync('packages/frontend/src/api/MetricFlowAPI.ts', 'utf8');
    expect(content).not.toContain('dbtsemanticlayer');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm -F frontend test packages/frontend/src/api/MetricFlowAPI.test.ts`
Expected: FAIL until strings removed.

**Step 3: Write minimal implementation**

Remove any remaining `dbtsemanticlayer` strings and related logic.

**Step 4: Run test to verify it passes**

Run: `pnpm -F frontend test packages/frontend/src/api/MetricFlowAPI.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/frontend/src/api/MetricFlowAPI.ts packages/frontend/src/Routes.tsx packages/frontend/src/components/NavBar/ExploreMenu.tsx packages/frontend/src/pages/MetricFlow.tsx
git commit -m "refactor: remove semanticlayer references"
```
