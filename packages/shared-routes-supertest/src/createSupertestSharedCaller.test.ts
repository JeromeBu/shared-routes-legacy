import { defineRoute, defineRoutes } from "shared-routes";
import supertest from "supertest";
import { z } from "zod";
import { createSupertestSharedCaller } from "./createSupertestSharedCaller";

describe("createSupertestSharedCaller", () => {
  it("it create a router from supertest router and sharedRoutes object", async () => {
    const addTrucBodySchema = z.object({ truc: z.string() });
    const getTrucQuerySchema = z.object({ lala: z.string() });
    const getTrucOutputSchema = z.array(
      z.object({ id: z.string(), name: z.string() })
    );

    const mySharedRoutes = defineRoutes({
      addTruc: defineRoute({
        verb: "post",
        path: "/truc",
        bodySchema: addTrucBodySchema,
      }),
      getTruc: defineRoute({
        verb: "get",
        path: "/truc",
        querySchema: getTrucQuerySchema,
        outputSchema: getTrucOutputSchema,
      }),
    });

    const supertestRequest = supertest(null);
    const supertestSharedCaller = createSupertestSharedCaller(
      mySharedRoutes,
      supertestRequest
    );

    const addTrucResponse = await supertestSharedCaller.addTruc({
      body: { truc: "yolo" },
      query: undefined,
      // query: undefined,
    });

    const getTrucResponse = await supertestSharedCaller.getTruc({
      body: undefined,
      query: { lala: "lulu" },
    });
  });
});
