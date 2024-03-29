import { z } from "zod";
import { defineRoutes, defineRoute, listRoutes } from "./defineRoutes";

describe("Shared routes definitions", () => {
  describe("defineRoutes", () => {
    it("does not allow 2 routes with same method and url", () => {
      const createMySharedRoutes = () =>
        defineRoutes({
          addBook: defineRoute({
            method: "post",
            url: "/books",
            bodySchema: z.object({ title: z.string() }),
          }),
          getAllBooks: defineRoute({
            method: "post",
            url: "/books",
            responseBodySchema: z.array(
              z.object({ id: z.string(), name: z.string() }),
            ),
          }),
        });

      expect(createMySharedRoutes).toThrowError(
        new Error(
          "You cannot have several routes with same http method and url, got: POST /books twice (at least)",
        ),
      );
    });

    it("create routes with the expected types and shows list of routes", () => {
      const routes = defineRoutes({
        addBook: defineRoute({
          method: "post",
          url: "/books",
          bodySchema: z.object({ title: z.string() }),
        }),
        getAllBooks: defineRoute({
          method: "get",
          url: "/books",
          queryParamsSchema: z.object({ lala: z.string() }),
          responseBodySchema: z.array(
            z.object({ id: z.string(), name: z.string() }),
          ),
        }),
      });

      expect(() =>
        routes.getAllBooks.bodySchema.parse({ yo: "lala" }),
      ).toThrow();
      expect(listRoutes(routes)).toEqual(["POST /books", "GET /books"]);
    });
  });
});
