import { z } from "zod";
import { defineRoutes, defineRoute } from "./defineRoute";

describe("createRoutes", () => {
  it("it create routes with the expected types", () => {
    const mySharedRoutes = defineRoutes({
      addTruc: defineRoute({
        verb: "post",
        path: "/truc",
        bodySchema: z.object({ truc: z.string() }),
      }),
      getTruc: defineRoute({
        verb: "get",
        path: "/truc",
        querySchema: z.object({ lala: z.string() }),
        outputSchema: z.array(z.object({ id: z.string(), name: z.string() })),
      }),
    });

    expect(() =>
      mySharedRoutes.getTruc.bodySchema.parse({ yo: "lala" })
    ).toThrow();
  });
});
