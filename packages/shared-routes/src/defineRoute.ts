import { z } from "zod";
import { Url } from "./pathParameters";

type OptionalFields<Body, Query, Output> = {
  bodySchema?: z.Schema<Body>;
  queryParamsSchema?: z.Schema<Query>;
  outputSchema?: z.Schema<Output>;
};

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
type MethodAndUrl<U extends Url> = {
  method: HttpMethod;
  url: U;
};

type SharedRouteWithOptional<
  U extends Url,
  Body,
  Query,
  Output,
> = MethodAndUrl<U> & OptionalFields<Body, Query, Output>;

export type SharedRoute<U extends Url, Body, Query, Output> = MethodAndUrl<U> &
  Required<OptionalFields<Body, Query, Output>>;

export type UnknownSharedRoute = SharedRoute<Url, unknown, unknown, unknown>;

export const defineRoute = <
  U extends Url,
  Body = void,
  Query = void,
  Output = void,
>(
  route: SharedRouteWithOptional<U, Body, Query, Output>,
): SharedRoute<U, Body, Query, Output> => ({
  bodySchema: z.object({}).strict() as any,
  queryParamsSchema: z.object({}).strict() as any,
  outputSchema: z.void() as any,
  ...route,
});

const verifyRoutesUniqAndListRoutes = <
  T extends Record<string, UnknownSharedRoute>,
>(routes: {
  [K in keyof T]: T[K];
}): string[] => {
  const occurrencesByMethodAndUrl: Record<string, number> = {};

  for (const route of Object.values(routes) as UnknownSharedRoute[]) {
    const name = `${route.method.toUpperCase()} ${route.url.toLowerCase()}`;
    const occurrence = (occurrencesByMethodAndUrl[name] ?? 0) + 1;
    if (occurrence > 1)
      throw new Error(
        `You cannot have several routes with same http method and url, got: ${name} twice (at least)`,
      );
    occurrencesByMethodAndUrl[name] = occurrence;
  }
  return Object.keys(occurrencesByMethodAndUrl);
};

export const defineRoutes = <
  T extends Record<string, UnknownSharedRoute>,
>(routes: {
  [K in keyof T]: T[K];
}) => {
  const routeList = verifyRoutesUniqAndListRoutes(routes);
  return { routes, listRoutes: () => routeList };
};
