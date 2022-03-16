import type {
  SharedRoute,
  PathParameters,
  DefineRoutesOptions,
} from "shared-routes";
import type { IRoute, RequestHandler, Router } from "express";
import { z, ZodError } from "zod";

type ExpressSharedRouteOptions = {
  withBodyValidation?: boolean;
  withQueryValidation?: boolean;
};

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const makeValidationMiddleware =
  (
    route: SharedRoute<string, any, any, any>,
    options: ExpressSharedRouteOptions
  ): RequestHandler =>
  (req, res, next) => {
    try {
      if (options.withBodyValidation) route.bodySchema.parse(req.body);
      if (options.withQueryValidation) {
        req.query = route.querySchema.parse(req.query);
      }
      next();
    } catch (e) {
      const error = e as ZodError;
      res.status(400);
      res.json(
        error.issues.map(
          ({ message, path }) => `${path.join(".")} : ${message}`
        )
      );
    }
  };

const assignHandlersToExpressRouter = (
  expressRouter: Router,
  route: SharedRoute<any, any, any, any>,
  options: ExpressSharedRouteOptions & DefineRoutesOptions
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
  { routes, routeOptions }: { routes: R; routeOptions: DefineRoutesOptions },
  expressRouter: Router,
  options?: ExpressSharedRouteOptions
): {
  sharedRouter: {
    [K in keyof R]: (
      ...handlers: RequestHandler<
        PathParameters<R[K]["path"]>,
        z.infer<R[K]["outputSchema"]>,
        z.infer<R[K]["bodySchema"]>,
        z.infer<R[K]["querySchema"]>,
        any
      >[]
    ) => IRoute;
  };
  pathPrefix: string;
} => {
  const objectOfHandlers = {} as Record<
    keyof R,
    (...handlers: RequestHandler[]) => IRoute
  >;

  keys(routes).forEach((routeName) => {
    const sharedRoute = routes[routeName];
    objectOfHandlers[routeName] = assignHandlersToExpressRouter(
      expressRouter,
      sharedRoute,
      {
        withQueryValidation: false,
        withBodyValidation: false,
        ...options,
        ...routeOptions,
      }
    );
  });

  return {
    sharedRouter: objectOfHandlers as any,
    pathPrefix: routeOptions.pathPrefix,
  };
};
