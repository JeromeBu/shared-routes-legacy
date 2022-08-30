import { PathParameters, replacePathWithParams } from "shared-routes";
import type { SharedRoute, DefineRoutesOptions } from "shared-routes";
import { z } from "zod";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

export type AxiosSharedRoutesOptions = {
  proxyPrefix: string; // for usage with a proxy for exemple
};

const applyVerbAndPath = (
  axios: AxiosInstance,
  route: SharedRoute<string, any, any, any>,
  options: AxiosSharedRoutesOptions & DefineRoutesOptions,
) => {
  const routePath = options.pathPrefix + options.proxyPrefix + route.path;

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

type AnyObj = Record<string, unknown>;
type EmptyObj = Record<string, never>;

export const createAxiosSharedCaller = <
  Routers extends Record<
    string,
    Record<string, SharedRoute<string, unknown, unknown, unknown>>
  >,
>(
  sharedRouters: Routers,
  axios: AxiosInstance,
  options?: AxiosSharedRoutesOptions,
): {
  [RouterName in keyof Routers]: {
    [K in keyof Routers[RouterName]]: (
      // prettier-ignore
      params: (PathParameters<Routers[RouterName][K]["path"]> extends EmptyObj ? AnyObj : {params: PathParameters<Routers[RouterName][K]["path"]>})
        & (z.infer<Routers[RouterName][K]["bodySchema"]> extends void ? AnyObj : { body: z.infer<Routers[RouterName][K]["bodySchema"]> })
        & (z.infer<Routers[RouterName][K]["querySchema"]> extends void ? AnyObj : { query: z.infer<Routers[RouterName][K]["querySchema"]> }),
      config?: AxiosRequestConfig,
    ) => Promise<
      AxiosResponse<z.infer<Routers[RouterName][K]["outputSchema"]>>
    >;
  };
} => {
  const objectOfHandlers = {} as {
    [RouterName in keyof Routers]: {
      [K in keyof Routers[RouterName]]: (
        params: { body: any; query: any },
        config?: any,
      ) => Promise<any>;
    };
  };

  keys(sharedRouters).forEach((routerName) => {
    const router = sharedRouters[routerName];
    if (!objectOfHandlers[routerName]) {
      objectOfHandlers[routerName] = {} as any;
    }

    keys(router).forEach((route) => {
      const sharedRoute = router[route];
      objectOfHandlers[routerName][route] = applyVerbAndPath(
        axios,
        sharedRoute,
        {
          proxyPrefix: options?.proxyPrefix ?? "",
          pathPrefix: routerName as string,
        },
      );
    });
  });

  return objectOfHandlers as any;
};
