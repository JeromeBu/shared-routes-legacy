import type { SharedRoute, PathParameters } from "shared-routes";
import type { IRoute, RequestHandler, Router } from "express";
import { z } from "zod";

type ExpressSharedRouteOptions = {
  withBodyValidation?: boolean;
  withQueryValidation?: boolean;
};

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const makeValidationMiddleware =
  (
    route: SharedRoute<string, any, any, any>,
    options?: ExpressSharedRouteOptions
  ): RequestHandler =>
  (req, res, next) => {
    if (options?.withBodyValidation) route.bodySchema.parse(req.body);
    if (options?.withQueryValidation) route.bodySchema.parse(req.query);
    next();
  };

const assignHandlersToExpressRouter = (
  expressRouter: Router,
  route: SharedRoute<any, any, any, any>,
  options?: ExpressSharedRouteOptions
) => {
  const validationMiddleware = makeValidationMiddleware(route, options);

  switch (route.verb) {
    case "get":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).get(validationMiddleware, handlers);
    case "post":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).post(validationMiddleware, handlers);
    case "put":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).put(validationMiddleware, handlers);
    case "patch":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).patch(validationMiddleware, handlers);
    case "delete":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(route.path).delete(validationMiddleware, handlers);
    default:
      const shouldNotHappen: never = route.verb;
      throw new Error(route.verb + " : This HTTP verb is not handle");
      return shouldNotHappen;
  }
};

export const createExpressSharedRouter = <
  R extends Record<string, SharedRoute<string, unknown, unknown, unknown>>
>(
  sharedRoutes: R,
  expressRouter: Router,
  options?: ExpressSharedRouteOptions
): {
  [K in keyof R]: (
    ...handlers: RequestHandler<
      PathParameters<R[K]["path"]>,
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
      sharedRoute,
      options
    );
  });

  return objectOfHandlers as any;
};
