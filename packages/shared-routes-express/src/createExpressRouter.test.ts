import { Router } from "express";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { createExpressSharedRouter } from "./createExpressRouter";

describe("createExpressSharedRouter", () => {
  it("it create a router from express router and sharedRoutes object", () => {
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

    const expressRouter = Router();
    const expressSharedRouter = createExpressSharedRouter(
      mySharedRoutes,
      expressRouter
    );

    expressSharedRouter.addTruc((req, res) => {
      req.body; // I would like to have type {truc: lala} (from addTrucBodySchema)
      req.query; // I would like to have type void (as no query params are provided for this route)
      res.json(); // I would like to take void (as no output is provided for this route)
    });

    expressSharedRouter.addTruc((req, res) => {
      req.body; // I would like to have type void (from addTrucBodySchema)
      req.query; // I would like to have type from getTrucQuerySchema
      res.json(); // I would like to take type from getTrucOutputSchema
    });

    expect(() =>
      mySharedRoutes.getTruc.bodySchema.parse({ yo: "lala" })
    ).toThrow();
  });
});
