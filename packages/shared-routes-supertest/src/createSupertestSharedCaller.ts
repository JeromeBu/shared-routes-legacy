import { PathParameters, replacePathWithParams } from "shared-routes";
import type { SharedRoute, DefineRoutesOptions } from "shared-routes";
import type { SuperTest, Test, Response } from "supertest";
import { z } from "zod";
import express from "express";

express();

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const applyVerbAndPath = (
  supertestRequest: SuperTest<Test>,
  route: SharedRoute<string, any, any, any>,
  options: DefineRoutesOptions
) => {
  const routePath = options.pathPrefix + route.path;

  switch (route.verb) {
    case "get":
      return ({ params, query, headers }: any) =>
        supertestRequest
          .get(replacePathWithParams(routePath, params))
          .set(headers ?? {})
          .query(query);
    case "post":
      return ({ params, body, query, headers }: any) =>
        supertestRequest
          .post(replacePathWithParams(routePath, params))
          .send(body)
          .set(headers ?? {})
          .query(query);
    case "put":
      return ({ params, body, query, headers }: any) =>
        supertestRequest
          .put(replacePathWithParams(routePath, params))
          .send(body)
          .set(headers ?? {})
          .query(query);
    case "patch":
      return ({ params, body, query, headers }: any) =>
        supertestRequest
          .patch(replacePathWithParams(routePath, params))
          .send(body)
          .set(headers ?? {})
          .query(query);
    case "delete":
      return ({ params, query, headers }: any) =>
        supertestRequest
          .delete(replacePathWithParams(routePath, params))
          .set(headers ?? {})
          .query(query);
    default:
      const shouldNotHappen: never = route.verb;
      throw new Error(route.verb + " : This HTTP verb is not handle");
      return shouldNotHappen;
  }
};

type SupertestResponseWithOutput<Output> = Omit<Response, "body"> & {
  body: Output;
};

export const createSupertestSharedCaller = <
  R extends Record<string, SharedRoute<string, unknown, unknown, unknown>>
>(
  { routes, routeOptions }: { routes: R; routeOptions: DefineRoutesOptions },
  supertestRequest: SuperTest<Test>
): {
  [K in keyof R]: (params: {
    params: PathParameters<R[K]["path"]>;
    body: z.infer<R[K]["bodySchema"]>;
    query: z.infer<R[K]["querySchema"]>;
    headers?: Record<string, string>;
  }) => Promise<SupertestResponseWithOutput<z.infer<R[K]["outputSchema"]>>>;
} => {
  const objectOfHandlers = {} as Record<keyof R, (...handlers: any[]) => any>;

  keys(routes).forEach((routeName) => {
    const sharedRoute = routes[routeName];
    objectOfHandlers[routeName] = applyVerbAndPath(
      supertestRequest,
      sharedRoute,
      { pathPrefix: routeOptions.pathPrefix }
    );
  });

  return objectOfHandlers;
};
