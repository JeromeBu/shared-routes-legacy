import { defineRoute, defineRoutes } from "shared-routes";
import { createExpressSharedRouter } from "shared-routes-express";
import supertest from "supertest";
import { z } from "zod";
import { createSupertestSharedCaller } from "./createSupertestSharedCaller";
import express, { Router } from "express";
import bodyParser from "body-parser";

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

const createExempleApp = (spy: (arg: any) => void) => {
  const app = express();
  app.use(bodyParser.json());

  const expressRouter = Router();
  const expressSharedRouter = createExpressSharedRouter(
    mySharedRoutes,
    expressRouter
  );

  expressSharedRouter.getTruc((req, res) => {
    return res.json([{ id: "my-id", name: "my name is " + req.query.lala }]);
  });

  expressSharedRouter.addTruc((req, res) => {
    spy(req.body);
    return res.json();
  });

  app.use(expressRouter);

  return app;
};

describe("createExpressSharedRouter and createSupertestSharedCaller", () => {
  it("it create an express app and a supertest instance with the same sharedRoutes object", async () => {
    const addedTruc: any[] = [];
    const app = createExempleApp((thing) => addedTruc.push(thing));
    const supertestRequest = supertest(app);
    const supertestSharedCaller = createSupertestSharedCaller(
      mySharedRoutes,
      supertestRequest
    );

    const getTrucResponse = await supertestSharedCaller.getTruc({
      body: undefined,
      query: { lala: "lulu" },
    });
    expect(getTrucResponse.status).toBe(200);
    expectToEqual(getTrucResponse.body, [
      { id: "my-id", name: "my name is lulu" },
    ]);

    const providedTruc = { truc: "yolo" };
    const addTrucResponse = await supertestSharedCaller.addTruc({
      body: providedTruc,
      query: undefined,
    });
    expect(addTrucResponse.status).toBe(200);
    expect(addedTruc).toEqual([providedTruc]);
    expect(addTrucResponse.body).toEqual(""); // type is void, but express sends "";
  });
});

const expectToEqual = <T>(actual: T, expected: T) =>
  expect(actual).toEqual(expected);
