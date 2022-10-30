import type { AxiosInstance } from "axios";
import type { UnknownSharedRoute } from "shared-routes";
import { configureCreateHttpClient, HandlerCreator } from "shared-routes";

export const createAxiosHandlerCreator =
  (axios: AxiosInstance): HandlerCreator<any> =>
  (route, replaceParamsInUrl) =>
  async ({ body, urlParams, queryParams, headers } = {}) => {
    const { data, ...rest } = await axios.request({
      method: route.method,
      url: replaceParamsInUrl(route.url, urlParams),
      data: body,
      params: queryParams,
      headers: { ...axios.defaults.headers, ...headers },
    });
    return { ...rest, body: data };
  };

export const createAxiosSharedClient = <
  SharedRoutes extends Record<string, UnknownSharedRoute>,
>(
  sharedRouters: SharedRoutes,
  axios: AxiosInstance,
) => configureCreateHttpClient(createAxiosHandlerCreator(axios))(sharedRouters);
