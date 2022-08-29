import { z } from "zod";

type OptionalFields<Body, Query, Output> = {
  bodySchema?: z.Schema<Body>;
  querySchema?: z.Schema<Query>;
  outputSchema?: z.Schema<Output>;
};

type VerbAndPath<Path extends string> = {
  path: Path;
  verb: "get" | "post" | "put" | "patch" | "delete";
};

type SharedRouteWithOptional<
  Path extends string,
  Body,
  Query,
  Output,
> = VerbAndPath<Path> & OptionalFields<Body, Query, Output>;

export type SharedRoute<
  Path extends string,
  Body,
  Query,
  Output,
> = VerbAndPath<Path> & Required<OptionalFields<Body, Query, Output>>;

export const defineRoute = <
  Path extends string,
  Body = void,
  Query = void,
  Output = void,
>(
  route: SharedRouteWithOptional<Path, Body, Query, Output>,
): SharedRoute<Path, Body, Query, Output> => ({
  bodySchema: z.object({}).strict() as any,
  querySchema: z.object({}).strict() as any,
  outputSchema: z.void() as any,
  ...route,
});

export type DefineRoutesOptions = {
  pathPrefix: string;
};

export const defineRoutes = <T extends Record<string, unknown>>(
  routes: {
    [K in keyof T]: T[K];
  },
  routeOptions: DefineRoutesOptions = { pathPrefix: "/" },
) => {
  const occurrencesByPathAndVerb: Record<string, number> = {};

  for (const route of Object.values(routes)) {
    const name = `${route.verb.toUpperCase()} ${
      routeOptions.pathPrefix === "/" ? "" : routeOptions.pathPrefix
    }${route.path.toLowerCase()}`;
    const occurrence = (occurrencesByPathAndVerb[name] ?? 0) + 1;
    if (occurrence > 1)
      throw new Error(
        `You cannot have several routes with same verb and path, got: ${name} twice (at least)`,
      );
    occurrencesByPathAndVerb[name] = occurrence;
  }

  const listRoutes = () => Object.keys(occurrencesByPathAndVerb);

  return { routes, routeOptions, listRoutes };
};

export const definePrefixedRoute = <T extends Record<string, unknown>>(
  pathPrefix: string,
  routeDefinitions: { [K in keyof T]: T[K] },
) => defineRoutes(routeDefinitions, { pathPrefix });

export const combineRouters = <
  T extends Record<
    string,
    Record<string, SharedRoute<string, unknown, unknown, unknown>>
  >,
  Routers extends {
    [RouterName in keyof T]: {
      [RouteLabel in keyof T[RouterName]]: T[RouterName][RouteLabel];
    };
  },
>(
  sharedRouters: Routers,
): { sharedRouters: Routers; listRoutes: () => string[] } => {
  const occurrencesByPathAndVerb: Record<string, number> = {};

  for (const routerName of Object.keys(sharedRouters)) {
    const sharedRouter = sharedRouters[routerName];
    for (const sharedRoute of Object.values(sharedRouter)) {
      const name = `${(
        sharedRoute as SharedRoute<any, any, any, any>
      ).verb.toUpperCase()} /${[
        routerName.toLowerCase(),
        ...(sharedRoute.path ? [sharedRoute.path.toLowerCase()] : []),
      ].join("/")}`;
      const occurrence = (occurrencesByPathAndVerb[name] ?? 0) + 1;
      if (occurrence > 1)
        throw new Error(
          `You cannot have several routes with same verb and path, got: ${name} twice (at least)`,
        );
      occurrencesByPathAndVerb[name] = occurrence;
    }
  }

  const listRoutes = () => Object.keys(occurrencesByPathAndVerb);
  return { sharedRouters: sharedRouters, listRoutes };
};
