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
        querySchema: z.object({ max: z.number() }),
        outputSchema: z.array(bookSchema),
      }),
      getByTitle: defineRoute({
        method: "get",
        url: "/books/:title",
      }),
    });

    const axiosSharedCaller = createAxiosSharedCaller(routes, axios, {
      proxyPrefix: "/api",
    });

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
});
