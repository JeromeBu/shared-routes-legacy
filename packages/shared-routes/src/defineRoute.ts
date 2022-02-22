import { z } from "zod";

type OptionalFields<Body, Query, Output> = {
  bodySchema?: z.Schema<Body>;
  querySchema?: z.Schema<Query>;
  outputSchema?: z.Schema<Output>;
  // paramSchema?: z.Schema<Param>; => will see how to handle params with path later
};

type CommonFields = {
  path: string;
  verb: "get" | "post";
};

type SharedRouteWithOptional<Body, Query, Output> = OptionalFields<
  Body,
  Query,
  Output
> &
  CommonFields;

export type SharedRoute<Body, Query, Output> = Required<
  OptionalFields<Body, Query, Output>
> &
  CommonFields;

export const defineRoute = <Body = void, Query = void, Output = void>(
  route: SharedRouteWithOptional<Body, Query, Output>
): SharedRoute<Body, Query, Output> => ({
  bodySchema: z.void() as any,
  querySchema: z.void() as any,
  outputSchema: z.void() as any,
  ...route,
});

export const defineRoutes = <T extends Record<string, unknown>>(routes: {
  [K in keyof T]: T[K];
}) => routes;
