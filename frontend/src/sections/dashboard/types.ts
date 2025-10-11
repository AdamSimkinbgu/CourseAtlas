import type { UseQueryResult } from "@tanstack/react-query";

import type { GraphSummary } from "./useGraphsQuery";
import type { TemplateSummary } from "./useTemplatesQuery";

export type UseGraphsQueryResult = UseQueryResult<GraphSummary[], Error>;
export type UseTemplatesQueryResult = UseQueryResult<TemplateSummary[], Error>;
