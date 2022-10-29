import { z } from "zod";
import { defineRoutes, defineRoute } from "./defineRoute";

describe("Shared routes definitions", () => {
  describe("defineRoutes", () => {
    it("does not allow 2 routes with same verb and path", () => {
      const createMySharedRoutes = () =>
        defineRoutes({
          addBook: defineRoute({
            verb: "post",
            url: "/books",
            bodySchema: z.object({ title: z.string() }),
          }),
          getAllBooks: defineRoute({
            verb: "post",
            url: "/books",
            outputSchema: z.array(
              z.object({ id: z.string(), name: z.string() }),
            ),
          }),
        });

      expect(createMySharedRoutes).toThrowError(
        new Error(
          "You cannot have several routes with same verb and path, got: POST /books twice (at least)",
        ),
      );
    });

    it("create routes with the expected types and shows list of routes", () => {
      const { routes, listRoutes } = defineRoutes({
        addBook: defineRoute({
          verb: "post",
          url: "/books",
          bodySchema: z.object({ title: z.string() }),
        }),
        getAllBooks: defineRoute({
          verb: "get",
          url: "/books",
          querySchema: z.object({ lala: z.string() }),
          outputSchema: z.array(z.object({ id: z.string(), name: z.string() })),
        }),
      });

      expect(() =>
        routes.getAllBooks.bodySchema.parse({ yo: "lala" }),
      ).toThrow();
      expect(listRoutes()).toEqual(["POST /books", "GET /books"]);
    });
  });
});
