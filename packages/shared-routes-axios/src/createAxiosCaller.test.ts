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

    // the code below will not past test as no server is receiving the calls,
    // but it is to show check that typing works fine.
    const notExecuted = async () => {
      const addBookResponse = await axiosSharedCaller.addBook({
        body: { title: "lala", author: "bob" },
        query: undefined,
        params: {},
      });
      // addBookResponse.data is of type void, as expected

      const getAllBooksResponse = await axiosSharedCaller.getAllBooks({
        query: { max: 3 },
        body: undefined,
        params: {},
      });

      // getAllBooksResponse.data is of an array of books, as expected from outputSchema

      const getByTitleResponse = await axiosSharedCaller.getByTitle({
        query: undefined,
        body: undefined,
        params: { title: "great" },
      });
      // getAllBooksResponse.data is of an array of books, as expected from outputSchema
    };
  });
});
