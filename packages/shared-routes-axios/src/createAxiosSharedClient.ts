import type { AxiosInstance } from "axios";
import type { UnknownSharedRoute, Url } from "shared-routes";
import { configureCreateHttpClient, HandlerCreator } from "shared-routes";

export const createAxiosHandlerCreator =
  <SharedRoutes extends Record<string, UnknownSharedRoute>>(
    axios: AxiosInstance,
  ): HandlerCreator<SharedRoutes> =>
  (routeName, routes, replaceParamsInUrl) =>
  async ({ body, urlParams, queryParams, headers } = {}) => {
    const route = routes[routeName];
    const { data, ...rest } = await axios.request({
      method: route.method,
      url: replaceParamsInUrl(route.url, urlParams as Url),
      data: body,
      params: queryParams,
      headers: {
        ...axios.defaults.headers,
        ...(headers ?? ({} as any)),
      },
    });
    return { ...rest, body: data };
  };

export const createAxiosSharedClient = <
  SharedRoutes extends Record<string, UnknownSharedRoute>,
>(
  sharedRouters: SharedRoutes,
  axios: AxiosInstance,
) => configureCreateHttpClient(createAxiosHandlerCreator(axios))(sharedRouters);
