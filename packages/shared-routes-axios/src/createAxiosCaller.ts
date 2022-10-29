import { replacePathWithParams } from "shared-routes";
import type { PathParameters, UnknownSharedRoute } from "shared-routes";
import { z } from "zod";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

type GetKeys = <Obj extends Record<string, unknown>>(obj: Obj) => (keyof Obj)[];
const keys: GetKeys = (obj) => Object.keys(obj);

export type AxiosSharedRoutesOptions = {
  proxyPrefix: string; // for usage with a proxy for exemple
};

const applyVerbAndPath = (axios: AxiosInstance, route: UnknownSharedRoute) => {
  return ({ params, query, body, headers }: any) =>
    axios.request({
      method: route.verb,
      url: replacePathWithParams(route.url, params),
      data: body,
      params: query,
      headers: { ...axios.defaults.headers, ...headers },
    });
};

type AnyObj = Record<string, unknown>;
type EmptyObj = Record<string, never>;

export const createAxiosSharedCaller = <
  SharedRoutes extends Record<string, UnknownSharedRoute>,
>(
  sharedRouters: SharedRoutes,
  axios: AxiosInstance,
  options?: AxiosSharedRoutesOptions,
): {
  [RouteName in keyof SharedRoutes]: (
    // prettier-ignore
    params: (PathParameters<SharedRoutes[RouteName]["url"]> extends EmptyObj ? AnyObj : {params: PathParameters<SharedRoutes[RouteName]["url"]>})
        & (z.infer<SharedRoutes[RouteName]["bodySchema"]> extends void ? AnyObj : { body: z.infer<SharedRoutes[RouteName]["bodySchema"]> })
        & (z.infer<SharedRoutes[RouteName]["querySchema"]> extends void ? AnyObj : { query: z.infer<SharedRoutes[RouteName]["querySchema"]> }),
    config?: AxiosRequestConfig,
  ) => Promise<AxiosResponse<z.infer<SharedRoutes[RouteName]["outputSchema"]>>>;
} => {
  const objectOfHandlers = {} as Record<
    keyof SharedRoutes,
    (params: { body: any; query: any }, config?: any) => Promise<any>
  >;

  keys(sharedRouters).forEach((route) => {
    const sharedRoute = sharedRouters[route];
    objectOfHandlers[route] = applyVerbAndPath(axios, sharedRoute);
  });

  return objectOfHandlers as any;
};
