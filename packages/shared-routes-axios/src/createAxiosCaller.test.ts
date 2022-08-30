import axios from "axios";
import { combineRouters, defineRoute } from "shared-routes";
import { z } from "zod";
import { createAxiosSharedCaller } from "./createAxiosCaller";

describe("createAxiosSharedCaller", () => {
  it("create a caller from axios and sharedRoutes object", async () => {
    const bookSchema = z.object({ title: z.string(), author: z.string() });

    const { sharedRouters, listRoutes } = combineRouters({
      books: {
        addBook: defineRoute({
          verb: "post",
          path: "",
          bodySchema: bookSchema,
        }),
        getAllBooks: defineRoute({
          verb: "get",
          path: "",
          querySchema: z.object({ max: z.number() }),
          outputSchema: z.array(bookSchema),
        }),
        getByTitle: defineRoute({
          verb: "get",
          path: ":title",
        }),
      },
    });

    const axiosSharedCaller = createAxiosSharedCaller(sharedRouters, axios, {
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
      const addBookResponse = await axiosSharedCaller.books.addBook(
        {
          body: { title: "lala", author: "bob" },
        },
        { headers: { authorization: "some-token" } },
      );
      addBookResponse.data; // type is void, as expected

      const getAllBooksResponse = await axiosSharedCaller.books.getAllBooks({
        query: { max: 3 },
      });
      getAllBooksResponse.data; // type is Book[], as expected

      const getByTitleResponse = await axiosSharedCaller.books.getByTitle({
        params: { title: "great" },
      });
      getByTitleResponse.data; // type is Book[], as expected
    };
  });
});
