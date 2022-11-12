import { OpenAPIV3 as OpenAPI } from "openapi-types";
import { keys, UnknownSharedRoute } from "shared-routes";
import { z, ZodFirstPartyTypeKind } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { ZodRawShape } from "zod/lib/types";

type CreateOpenApiGenerator = <
  SharedRoutes extends Record<string, UnknownSharedRoute>,
>(
  sharedRoutes: SharedRoutes,
  openApiRootDoc: Omit<OpenAPI.Document, "paths">,
) => (
  extraDataByRoute: Partial<{
    [R in keyof SharedRoutes]: Omit<
      OpenAPI.PathItemObject,
      OpenAPI.HttpMethods
    >;
  }>,
) => OpenAPI.Document;

export const createOpenApiGenerator: CreateOpenApiGenerator =
  (sharedRoutes, openApiRootDoc) => (extraDataByRoute) => ({
    ...openApiRootDoc,
    paths: keys(sharedRoutes).reduce((acc, routeName) => {
      const route = sharedRoutes[routeName];
      const responseSchema = zodToOpenApi(route.responseBodySchema);
      const responseSchemaType:
        | OpenAPI.NonArraySchemaObjectType
        | OpenAPI.ArraySchemaObjectType
        | undefined = (responseSchema as any).type;

      const { formattedUrl, pathParams } = extractFromUrl(route.url);

      const parameters = [
        ...(pathParams.length > 0 ? pathParams : []),
        ...(!isShapeObjectEmpty(route.queryParamsSchema)
          ? zodObjectToParameters(route.queryParamsSchema, "query")
          : []),
        ...(!isShapeObjectEmpty(route.headersSchema)
          ? zodObjectToParameters(route.headersSchema, "header")
          : []),
      ];

      return {
        ...acc,
        [formattedUrl]: {
          ...acc[formattedUrl],
          [route.method]: {
            ...extraDataByRoute[routeName],
            ...(parameters.length > 0 && {
              parameters,
            }),

            ...(!isShapeObjectEmpty(route.bodySchema) && {
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: zodToOpenApi(route.bodySchema),
                  },
                },
              },
            }),

            responses: {
              "200": {
                description:
                  responseSchemaType !== undefined
                    ? "Success"
                    : "Success, with void response",
                ...(responseSchemaType !== undefined && {
                  content: {
                    "application/json": {
                      schema: responseSchema,
                    },
                  },
                }),
              },
            },
          },
        },
      };
    }, {} as any),
  });

type ParamKind = "path" | "query" | "header";

type Param = {
  name: string;
  required: boolean;
  schema: { type: string };
  in: ParamKind;
};

const extractFromUrl = (
  url: string,
): { pathParams: Param[]; formattedUrl: string } => {
  const pathParams: Param[] = [];

  const formattedUrl = url.replace(/:(.*?)(\/|$)/g, (match, group1, group2) => {
    pathParams.push({
      name: group1,
      required: true,
      schema: { type: "string" },
      in: "path",
    });
    return `{${group1}}` + group2 ?? "";
  });

  return {
    formattedUrl,
    pathParams,
  };
};

const zodToOpenApi = (schema: Parameters<typeof zodToJsonSchema>[0]) => {
  const { $schema, ...rest } = zodToJsonSchema(schema);
  return rest;
};

const isShapeObjectEmpty = <T>(schema: z.Schema<T>): boolean => {
  const typeName = getTypeName(schema);
  if (typeName === "ZodObject") {
    const shape = getShape(schema);
    return Object.keys(shape).length === 0;
  }

  return typeName === undefined;
};

const zodObjectToParameters = <T>(
  schema: z.Schema<T>,
  paramKind: ParamKind,
): Param[] => {
  const shape = getShape(schema);

  return Object.keys(shape).reduce((acc, paramName): Param[] => {
    const paramSchema = shape[paramName];
    const initialTypeName = getTypeName(paramSchema);
    const required = initialTypeName !== "ZodOptional";

    const schema = zodToOpenApi(
      required ? paramSchema : paramSchema._def.innerType,
    ) as any;

    return [
      ...acc,
      {
        in: paramKind,
        name: paramName,
        required,
        schema,
      },
    ];
  }, [] as Param[]);
};

const getTypeName = <T>(
  schema: z.Schema<T>,
): ZodFirstPartyTypeKind | undefined => (schema._def as any).typeName;

const getShape = <T>(schema: z.Schema<T>): ZodRawShape =>
  (schema._def as any).shape();
