# Shared routes

The purpose of this package is to provide a typesafe way to share routes between projects (using REST based queries).
The usual use case would be a project having a backend, consumed by a frontend and also by some supertest http calls tests.

The idea is to create the route definitions in one place and to use them everywhere.

For now `express` is supported as a server.

`axios` and `supertest` are supported as callers.

## Install

You can decide to use only the packages which suits your need, you will need `shared-routes` anyways.

```shell
npm install shared-routes
# zod is necessary for schema definitions
npm install zod

# those you need :
npm install shared-routes-axios
npm install shared-routes-express
npm install shared-routes-supertest
```

## Routes definitions exemple :

Shared routes are defined like the following exemple :

```typescript
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";

type Book = { title: string; author: string };
const bookSchema: z.Schema<Book> = z.object({
  title: z.string(),
  author: z.string(),
});

export const { sharedRouters, listRoutes } = defineRoutes({
    addBook: defineRoute({
      verb: "post",
      path: "",
      bodySchema: bookSchema,
    }),
    getAllBooks: defineRoute({
      verb: "get",
      path: "",
      queryParamsSchema: z.object({ max: z.number() }),
      responseBodySchema: z.array(bookSchema),
    }),
    getBookByTitle: defineRoute({
      verb: "get",
      path: `:title`,
      responseBodySchema: z.union([bookSchema, z.undefined()]),
      headers: z.object({authorization: z.string()}),
    }),
});
```

`listRoutes` will give you the list of routes included in shared routers, in this case :

```typescript
listRoutes() 
// would output :
  [
    "POST /books",
    "GET /books",
    "GET /books/:title"
  ]
```

[Zod library](https://github.com/colinhacks/zod) is used for schema definitions.
You can decide for each server / consumer if you want the actual validation to be run or if you just want to take advantage of the type.

## Usage with express

Here is an example of usage with express, using the previously defined `mySharedRoutes`:

```typescript
import express, {Router as ExpressRouter} from "express";
import bodyParser from "body-parser";
import {createExpressSharedRouter} from "shared-routes-express";
import {sharedRouters} from "path/to/where/sharedRouters/are/defined"

const fakeAuthToken = "my-token";

type PathAndExpressRouter = [string, ExpressRouter];

const createBookRouter = (): PathAndExpressRouter => {
  const bookDB: Book[] = [];
  const expressRouter = ExpressRouter();

  const {expressSharedRouter, pathPrefix} = createExpressSharedRouter(
    {sharedRouters, routerName: "books"},
    expressRouter,
    {skipQueryValidation: true, skipBodyValidation: false},
  );

  expressSharedRouter.getAllBooks((req, res) => {
    return res.json(bookDB);
  });

  expressSharedRouter.addBook((req, res) => {
    if (req.headers.authorization !== fakeAuthToken) {
      res.status(401);
      return res.json();
    }
    bookDB.push(req.body); // req.body is of type Book
    return res.json();
  });

  expressSharedRouter.getBookByTitle((req, res) => {
    const book = bookDB.find((b) => b.title === req.params.title);
    return res.json(book); // res.json
  });

  return [pathPrefix, expressRouter];
};

const createExempleApp = () => {
  const app = express();
  app.use(bodyParser.json());

  app.use(...createBookRouter());

  return app;
};

```

You are able to add middlewares, just as you would with a classic express router.

## Usage with supertest

Here is an exemple of usage with supertest, using the previously defined `mySharedRoutes`, and the `createExempleApp`:

```typescript
import { createSupertestSharedCaller } from "shared-routes-supertest";
import { sharedRouters } from "path/to/where/sharedRouters/are/defined"

const fakeAuthToken = "my-token";

const app = createExempleApp();
const supertestRequest = supertest(app);
const supertestSharedCaller = createSupertestSharedCaller(
  sharedRouters,
  supertestRequest
);

const heyBook: Book = { title: "Hey", author: "Steeve" };
const addBookResponse = await supertestSharedCaller.addBook({
  body: heyBook,
  headers: { authorization: fakeAuthToken },
});
expect(addBookResponse.status).toBe(200);

const getAllBooksResponse = await supertestSharedCaller.getAllBooks({
  queryParams: { max: 5 },
});
expect(getAllBooksResponse.status).toBe(200);
// getAllBooksResponse.body is of type Book[]
expectToEqual(getAllBooksResponse.body, [heyBook]);

const bookResponse = await supertestSharedCaller.getBookByTitle({
  params: {title: "My title"},
  headers: {authorization: "my-token"}
})
```

You can see the express app and the supertest exemple tested in this file :
[createSupertestSharedClient.test.ts](https://github.com/JeromeBu/shared-routes/blob/main/packages/shared-routes-supertest/src/createSupertestSharedCaller.test.ts)

## Usage with axios

```typescript
import { createAxiosSharedCaller } from "shared-routes-axios";
import axios from "axios";
import { sharedRouters } from "path/to/where/sharedRouters/are/defined"

const axiosSharedCaller = createAxiosSharedCaller(sharedRouters, axios, {
  proxyPrefix: "/api",
});

const getAllBooksResponse = await axiosSharedCaller.getAllBooks({
  queryParams: { max: 3 },
});
// getAllBooksResponse.data is of type Book[]

const getByTitleResponse = await axiosSharedCaller.getByTitle({
  params: { title: "great" },
});
// getByTitleResponse.data is of type Book | undefined
```
