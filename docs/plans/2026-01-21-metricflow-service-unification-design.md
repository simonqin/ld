# MetricFlow Service 统一方案设计

目标：仅保留 MetricFlow Service 作为语义层执行入口，前后端统一走 Lightdash 后端的 `/api/v1/projects/:projectUuid/metricflow/*`，消除 dbtsemanticlayer 与 MetricFlow 的混杂调用路径。

## 1) 架构

前端所有 MetricFlow 相关调用统一指向 Lightdash 后端的 MetricFlow 控制器，由后端转发至 MetricFlow Service（FastAPI）。后端作为唯一网关负责鉴权、配置（`METRICFLOW_BASE_URL`/`METRICFLOW_TOKEN`）、错误映射与日志。前端仅保留一套 `MetricFlow*` 类型与 REST API 封装，不再使用 `/projects/:projectUuid/dbtsemanticlayer` GraphQL。服务端仍保留项目级 `metricFlow.projectId/apiToken` 配置，用于指定 project 以及覆盖 token。这样能确保业务逻辑集中、命名一致、可维护性强；代价是多一跳请求，但由后端统一超时/重试与日志管理可控。

## 2) 数据流

前端 `MetricFlowAPI` 统一调用后端 REST（`/metricflow/fields`、`/metricflow/dimension-values`、`/metricflow/queries`、`/metricflow/queries/:id`、`/metricflow/compile-sql` 等）。Explore/Filters/SQL 组件与 hooks 只依赖这些 REST 接口与 `MetricFlow*` 类型。后端 `MetricFlowController` 负责将 MetricFlow Service 响应规整为前端可直接使用的结构（如 `FieldValueSearchResult`、`MetricFlowJsonResults`），并保持查询状态、SQL、warnings 结构稳定。该数据流确保前端只处理 UI 与查询状态，服务端统一处理错误、权限、配置与请求 shape。

## 3) 错误处理与测试

`MetricFlowRestClient` 统一处理 `ok=false` 与 HTTP 非 2xx，抛出带 `code/message` 的错误；`MetricFlowController` 将错误转换为 Lightdash 标准 `ApiErrorPayload`。对查询结果状态（RUNNING/FAILED）保留状态字段，前端继续轮询或展示错误。测试层面：
- 后端单测：`MetricFlowController` 的 `toJsonResult` 与 dimension-values 过滤/limit 逻辑。
- 前端单测：`convertMetricFlowQueryResultsToResultsData` 兼容 REST 返回格式的测试。
- E2E 冒烟：fields → query → results → SQL 展示一条主链路。

## 4) MetricFlow Service API 目标（与 Lightdash 后端对齐）

- 全部响应使用 envelope：`{ ok, data, error }`。
- `POST /api/queries` 返回 `{ createQuery: { queryId } }`。
- `GET /api/queries/{queryId}` 返回 `query`，其中 `rows` 建议为对象数组（键为列名），以便后端直接展开；若保留二维数组，需后端转换。
- `POST /api/compile-sql` 返回 `{ compileSql: { sql, warnings } }`。
- `POST /api/dimension-values` 统一返回 `values`（或 `dimensionValues` 二选一，建议只保留一个字段）。
- `POST /api/query/validate` 保留；`/api/validate` 仅作兼容。
- `metrics/groupBy/orderBy/filters` 结构保持与现有 REST_API.md 一致。
