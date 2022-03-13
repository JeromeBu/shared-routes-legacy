import { PathParameters, replacePathWithParams } from "shared-routes";
import type { SharedRoute } from "shared-routes";
import type { SuperTest, Test, Response } from "supertest";
import { z } from "zod";
import express from "express";

express();

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const applyVerbAndPath = (
  supertestRequest: SuperTest<Test>,
  route: SharedRoute<string, any, any, any>
) => {
  switch (route.verb) {
    case "get":
      return ({ params, query, headers }: any) =>
        supertestRequest
          .get(replacePathWithParams(route.path, params))
          .set(headers ?? {})
          .query(query);
    case "post":
      return ({ params, body, query, headers }: any) =>
        supertestRequest
          .post(replacePathWithParams(route.path, params))
          .send(body)
          .set(headers ?? {})
          .query(query);
    case "put":
      return ({ params, body, query, headers }: any) =>
        supertestRequest
          .put(replacePathWithParams(route.path, params))
          .send(body)
          .set(headers ?? {})
          .query(query);
    case "patch":
      return ({ params, body, query, headers }: any) =>
        supertestRequest
          .patch(replacePathWithParams(route.path, params))
          .send(body)
          .set(headers ?? {})
          .query(query);
    case "delete":
      return ({ params, query, headers }: any) =>
        supertestRequest
          .delete(replacePathWithParams(route.path, params))
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
  sharedRoutes: R,
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

  keys(sharedRoutes).forEach((routeName) => {
    const sharedRoute = sharedRoutes[routeName];
    objectOfHandlers[routeName] = applyVerbAndPath(
      supertestRequest,
      sharedRoute
    );
  });

  return objectOfHandlers;
};
