import { defineRoute, defineRoutes } from "shared-routes";
import type { SharedRoute } from "shared-routes";
import { z } from "zod";
import axios, { AxiosRequestConfig } from "axios";
import type { AxiosInstance } from "axios";

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const applyVerbAndPath = (
  axios: AxiosInstance,
  route: SharedRoute<any, any, any>
) => {
  switch (route.verb) {
    case "get":
      return ({ query }: any, config: AxiosRequestConfig) =>
        axios.get(route.path, { params: query, ...config });
    case "post":
      return ({ body, query }: any, config: AxiosRequestConfig) =>
        axios.post(route.path, body, { params: query, ...config });
    case "put":
      return ({ body, query }: any, config: AxiosRequestConfig) =>
        axios.put(route.path, body, { params: query, ...config });
    case "patch":
      return ({ body, query }: any, config: AxiosRequestConfig) =>
        axios.patch(route.path, body, { params: query, ...config });
    case "delete":
      return ({ body, query }: any, config: AxiosRequestConfig) =>
        axios.delete(route.path, { params: query, ...config });
    default:
      const shouldNotHappen: never = route.verb;
      throw new Error(route.verb + " : This HTTP verb is not handle");
      return shouldNotHappen;
  }
};

export const createAxiosSharedCaller = <
  R extends Record<string, SharedRoute<unknown, unknown, unknown>>
>(
  sharedRoutes: R,
  axios: AxiosInstance
): {
  [K in keyof R]: (params: {
    body: z.infer<R[K]["bodySchema"]>;
    query: z.infer<R[K]["querySchema"]>;
  }) => Promise<z.infer<R[K]["outputSchema"]>>;
} => {
  const objectOfHandlers = {} as Record<
    keyof R,
    (params: { body: any; query: any }, config?: any) => Promise<any>
  >;

  keys(sharedRoutes).forEach((routeName) => {
    const sharedRoute = sharedRoutes[routeName];
    objectOfHandlers[routeName] = applyVerbAndPath(axios, sharedRoute);
  });

  return objectOfHandlers as any;
};
