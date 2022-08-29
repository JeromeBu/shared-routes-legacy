import { defineRoute, combineRouters } from "shared-routes";
import { createExpressSharedRouter } from "shared-routes-express";
import { z } from "zod";
import { createSupertestSharedCaller } from "./createSupertestSharedCaller";
import supertest from "supertest";
import express from "express";
import bodyParser from "body-parser";
import { Router as ExpressRouter } from "express";

const zNumberFromString = z.preprocess((v: any) => {
  const n = parseInt(v);
  return isNaN(n) ? v : n;
}, z.number());

type Book = { title: string; author: string };
const bookSchema: z.Schema<Book> = z.object({
  title: z.string(),
  author: z.string(),
});

const { sharedRouters, listRoutes } = combineRouters({
  tasks: {
    getAllTasks: defineRoute({
      verb: "get",
      path: "all",
      querySchema: z.object({ max: zNumberFromString }),
      outputSchema: z.array(z.object({ taskName: z.string() })),
    }),
  },
  books: {
    addBook: defineRoute({
      verb: "post",
      path: "",
      bodySchema: bookSchema,
    }),
    getAllBooks: defineRoute({
      verb: "get",
      path: "",
      querySchema: z.object({ max: zNumberFromString }),
      outputSchema: z.array(bookSchema),
    }),
    getBookByTitle: defineRoute({
      verb: "get",
      path: ":title",
      outputSchema: z.union([bookSchema, z.undefined()]),
    }),
  },
});

const fakeAuthToken = "my-token";

type PathAndExpressRouter = [string, ExpressRouter];

const createTaskRouter = (): PathAndExpressRouter => {
  const expressRouter = ExpressRouter();

  const { expressSharedRouter, pathPrefix } = createExpressSharedRouter(
    { sharedRouters, routerName: "tasks" },
    expressRouter,
  );

  expressSharedRouter.getAllTasks((req, res) => {
    req.query.max;
    return res.json([{ taskName: "some fake task" }]);
  });

  return [pathPrefix, expressRouter];
};

const createBookRouter = (): PathAndExpressRouter => {
  const bookDB: Book[] = [];
  const expressRouter = ExpressRouter();

  const { expressSharedRouter, pathPrefix } = createExpressSharedRouter(
    { sharedRouters, routerName: "books" },
    expressRouter,
    { skipQueryValidation: false },
  );

  expressSharedRouter.getAllBooks((req, res) => {
    console.log("Getting all books : ", req.query);
    return res.json(bookDB);
  });

  expressSharedRouter.addBook((req, res) => {
    if (req.headers.authorization !== fakeAuthToken) {
      res.status(401);
      return res.json();
    }

    console.log("Adding book : ", req.body);

    bookDB.push(req.body);
    return res.json();
  });

  expressSharedRouter.getBookByTitle((req, res) => {
    console.log("Getting books by title : ", req.params);
    const book = bookDB.find((b) => b.title === req.params.title);
    return res.json(book);
  });

  return [pathPrefix, expressRouter];
};

const createExempleApp = () => {
  const app = express();
  app.use(bodyParser.json());
  app.use(...createTaskRouter());
  app.use(...createBookRouter());
  return app;
};

describe("createExpressSharedRouter and createSupertestSharedCaller", () => {
  it("fails to add if not authenticated", async () => {
    const app = createExempleApp();
    const supertestRequest = supertest(app);
    const supertestSharedCaller = createSupertestSharedCaller(
      sharedRouters,
      supertestRequest,
    );

    const heyBook: Book = { title: "Hey", author: "Steeve" };
    const addBookResponse = await supertestSharedCaller.books.addBook({
      body: heyBook,
    });
    expect(listRoutes()).toEqual([
      "GET /tasks/all",
      "POST /books",
      "GET /books",
      "GET /books/:title",
    ]);

    expect(addBookResponse.body).toEqual(""); // type is void, but express sends "";
    expect(addBookResponse.status).toBe(401);
  });

  it("fails explicitly when the schema is not respected", async () => {
    const app = createExempleApp();
    const supertestRequest = supertest(app);
    const supertestSharedCaller = createSupertestSharedCaller(
      sharedRouters,
      supertestRequest,
    );

    const getAllBooksResponse = await supertestSharedCaller.books.getAllBooks({
      query: { max: "yolo" as any },
    });
    expect(getAllBooksResponse.body).toEqual([
      "max : Expected number, received string",
    ]);
    expect(getAllBooksResponse.status).toBe(400);
  });

  it("create an express app and a supertest instance with the same sharedRoutes object", async () => {
    const app = createExempleApp();
    const supertestRequest = supertest(app);
    const supertestSharedCaller = createSupertestSharedCaller(
      sharedRouters,
      supertestRequest,
    );

    const heyBook: Book = { title: "Hey", author: "Steeve" };
    const addBookResponse = await supertestSharedCaller.books.addBook({
      body: heyBook,
      headers: { authorization: fakeAuthToken },
    });

    expect(addBookResponse.body).toEqual(""); // type is void, but express sends "";
    expect(addBookResponse.status).toBe(200);

    const otherBook: Book = { title: "Other book", author: "Somebody" };
    await supertestSharedCaller.books.addBook({
      body: otherBook,
      headers: { authorization: fakeAuthToken },
    });

    const getAllBooksResponse = await supertestSharedCaller.books.getAllBooks({
      query: { max: 5 },
    });
    expectToEqual(getAllBooksResponse.body, [heyBook, otherBook]);
    expect(getAllBooksResponse.status).toBe(200);

    const fetchedBookResponse =
      await supertestSharedCaller.books.getBookByTitle({
        params: { title: "Hey" },
      });
    expectToEqual(fetchedBookResponse.body, heyBook);
    expect(fetchedBookResponse.status).toBe(200);
  });
});

const expectToEqual = <T>(actual: T, expected: T) =>
  expect(actual).toEqual(expected);
