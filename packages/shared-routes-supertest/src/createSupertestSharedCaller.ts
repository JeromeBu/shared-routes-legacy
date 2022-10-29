import { PathParameters, replaceParamsInUrl, keys } from "shared-routes";
import type { UnknownSharedRoute, HttpMethod, Url } from "shared-routes";

import type { SuperTest, Test, Response } from "supertest";
import { z } from "zod";

const supertestRequestToCorrectHttpMethod = (
  supertestRequest: SuperTest<Test>,
  method: HttpMethod,
): ((url: Url) => Test) => {
  return supertestRequest[method];
};

const applyMethodAndUrl =
  (supertestRequest: SuperTest<Test>, route: UnknownSharedRoute) =>
  ({ params = {}, body, queryParams, headers }: any) =>
    supertestRequestToCorrectHttpMethod(
      supertestRequest,
      route.method,
    )(replaceParamsInUrl(route.url, params))
      .send(body)
      .set(headers ?? {})
      .query(queryParams);

type SupertestResponseWithOutput<Output> = Omit<Response, "body"> & {
  body: Output;
};

type AnyObj = Record<string, unknown>;
type EmptyObj = Record<string, never>;

export const createSupertestSharedCaller = <
  SharedRoutes extends Record<string, UnknownSharedRoute>,
>(
  sharedRoutes: SharedRoutes,
  supertestRequest: SuperTest<Test>,
): {
  [RouteName in keyof SharedRoutes]: (
    // prettier-ignore
    params: ({ headers?: Record<string, string> })
        & (PathParameters<SharedRoutes[RouteName]["url"]> extends EmptyObj ? AnyObj : { params: PathParameters<SharedRoutes[RouteName]["url"]> })
        & (z.infer<SharedRoutes[RouteName]["bodySchema"]> extends void ? AnyObj : { body: z.infer<SharedRoutes[RouteName]["bodySchema"]> })
        & (z.infer<SharedRoutes[RouteName]["queryParamsSchema"]> extends void ? AnyObj : { queryParams: z.infer<SharedRoutes[RouteName]["queryParamsSchema"]> })
        & (z.infer<SharedRoutes[RouteName]["headersSchema"]> extends void ? AnyObj : { headers: z.infer<SharedRoutes[RouteName]["headersSchema"]> }),
  ) => Promise<
    SupertestResponseWithOutput<
      z.infer<SharedRoutes[RouteName]["responseBodySchema"]>
    >
  >;
} => {
  const objectOfHandlers = {} as {
    [RouterName in keyof SharedRoutes]: (...handlers: any[]) => any;
  };

  keys(sharedRoutes).forEach((route) => {
    const sharedRoute = sharedRoutes[route];
    objectOfHandlers[route] = applyMethodAndUrl(supertestRequest, sharedRoute);
  });

  return objectOfHandlers;
};
