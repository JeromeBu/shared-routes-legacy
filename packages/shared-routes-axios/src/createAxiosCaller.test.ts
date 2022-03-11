import axios from "axios";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { createAxiosSharedCaller } from "./createAxiosCaller";

describe("createAxiosSharedCaller", () => {
  it("it create an a caller from axios and sharedRoutes object", async () => {
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
        querySchema: z.object({ author: z.string() }),
        outputSchema: z.array(bookSchema),
      }),
    });

    const axiosSharedCaller = createAxiosSharedCaller(mySharedRoutes, axios);

    // the code below will not past test as no sever is receving the calls,
    // but it is to show check that typing works fine.
    const notExecuted = async () => {
      const addBookResponse = await axiosSharedCaller.addBook({
        body: { title: "lala", author: "bob" },
        query: {},
        params: {},
      });
      // addBookResponse is of type void, as expected

      const getAllBooksResponse = await axiosSharedCaller.getAllBooks({
        query: { author: "steve" },
        body: {},
        params: {},
      });
      // getAllBooksResponse is of an array of books, as expected from outputSchema
    };
  });
});
