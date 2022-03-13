import { defineRoute, defineRoutes } from "shared-routes";
import { createExpressSharedRouter } from "shared-routes-express";
import { z } from "zod";
import { createSupertestSharedCaller } from "./createSupertestSharedCaller";
import supertest from "supertest";
import express from "express";
import bodyParser from "body-parser";
import { Router } from "express";

type Book = { title: string; author: string };
const bookSchema: z.Schema<Book> = z.object({
  title: z.string(),
  author: z.string(),
});

const mySharedRoutes = defineRoutes({
  addBook: defineRoute({
    verb: "post",
    path: "/books",
    bodySchema: bookSchema,
  }),
  getAllBooks: defineRoute({
    verb: "get",
    path: "/books",
    querySchema: z.object({ max: z.number() }),
    outputSchema: z.array(bookSchema),
  }),
  getBookByTitle: defineRoute({
    verb: "get",
    path: `/books/:title`,
    outputSchema: z.union([bookSchema, z.undefined()]),
  }),
});

const fakeAuthToken = "my-token";

const createExempleApp = () => {
  const app = express();
  app.use(bodyParser.json());

  const bookDB: Book[] = [];

  const expressRouter = Router();
  const expressSharedRouter = createExpressSharedRouter(
    mySharedRoutes,
    expressRouter
  );

  expressSharedRouter.getAllBooks((req, res) => {
    console.log("max", req.query.max);
    console.log("typeof max", typeof req.query.max); // TODO type is wrong here, expecting number from schema but i am guessing query params are always converted to string
    return res.json(bookDB);
  });

  expressSharedRouter.addBook((req, res) => {
    if (req.headers.authorization !== fakeAuthToken) {
      res.status(401);
      return res.json();
    }

    bookDB.push(req.body);
    return res.json();
  });

  expressSharedRouter.getBookByTitle((req, res) => {
    const book = bookDB.find((b) => b.title === req.params.title);
    return res.json(book);
  });

  app.use(expressRouter);

  return app;
};

describe("createExpressSharedRouter and createSupertestSharedCaller", () => {
  it("fails to add if not authenticated", async () => {
    const app = createExempleApp();
    const supertestRequest = supertest(app);
    const supertestSharedCaller = createSupertestSharedCaller(
      mySharedRoutes,
      supertestRequest
    );

    const heyBook: Book = { title: "Hey", author: "Steeve" };
    const addBookResponse = await supertestSharedCaller.addBook({
      body: heyBook,
      query: undefined,
      params: {},
    });
    expect(addBookResponse.status).toBe(401);
    expect(addBookResponse.body).toEqual(""); // type is void, but express sends "";
  });
  it("create an express app and a supertest instance with the same sharedRoutes object", async () => {
    const app = createExempleApp();
    const supertestRequest = supertest(app);
    const supertestSharedCaller = createSupertestSharedCaller(
      mySharedRoutes,
      supertestRequest
    );

    const heyBook: Book = { title: "Hey", author: "Steeve" };
    const addBookResponse = await supertestSharedCaller.addBook({
      body: heyBook,
      query: undefined,
      params: {},
      headers: { authorization: fakeAuthToken },
    });
    expect(addBookResponse.status).toBe(200);
    expect(addBookResponse.body).toEqual(""); // type is void, but express sends "";

    const otherBook: Book = { title: "Other book", author: "Somebody" };
    await supertestSharedCaller.addBook({
      body: otherBook,
      query: undefined,
      params: {},
      headers: { authorization: fakeAuthToken },
    });

    const getAllBooksResponse = await supertestSharedCaller.getAllBooks({
      body: undefined,
      query: { max: 5 },
      params: {},
    });
    expect(getAllBooksResponse.status).toBe(200);
    expectToEqual(getAllBooksResponse.body, [heyBook, otherBook]);

    const fetchedBookResponse = await supertestSharedCaller.getBookByTitle({
      body: undefined,
      query: undefined,
      params: { title: "Hey" },
    });
    expect(fetchedBookResponse.status).toBe(200);
    expectToEqual(fetchedBookResponse.body, heyBook);
  });
});

const expectToEqual = <T>(actual: T, expected: T) =>
  expect(actual).toEqual(expected);
