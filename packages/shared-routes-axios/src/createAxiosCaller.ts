import { PathParameters, replacePathWithParams } from "shared-routes";
import type { SharedRoute } from "shared-routes";
import { z } from "zod";
import type { AxiosInstance, AxiosRequestConfig } from "axios";

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

const applyVerbAndPath = (
  axios: AxiosInstance,
  route: SharedRoute<string, any, any, any>
) => {
  switch (route.verb) {
    case "get":
      return ({ params, query }: any, config: AxiosRequestConfig) =>
        axios.get(replacePathWithParams(route.path, params), {
          params: query,
          ...config,
        });
    case "post":
      return ({ params, body, query }: any, config: AxiosRequestConfig) =>
        axios.post(replacePathWithParams(route.path, params), body, {
          params: query,
          ...config,
        });
    case "put":
      return ({ params, body, query }: any, config: AxiosRequestConfig) =>
        axios.put(replacePathWithParams(route.path, params), body, {
          params: query,
          ...config,
        });
    case "patch":
      return ({ params, body, query }: any, config: AxiosRequestConfig) =>
        axios.patch(replacePathWithParams(route.path, params), body, {
          params: query,
          ...config,
        });
    case "delete":
      return ({ params, query }: any, config: AxiosRequestConfig) =>
        axios.delete(replacePathWithParams(route.path, params), {
          params: query,
          ...config,
        });
    default:
      const shouldNotHappen: never = route.verb;
      throw new Error(route.verb + " : This HTTP verb is not handle");
      return shouldNotHappen;
  }
};

export const createAxiosSharedCaller = <
  R extends Record<string, SharedRoute<string, unknown, unknown, unknown>>
>(
  sharedRoutes: R,
  axios: AxiosInstance
): {
  [K in keyof R]: (
    params: {
      params: PathParameters<R[K]["path"]>;
      body: z.infer<R[K]["bodySchema"]>;
      query: z.infer<R[K]["querySchema"]>;
    },
    config?: AxiosRequestConfig
  ) => Promise<z.infer<R[K]["outputSchema"]>>;
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
