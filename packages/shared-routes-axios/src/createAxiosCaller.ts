import { PathParameters, replacePathWithParams } from "shared-routes";
import type { SharedRoute } from "shared-routes";
import { z } from "zod";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

export type AxiosSharedRoutesOptions = {
  prefix?: string; // for usage with a proxy for exemple
};

const applyVerbAndPath = (
  axios: AxiosInstance,
  route: SharedRoute<string, any, any, any>,
  options?: AxiosSharedRoutesOptions
) => {
  const routePath = options?.prefix ? options.prefix + route.path : route.path;

  switch (route.verb) {
    case "get":
      return ({ params, query }: any, config: AxiosRequestConfig) => {
        return axios.get(replacePathWithParams(routePath, params), {
          params: query,
          ...config,
        });
      };
    case "post":
      return ({ params, body, query }: any, config: AxiosRequestConfig) =>
        axios.post(replacePathWithParams(routePath, params), body, {
          params: query,
          ...config,
        });
    case "put":
      return ({ params, body, query }: any, config: AxiosRequestConfig) =>
        axios.put(replacePathWithParams(routePath, params), body, {
          params: query,
          ...config,
        });
    case "patch":
      return ({ params, body, query }: any, config: AxiosRequestConfig) =>
        axios.patch(replacePathWithParams(routePath, params), body, {
          params: query,
          ...config,
        });
    case "delete":
      return ({ params, query }: any, config: AxiosRequestConfig) =>
        axios.delete(replacePathWithParams(routePath, params), {
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
  axios: AxiosInstance,
  options?: AxiosSharedRoutesOptions
): {
  [K in keyof R]: (
    params: {
      params: PathParameters<R[K]["path"]>;
      body: z.infer<R[K]["bodySchema"]>;
      query: z.infer<R[K]["querySchema"]>;
    },
    config?: AxiosRequestConfig
  ) => Promise<AxiosResponse<z.infer<R[K]["outputSchema"]>>>;
} => {
  const objectOfHandlers = {} as Record<
    keyof R,
    (params: { body: any; query: any }, config?: any) => Promise<any>
  >;

  keys(sharedRoutes).forEach((routeName) => {
    const sharedRoute = sharedRoutes[routeName];
    objectOfHandlers[routeName] = applyVerbAndPath(axios, sharedRoute, options);
  });

  return objectOfHandlers as any;
};
