// mostly from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/ef87ee53bc501c0f0e79797add156fd8fa904ede/types/express-serve-static-core/index.d.ts#L98-L121

export interface ParamsDictionary {
  [key: string]: string;
}

// prettier-ignore
type RemoveTail<S extends string, Tail extends string> = S extends `${infer P}${Tail}` ? P : S;

type GetRouteParameter<S extends string> = RemoveTail<
  RemoveTail<RemoveTail<S, `/${string}`>, `-${string}`>,
  `.${string}`
>;

// prettier-ignore
export type PathParameters<Route extends string> = string extends Route
  ? ParamsDictionary
  : Route extends `${string}:${infer Rest}`
    ? (
      GetRouteParameter<Rest> extends never
        ? ParamsDictionary
        : GetRouteParameter<Rest> extends `${infer ParamName}?`
          ? { [P in ParamName]?: string }
          : { [P in GetRouteParameter<Rest>]: string }
      ) &
      (Rest extends `${GetRouteParameter<Rest>}${infer Next}`
        ? PathParameters<Next> : unknown)
      : {};

const keys = <Obj extends Record<string, unknown>>(obj: Obj): (keyof Obj)[] =>
  Object.keys(obj) as (keyof Obj)[];

export const replacePathWithParams = <Path extends string>(
  path: Path,
  params: PathParameters<Path>,
): string => {
  const paramNames = keys(params);
  if (paramNames.length === 0) return path;
  return paramNames.reduce((acc, paramName) => {
    return acc.replace(`:${paramName}`, params[paramName]);
  }, path as any);
};
