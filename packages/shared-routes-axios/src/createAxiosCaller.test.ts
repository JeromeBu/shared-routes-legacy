import axios from "axios";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { createAxiosSharedCaller } from "./createAxiosCaller";

describe("createAxiosSharedCaller", () => {
  it("it create an a caller from axios and sharedRoutes object", async () => {
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

    const axiosSharedCaller = createAxiosSharedCaller(mySharedRoutes, axios);

    const addTrucResponse = await axiosSharedCaller.addTruc({
      body: { truc: "lala" },
      query: undefined,
    });
    // addTrucResponse is of type void, as expected

    const getTrucResponse = await axiosSharedCaller.getTruc({
      body: undefined,
      query: { lala: "yolo" },
    });
    // getTrucResponse is of type Array<{id: string, name: string}>, as expected from outputSchema
  });
});
