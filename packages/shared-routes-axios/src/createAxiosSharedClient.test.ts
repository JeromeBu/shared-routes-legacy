import axios, { AxiosInstance } from "axios";
import {
  configureCreateHttpClient,
  defineRoute,
  defineRoutes,
  HandlerCreator,
  listRoutes,
  UnknownSharedRoute,
} from "shared-routes";
import {
  Handler,
  HttpClient,
} from "shared-routes/src/configureCreateHttpClient";
import { z } from "zod";
import {
  createAxiosHandlerCreator,
  createAxiosSharedClient,
} from "./createAxiosSharedClient";

describe("createAxiosSharedCaller", () => {
  it("create a caller from axios and sharedRoutes object", async () => {
    const bookSchema = z.object({ title: z.string(), author: z.string() });
    const withAuthorizationSchema = z.object({ authorization: z.string() });

    const routes = defineRoutes({
      addBook: defineRoute({
        method: "post",
        url: "/books",
        requestBodySchema: bookSchema,
        headersSchema: withAuthorizationSchema,
      }),
      getAllBooks: defineRoute({
        method: "get",
        url: "/books",
        queryParamsSchema: z.object({ max: z.number() }),
        responseBodySchema: z.array(bookSchema),
      }),
      getByTitle: defineRoute({
        method: "get",
        url: "/books/:title",
        responseBodySchema: bookSchema.or(z.void()),
      }),
    });

    const axiosSharedCaller = createAxiosSharedClient(routes, axios);

    expect(listRoutes(routes)).toEqual([
      "POST /books",
      "GET /books",
      "GET /books/:title",
    ]);

    // the code below will not past test because no server is receiving the calls,
    // but it is to checks that typing works fine.
    const notExecuted = async () => {
      const addBookResponse = await axiosSharedCaller.addBook({
        body: { title: "lala", author: "bob" },
        headers: { authorization: "some-token" },
      });
      addBookResponse.body; // type is void, as expected

      const getAllBooksResponse = await axiosSharedCaller.getAllBooks({
        queryParams: { max: 3 },
      });
      getAllBooksResponse.body; // type is Book[], as expected

      const getByTitleResponse = await axiosSharedCaller.getByTitle({
        urlParams: { title: "great" },
      });
      getByTitleResponse.body; // type is Book | void, as expected
    };
  });

  it("actually calls a placeholder endpoint", async () => {
    // WARNING : This test uses an actual placeholder api (which might be down...)
    const todoSchema = z.object({
      userId: z.number(),
      id: z.number(),
      title: z.string(),
      completed: z.boolean(),
    });

    const routes = defineRoutes({
      getByTodoById: defineRoute({
        method: "get",
        url: "https://jsonplaceholder.typicode.com/todos/:todoId",
        responseBodySchema: todoSchema,
      }),
    });

    expect(listRoutes(routes)).toEqual([
      "GET https://jsonplaceholder.typicode.com/todos/:todoid",
    ]);

    const axiosCaller = createAxiosSharedClient(routes, axios);
    const response = await axiosCaller.getByTodoById({
      urlParams: { todoId: "3" },
    });
    const expectedResponseBody: z.infer<typeof todoSchema> = {
      id: 3,
      userId: 1,
      completed: false,
      title: "fugiat veniam minus",
    };
    expect(response.body).toEqual(expectedResponseBody);
    expect(response.status).toBe(200);
  });
});
