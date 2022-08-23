import axios from "axios";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { createAxiosSharedCaller } from "./createAxiosCaller";

describe("createAxiosSharedCaller", () => {
  it("create a caller from axios and sharedRoutes object", async () => {
    const bookSchema = z.object({ title: z.string(), author: z.string() });

    const mySharedRoutes = defineRoutes({
      addBook: defineRoute({
        verb: "post",
        path: "/books",
        bodySchema: bookSchema,
      }),
      getAllBooks: defineRoute({
        verb: "get",
        path: "/books",
        querySchema: z.object({ max: z.number() }),
        outputSchema: z.array(bookSchema),
      }),
      getByTitle: defineRoute({
        verb: "get",
        path: "/books/:title",
      }),
    });

    const axiosSharedCaller = createAxiosSharedCaller(mySharedRoutes, axios, {
      proxyPrefix: "/api",
    });

    expect(mySharedRoutes.listRoutes()).toEqual([
      "POST /books",
      "GET /books",
      "GET /books/:title",
    ]);

    // the code below will not past test as no server is receiving the calls,
    // but it is to show check that typing works fine.
    const notExecuted = async () => {
      const addBookResponse = await axiosSharedCaller.addBook({
        body: { title: "lala", author: "bob" },
      });
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
