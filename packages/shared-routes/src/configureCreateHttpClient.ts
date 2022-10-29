import { z } from "zod";
import { UnknownSharedRoute } from "./defineRoutes";
import {
  PathParameters,
  replaceParamsInUrl,
  ReplaceParamsInUrl,
  keys,
} from "./pathParameters";

type AnyObj = Record<string, unknown>;
type EmptyObj = Record<string, never>;

type HttpResponse<ResponseBody> = {
  status: number;
  body: ResponseBody;
};

export type HttpClient<
  SharedRoutes extends Record<string, UnknownSharedRoute>,
> = {
  [RouteName in keyof SharedRoutes]: (
    // prettier-ignore
    params: (PathParameters<SharedRoutes[RouteName]["url"]> extends EmptyObj ? AnyObj : { urlParams: PathParameters<SharedRoutes[RouteName]["url"]>})
      & (z.infer<SharedRoutes[RouteName]["bodySchema"]> extends void ? AnyObj : { body: z.infer<SharedRoutes[RouteName]["bodySchema"]> })
      & (z.infer<SharedRoutes[RouteName]["queryParamsSchema"]> extends void ? AnyObj : { queryParams: z.infer<SharedRoutes[RouteName]["queryParamsSchema"]> })
      & (z.infer<SharedRoutes[RouteName]["headersSchema"]> extends void ? AnyObj : { headers: z.infer<SharedRoutes[RouteName]["headersSchema"]> }),
  ) => Promise<
    HttpResponse<z.infer<SharedRoutes[RouteName]["responseBodySchema"]>>
  >;
};

type HandlerParams = {
  body?: any;
  urlParams?: any;
  queryParams?: any;
  headers?: any;
};

type Handler = (params?: HandlerParams) => Promise<HttpResponse<unknown>>;

export type HandlerCreator = (
  route: UnknownSharedRoute,
  replaceParamsInUrl: ReplaceParamsInUrl,
) => Handler;

export const configureCreateHttpClient =
  (handlerCreator: HandlerCreator) =>
  <SharedRoutes extends Record<string, UnknownSharedRoute>>(
    routes: SharedRoutes,
  ): HttpClient<SharedRoutes> =>
    keys(routes).reduce(
      (acc, routeName) => ({
        ...acc,
        [routeName]: handlerCreator(routes[routeName], replaceParamsInUrl),
      }),
      {} as HttpClient<SharedRoutes>,
    );
