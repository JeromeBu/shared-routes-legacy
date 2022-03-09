import { defineRoute, defineRoutes } from "shared-routes";
import type { SharedRoute } from "shared-routes";
import type { IRoute, RequestHandler, Router } from "express";
import { z } from "zod";

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const assignHandlersToExpressRouter = (
  expressRouter: Router,
  route: SharedRoute<any, any, any>
) => {
  switch (route.verb) {
    case "get":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).get(handlers);
    case "post":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).post(handlers);
    case "put":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).put(handlers);
    case "patch":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).patch(handlers);
    case "delete":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).delete(handlers);
    default:
      const shouldNotHappen: never = route.verb;
      throw new Error(route.verb + " : This HTTP verb is not handle");
      return shouldNotHappen;
  }
};

export const createExpressSharedRouter = <
  R extends Record<string, SharedRoute<unknown, unknown, unknown>>
>(
  sharedRoutes: R,
  expressRouter: Router
): {
  [K in keyof R]: (
    ...handlers: RequestHandler<
      unknown,
      z.infer<R[K]["outputSchema"]>,
      z.infer<R[K]["bodySchema"]>,
      z.infer<R[K]["querySchema"]>,
      any
    >[]
  ) => IRoute;
} => {
  const objectOfHandlers = {} as Record<
    keyof R,
    (...handlers: RequestHandler[]) => IRoute
  >;

  keys(sharedRoutes).forEach((routeName) => {
    const sharedRoute = sharedRoutes[routeName];
    objectOfHandlers[routeName] = assignHandlersToExpressRouter(
      expressRouter,
      sharedRoute
    );
  });

  return objectOfHandlers as any;
};
