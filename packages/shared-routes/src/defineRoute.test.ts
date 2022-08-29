import { z } from "zod";
import {
  defineRoutes,
  defineRoute,
  definePrefixedRoute,
  combineRouters,
} from "./defineRoute";

describe("Shared routes definitions", () => {
  describe("defineRoutes", () => {
    it("does not allow 2 routes with same verb and path", () => {
      const createMySharedRoutes = () =>
        defineRoutes({
          addBook: defineRoute({
            verb: "post",
            path: "/books",
            bodySchema: z.object({ title: z.string() }),
          }),
          getAllBooks: defineRoute({
            verb: "post",
            path: "/books",
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
        routes.getAllBooks.bodySchema.parse({ yo: "lala" }),
      ).toThrow();
      expect(listRoutes()).toEqual(["POST /books", "GET /books"]);
    });

    it("allows to give a route path prefix common to all defined shared routes", () => {
      const { routes, routeOptions, listRoutes } = definePrefixedRoute(
        "/books",
        {
          addBook: defineRoute({
            verb: "post",
            path: "/yolo",
            bodySchema: z.object({ title: z.string() }),
          }),
          getAllBooks: defineRoute({
            verb: "get",
            path: "/",
            querySchema: z.object({ lala: z.string() }),
            outputSchema: z.array(
              z.object({ id: z.string(), name: z.string() }),
            ),
          }),
        },
      );

      expect(routeOptions.pathPrefix).toBe("/books");
      expect(routes.addBook.path).toBe("/yolo");
      expect(listRoutes()).toEqual(["POST /books/yolo", "GET /books/"]);
    });

    describe("combineRoutes", () => {
      it("can aggregate several routers", () => {
        const taskRoutes = {
          getAllTasks: defineRoute({
            verb: "get",
            path: "",
            querySchema: z.object({ max: z.number() }),
          }),
          delete: defineRoute({ verb: "delete", path: ":taskId" }),
        };

        const { sharedRouters, listRoutes } = combineRouters({
          books: {
            addBook: defineRoute({
              verb: "post",
              path: "add-book",
              bodySchema: z.object({ title: z.string() }),
            }),
          },
          tasks: taskRoutes,
        });

        expect(sharedRouters.books.addBook.path).toBe("add-book");
        expect(listRoutes()).toEqual([
          "POST /books/add-book",
          "GET /tasks",
          "DELETE /tasks/:taskid",
        ]);
      });
    });
  });
});
