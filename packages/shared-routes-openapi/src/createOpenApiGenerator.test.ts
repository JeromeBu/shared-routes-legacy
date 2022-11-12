import * as console from "console";
import { OpenAPIV3_1 } from "openapi-types";
import { defineRoute, defineRoutes } from "shared-routes";
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

const rootInfo = {
  info: {
    title: "My book API",
    description: "My test openApi description",
    version: "1",
  },
  openapi: "3.0.0",
  tags: [{ name: "book" as const, description: "My books API" }],
};

const generateOpenApi = createOpenApiGenerator(routes, rootInfo);

const openApiJSON = generateOpenApi({
  addBook: {
    summary: "To add a book",
    description: "To add a book",
    tags: ["book"],
  },
  getAllBooks: {
    summary: "To get all books",
    description: "To get all books",
    tags: ["book"],
  },
  getByTitle: {
    summary: "Get book from title",
    description: "To a book from its title",
    tags: ["book"],
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
    ...rootInfo,
    paths: {
      "/books/{title}": {
        get: {
          description: "To a book from its title",
          tags: ["book"],
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
          summary: "Get book from title",
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
          summary: "To get all books",
          description: "To get all books",
          tags: ["book"],
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
          summary: "To add a book",
          description: "To add a book",
          tags: ["book"],
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

  console.log(JSON.stringify(expected, null, 2));

  expect(openApiJSON).toEqual(expected);
});
