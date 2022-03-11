import { z } from "zod";
import { defineRoutes, defineRoute } from "./defineRoute";

describe("createRoutes", () => {
  it("it create routes with the expected types", () => {
    const mySharedRoutes = defineRoutes({
      addBook: defineRoute({
        verb: "post",
        path: "/books",
        bodySchema: z.object({ title: z.string() }),
      }),
      getAllBooks: defineRoute({
        verb: "get",
        path: "/books",
        querySchema: z.object({ lala: z.string() }),
        outputSchema: z.array(z.object({ id: z.string(), name: z.string() })),
      }),
    });

    expect(() =>
      mySharedRoutes.getAllBooks.bodySchema.parse({ yo: "lala" })
    ).toThrow();
  });
});
