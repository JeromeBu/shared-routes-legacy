# shared-routes

## 0.5.2

### Patch Changes

- 6d99e67: create shared-route-openapi to be able to generate openapi json from shared-route
- 9d13f71: add createCustomSharedClient to easly create simulated or tests implementation of http-clients"

## 0.5.1

### Patch Changes

- make handlers generic and improve defineRoutes interface

## 0.5.0

### Minor Changes

- 142227d: simplify by having only one level of routes. Refactor axios and supertest, with a new configureCreateHttpClient common function.

### Patch Changes

- 5c5d50f: setup to publish lib as commonjs

## 0.4.0

### Minor Changes

- improve interafce to use an object sharedRouters with keys as router names

## 0.3.0

### Minor Changes

- fa83d1b: make params, query and body not mandatory when they are void (big improvement of Dev Exp)

## 0.2.0

### Minor Changes

- aa0d8b9: Fix packages and add listRoutes function

## 0.1.0

### Minor Changes

- 4745923: Add the possiblity to prefix routes

## 0.0.2

### Patch Changes

- 1dfc2c3: Set up eslint
