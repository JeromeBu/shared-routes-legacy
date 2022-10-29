import type { IRoute, RequestHandler, Router } from "express";
import type { PathParameters, SharedRoute } from "shared-routes";
import { UnknownSharedRoute } from "shared-routes/src/defineRoute";
import { Url } from "shared-routes/src/pathParameters";
import { z, ZodError } from "zod";

type ExpressSharedRouteOptions = {
  skipBodyValidation?: boolean;
  skipQueryValidation?: boolean;
};

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const makeValidationMiddleware =
  (
    route: UnknownSharedRoute,
    options: ExpressSharedRouteOptions,
  ): RequestHandler =>
  (req, res, next) => {
    try {
      if (!options.skipBodyValidation) {
        req.body = route.bodySchema.parse(req.body) as any;
      }
      if (!options.skipQueryValidation) {
        req.query = route.queryParamsSchema.parse(req.query) as any;
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
  route: UnknownSharedRoute,
  options: ExpressSharedRouteOptions,
): ((...handlers: RequestHandler[]) => IRoute) => {
  const validationMiddleware = makeValidationMiddleware(route, options);
  const url = route.url as string;

  return (...handlers: RequestHandler[]) =>
    expressRouter.route(url)[route.method](validationMiddleware, handlers);
};

export const createExpressSharedRouter = <
  SharedRoutes extends Record<string, UnknownSharedRoute>,
>(
  sharedRoutes: SharedRoutes,
  expressRouter: Router,
  options?: ExpressSharedRouteOptions,
): {
  expressSharedRouter: {
    [Route in keyof SharedRoutes]: (
      ...handlers: RequestHandler<
        PathParameters<SharedRoutes[Route]["url"]>,
        z.infer<SharedRoutes[Route]["outputSchema"]>,
        z.infer<SharedRoutes[Route]["bodySchema"]>,
        z.infer<SharedRoutes[Route]["queryParamsSchema"]>,
        any
      >[]
    ) => IRoute;
  };
} => {
  const objectOfHandlers = {} as Record<
    keyof SharedRoutes,
    (...handlers: RequestHandler[]) => IRoute
  >;

  keys(sharedRoutes).forEach((routeName) => {
    const sharedRoute = sharedRoutes[routeName];
    const handler = assignHandlersToExpressRouter(expressRouter, sharedRoute, {
      skipQueryValidation: false,
      skipBodyValidation: false,
      ...options,
    });
    objectOfHandlers[routeName] = handler;
  });

  return {
    expressSharedRouter: objectOfHandlers as any,
  };
};
