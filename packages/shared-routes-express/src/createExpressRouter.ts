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
    default:
      throw new Error(route.verb + " : This HTTP verb is not handle yet");
  }
};

export const createExpressSharedRouter = <
  R extends Record<string, SharedRoute<unknown, unknown, unknown>>
>(
  sharedRoutes: R,
  expressRouter: Router
): Record<
  keyof R,
  (
    ...handlers: RequestHandler<
      unknown,
      z.infer<R[keyof R]["outputSchema"]>,
      z.infer<R[keyof R]["bodySchema"]>,
      z.infer<R[keyof R]["querySchema"]>,
      any
    >[]
  ) => IRoute
> => {
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

// minimale reproduction :

const addTrucBodySchema = z.object({ truc: z.string() });

const getTrucQuerySchema = z.object({ lala: z.string() });
const getTrucOutputSchema = z.array(
  z.object({ id: z.string(), name: z.string() })
);

const mySharedRoutes = defineRoutes({
  addTruc: defineRoute({
    verb: "post",
    path: "/truc",
    bodySchema: addTrucBodySchema,
  }),
  getTruc: defineRoute({
    verb: "get",
    path: "/truc",
    querySchema: getTrucQuerySchema,
    outputSchema: getTrucOutputSchema,
  }),
});

declare function createGetType<
  R extends Record<string, SharedRoute<unknown, unknown, unknown>>
>(sharedRoutes: R): Record<keyof R, z.infer<R[keyof R]["bodySchema"]>>;

const getType = createGetType(mySharedRoutes);

const addTruc = getType.addTruc; // this is of type  void | {truc: string}
const getTruc = getType.getTruc; // this is of type  void | {truc: string}

// how to get ? :
const addTrucExpected = getType.addTruc; // expecting type  {truc: string}
const getTrucExpecetd = getType.getTruc; // expecting type  void
