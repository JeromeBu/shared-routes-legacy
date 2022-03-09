import type { SharedRoute } from "shared-routes";
import type { SuperTest, Test, Response } from "supertest";
import { z } from "zod";

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const applyVerbAndPath = (
  supertestRequest: SuperTest<Test>,
  route: SharedRoute<any, any, any>
) => {
  switch (route.verb) {
    case "get":
      return ({ query }: any) => supertestRequest.get(route.path).query(query);
    case "post":
      return ({ body, query }: any) =>
        supertestRequest.post(route.path).send(body).query(query);
    case "put":
      return ({ body, query }: any) =>
        supertestRequest.put(route.path).send(body).query(query);
    case "patch":
      return ({ body, query }: any) =>
        supertestRequest.patch(route.path).send(body).query(query);
    case "delete":
      return ({ query }: any) =>
        supertestRequest.delete(route.path).query(query);
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
  R extends Record<string, SharedRoute<unknown, unknown, unknown>>
>(
  sharedRoutes: R,
  supertestRequest: SuperTest<Test>
): {
  [K in keyof R]: (params: {
    body: z.infer<R[K]["bodySchema"]>;
    query: z.infer<R[K]["querySchema"]>;
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
