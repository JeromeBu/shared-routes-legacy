import type {
  SharedRoute,
  PathParameters,
  DefineRoutesOptions,
} from "shared-routes";
import type { IRoute, RequestHandler, Router } from "express";
import { z, ZodError } from "zod";

type ExpressSharedRouteOptions = {
  skipBodyValidation?: boolean;
  skipQueryValidation?: boolean;
};

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const makeValidationMiddleware =
  (
    route: SharedRoute<string, any, any, any>,
    options: ExpressSharedRouteOptions,
  ): RequestHandler =>
  (req, res, next) => {
    try {
      if (!options.skipBodyValidation) route.bodySchema.parse(req.body);
      if (!options.skipQueryValidation) {
        req.query = route.querySchema.parse(req.query);
      }
      next();
    } catch (e) {
      const error = e as ZodError;
      res.status(400);
      res.json(
        error.issues.map(
          ({ message, path }) => `${path.join(".")} : ${message}`,
        ),
      );
    }
  };

const assignHandlersToExpressRouter = (
  expressRouter: Router,
  route: SharedRoute<any, any, any, any>,
  options: ExpressSharedRouteOptions & DefineRoutesOptions,
) => {
  const validationMiddleware = makeValidationMiddleware(route, options);
  const path = `/${route.path}`;

  switch (route.verb) {
    case "get":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(path).get(validationMiddleware, handlers);
    case "post":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(path).post(validationMiddleware, handlers);
    case "put":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(path).put(validationMiddleware, handlers);
    case "patch":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(path).patch(validationMiddleware, handlers);
    case "delete":
      return (...handlers: RequestHandler[]) =>
        expressRouter.route(path).delete(validationMiddleware, handlers);
    default:
      const shouldNotHappen: never = route.verb;
      throw new Error(route.verb + " : This HTTP verb is not handle");

      return shouldNotHappen;
  }
};

export const createExpressSharedRouter = <
  SharedRouters extends Record<
    string,
    Record<string, SharedRoute<string, unknown, unknown, unknown>>
  >,
  RouterName extends keyof SharedRouters,
>(
  {
    sharedRouters,
    routerName,
  }: { sharedRouters: SharedRouters; routerName: RouterName },
  expressRouter: Router,
  options?: ExpressSharedRouteOptions,
): {
  expressSharedRouter: {
    [K in keyof SharedRouters[RouterName]]: (
      ...handlers: RequestHandler<
        PathParameters<SharedRouters[RouterName][K]["path"]>,
        z.infer<SharedRouters[RouterName][K]["outputSchema"]>,
        z.infer<SharedRouters[RouterName][K]["bodySchema"]>,
        z.infer<SharedRouters[RouterName][K]["querySchema"]>,
        any
      >[]
    ) => IRoute;
  };
  pathPrefix: string;
} => {
  const objectOfHandlers = {} as Record<
    keyof SharedRouters[RouterName],
    (...handlers: RequestHandler[]) => IRoute
  >;

  const routes = sharedRouters[routerName];

  keys(routes).forEach((routeName) => {
    const sharedRoute = routes[routeName];
    objectOfHandlers[routeName] = assignHandlersToExpressRouter(
      expressRouter,
      sharedRoute,
      {
        skipQueryValidation: false,
        skipBodyValidation: false,
        ...options,
        pathPrefix: routerName as string,
      },
    );
  });

  return {
    expressSharedRouter: objectOfHandlers as any,
    pathPrefix: `/${routerName as string}`,
  };
};
