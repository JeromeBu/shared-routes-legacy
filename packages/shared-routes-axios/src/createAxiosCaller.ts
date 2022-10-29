import { replacePathWithParams } from "shared-routes";
import type { PathParameters, UnknownSharedRoute } from "shared-routes";
import { z } from "zod";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

type GetKeys = <Obj extends Record<string, unknown>>(obj: Obj) => (keyof Obj)[];
const keys: GetKeys = (obj) => Object.keys(obj);

const applyMethodAndUrl = (axios: AxiosInstance, route: UnknownSharedRoute) => {
  return ({ params, query, body, headers }: any) =>
    axios.request({
      method: route.method,
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
): {
  [RouteName in keyof SharedRoutes]: (
    // prettier-ignore
    params: (PathParameters<SharedRoutes[RouteName]["url"]> extends EmptyObj ? AnyObj : {params: PathParameters<SharedRoutes[RouteName]["url"]>})
        & (z.infer<SharedRoutes[RouteName]["bodySchema"]> extends void ? AnyObj : { body: z.infer<SharedRoutes[RouteName]["bodySchema"]> })
        & (z.infer<SharedRoutes[RouteName]["queryParamsSchema"]> extends void ? AnyObj : { queryParams: z.infer<SharedRoutes[RouteName]["queryParamsSchema"]> })
        & (z.infer<SharedRoutes[RouteName]["headersSchema"]> extends void ? AnyObj : { headers: z.infer<SharedRoutes[RouteName]["headersSchema"]> }),
  ) => Promise<
    AxiosResponse<z.infer<SharedRoutes[RouteName]["responseBodySchema"]>>
  >;
} => {
  const objectOfHandlers = {} as Record<
    keyof SharedRoutes,
    (params: { body: any; queryParams: any }, config?: any) => Promise<any>
  >;

  keys(sharedRouters).forEach((route) => {
    const sharedRoute = sharedRouters[route];
    objectOfHandlers[route] = applyMethodAndUrl(axios, sharedRoute);
  });

  return objectOfHandlers as any;
};
