import axios from "axios";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { createAxiosSharedCaller } from "./createAxiosCaller";

describe("createAxiosSharedCaller", () => {
  it("create a caller from axios and sharedRoutes object", async () => {
    const bookSchema = z.object({ title: z.string(), author: z.string() });

    const { routes, listRoutes } = defineRoutes({
      addBook: defineRoute({
        method: "post",
        url: "/books",
        bodySchema: bookSchema,
      }),
      getAllBooks: defineRoute({
        method: "get",
        url: "/books",
        queryParamsSchema: z.object({ max: z.number() }),
        outputSchema: z.array(bookSchema),
      }),
      getByTitle: defineRoute({
        method: "get",
        url: "/books/:title",
      }),
    });

    const axiosSharedCaller = createAxiosSharedCaller(routes, axios);

    expect(listRoutes()).toEqual([
      "POST /books",
      "GET /books",
      "GET /books/:title",
    ]);

    // the code below will not past test as no server is receiving the calls,
    // but it is to show check that typing works fine.
    const notExecuted = async () => {
      const addBookResponse = await axiosSharedCaller.addBook(
        {
          body: { title: "lala", author: "bob" },
        },
        { headers: { authorization: "some-token" } },
      );
      addBookResponse.data; // type is void, as expected

      const getAllBooksResponse = await axiosSharedCaller.getAllBooks({
        query: { max: 3 },
      });
      getAllBooksResponse.data; // type is Book[], as expected

      const getByTitleResponse = await axiosSharedCaller.getByTitle({
        params: { title: "great" },
      });
      getByTitleResponse.data; // type is Book[], as expected
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

    const { routes, listRoutes } = defineRoutes({
      getByTodoById: defineRoute({
        method: "get",
        url: "https://jsonplaceholder.typicode.com/todos/:todoId",
        outputSchema: todoSchema,
      }),
    });

    expect(listRoutes()).toEqual([
      "GET https://jsonplaceholder.typicode.com/todos/:todoid",
    ]);

    const axiosCaller = createAxiosSharedCaller(routes, axios);
    const response = await axiosCaller.getByTodoById({
      params: { todoId: "3" },
    });
    const expectedBody: z.infer<typeof todoSchema> = {
      id: 3,
      userId: 1,
      completed: false,
      title: "fugiat veniam minus",
    };
    expect(response.data).toEqual(expectedBody);
    expect(response.status).toBe(200);
  });
});
