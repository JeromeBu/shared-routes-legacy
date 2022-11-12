import { OpenAPIV3_1 } from "openapi-types";
import { defineRoute, defineRoutes, UnknownSharedRoute } from "shared-routes";
import { z } from "zod";
import { createOpenApiGenerator } from "./createOpenApiGenerator";

const bookSchema = z.object({ title: z.string(), author: z.string() });
const withAuthorizationSchema = z.object({ authorization: z.string() });

const routes = defineRoutes({
  addBook: defineRoute({
    method: "post",
    url: "/books",
    bodySchema: bookSchema,
    headersSchema: withAuthorizationSchema,
  }),
  getAllBooks: defineRoute({
    method: "get",
    url: "/books",
    queryParamsSchema: z.object({
      max: z.number().optional(),
      truc: z.string(),
    }),
    responseBodySchema: z.array(bookSchema),
  }),
  getByTitle: defineRoute({
    method: "get",
    url: "/books/:title",
    responseBodySchema: bookSchema,
  }),
});

const generateOpenApi = createOpenApiGenerator(routes, {
  info: {
    title: "My book API",
    description: "My test openApi description",
    version: "1",
  },
  openapi: "3.0.0",
});

const openApiJSON = generateOpenApi({
  addBook: { description: "To add a book" },
  getAllBooks: { description: "To get all books" },
  getByTitle: {
    description: "To a book from its title",
    summary: "Mon résumé",
    servers: [
      {
        url: "http://truc.com",
        description: "pour faire des trucs",
        variables: {
          lala: {
            description: "Super variable",
            enum: ["a", "b"],
            default: "a",
          },
        },
      },
    ],
  },
});

it("has the expected shape", () => {
  const bookJsonSchema = {
    additionalProperties: false,
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      author: { type: "string" as const },
    },
    required: ["title", "author"],
  };

  const expected: OpenAPIV3_1.Document = {
    info: {
      title: "My book API",
      description: "My test openApi description",
      version: "1",
    },
    openapi: "3.0.0",
    paths: {
      "/books/{title}": {
        get: {
          description: "To a book from its title",
          parameters: [
            {
              name: "title",
              required: true,
              schema: { type: "string" },
              in: "path",
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: bookJsonSchema,
                },
              },
            },
          },
          summary: "Mon résumé",
          servers: [
            {
              url: "http://truc.com",
              description: "pour faire des trucs",
              variables: {
                lala: {
                  description: "Super variable",
                  enum: ["a", "b"],
                  default: "a",
                },
              },
            },
          ],
        },
      },
      "/books": {
        get: {
          description: "To get all books",
          parameters: [
            {
              name: "max",
              required: false,
              schema: { type: "number" },
              in: "query",
            },
            {
              in: "query",
              name: "truc",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Success",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: bookJsonSchema,
                  },
                },
              },
            },
          },
        },
        post: {
          description: "To add a book",
          parameters: [
            {
              in: "header",
              name: "authorization",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: bookJsonSchema,
              },
            },
            required: true,
          },
          responses: {
            "200": {
              description: "Success, with void response",
            },
          },
        },
      },
    },
  };

  expect(openApiJSON).toEqual(expected);
});
