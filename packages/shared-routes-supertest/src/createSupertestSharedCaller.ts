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
  options: DefineRoutesOptions,
) => {
  const routePath = `/${options.pathPrefix}/${route.path}`;

  switch (route.verb) {
    case "get":
      return ({ params = {}, query, headers }: any) => {
        const path = replacePathWithParams(routePath, params);
        console.log("Calling GET path : ", path);
        return supertestRequest
          .get(replacePathWithParams(routePath, params))
          .set(headers ?? {})
          .query(query);
      };
    case "post":
      return ({ params = {}, body, query, headers }: any) => {
        const path = replacePathWithParams(routePath, params);
        console.log("Calling POST path : ", path);
        return supertestRequest
          .post(replacePathWithParams(routePath, params))
          .send(body)
          .set(headers ?? {})
          .query(query);
      };
    case "put":
      return ({ params = {}, body, query, headers }: any) =>
        supertestRequest
          .put(replacePathWithParams(routePath, params))
          .send(body)
          .set(headers ?? {})
          .query(query);
    case "patch":
      return ({ params = {}, body, query, headers }: any) =>
        supertestRequest
          .patch(replacePathWithParams(routePath, params))
          .send(body)
          .set(headers ?? {})
          .query(query);
    case "delete":
      return ({ params = {}, query, headers }: any) =>
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

type AnyObj = Record<string, unknown>;
type EmptyObj = Record<string, never>;

export const createSupertestSharedCaller = <
  Routers extends Record<
    string,
    Record<string, SharedRoute<string, unknown, unknown, unknown>>
  >,
>(
  sharedRouters: Routers,
  supertestRequest: SuperTest<Test>,
): {
  [RouterName in keyof Routers]: {
    [K in keyof Routers[RouterName]]: (
      // prettier-ignore
      params: ({ headers?: Record<string, string> })
        & (PathParameters<Routers[RouterName][K]["path"]> extends EmptyObj ? AnyObj : { params: PathParameters<Routers[RouterName][K]["path"]> })
        & (z.infer<Routers[RouterName][K]["bodySchema"]> extends void ? AnyObj : { body: z.infer<Routers[RouterName][K]["bodySchema"]> })
        & (z.infer<Routers[RouterName][K]["querySchema"]> extends void ? AnyObj : { query: z.infer<Routers[RouterName][K]["querySchema"]> }),
    ) => Promise<
      SupertestResponseWithOutput<
        z.infer<Routers[RouterName][K]["outputSchema"]>
      >
    >;
  };
} => {
  const objectOfHandlers = {} as {
    [RouterName in keyof Routers]: {
      [K in keyof Routers[RouterName]]: (...handlers: any[]) => any;
    };
  };

  keys(sharedRouters).forEach((routerName) => {
    const router = sharedRouters[routerName];
    if (!objectOfHandlers[routerName]) {
      objectOfHandlers[routerName] = {} as any;
    }

    keys(router).forEach((route) => {
      const sharedRoute = router[route];
      objectOfHandlers[routerName][route] = applyVerbAndPath(
        supertestRequest,
        sharedRoute,
        { pathPrefix: routerName as string },
      );
    });
  });

  return objectOfHandlers;
};
