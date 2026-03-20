export interface MichiResult<T> {
  data: T;
  params: Record<string, any>;
}

export interface ParamRoute<T> {
  name: string;
  data: T | null;
  next: Route<T> | null;
}

export interface Route<T> {
  path: string;
  data: T | null;
  fallbackData: T | null;
  statics: Record<number, Route<T>> | null;
  params: ParamRoute<T> | null;
}

// Normalize Value (String to Native)
const nv = (v: any) => {
  if (typeof v !== "string") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  const num = Number(v);
  return isNaN(num) ? v : num;
};

export class Michi<T> {
  private roots: Record<string, Route<T>> = {};

  private static regex = {
    optionalParams: /(\/:\w+\?)/g,
  };

  private createRoute(path: string): Route<T> {
    return {
      path,
      data: null,
      fallbackData: null,
      statics: null,
      params: null,
    };
  }

  add(
    method: string,
    path: string,
    handle: T,
    ops?: {
      // @default false
      useOriginalPath?: boolean;
    },
  ): T {
    if (!ops?.useOriginalPath) {
      if (!path || path === "") path = "/";
      if (path[0] !== "/") path = "/" + path;
    }
    method = method.toUpperCase();

    // ? handle optional parameter
    if (path.includes("?")) {
      const originalPath = path.replace(/\?/g, "");
      const optionalParts = path.match(Michi.regex.optionalParams) || [];

      /**
       * ? add versi lengkap
       * ? misal: GET /profile/:id? jadi GET /profile
       */
      this.add(method, originalPath, handle, ops); //? loop add

      /**
       * ? add masing masing optional param tanpa /profile (original path)
       * ? misal add POST /profile/:id?/:name?
       * ? list yang terdaftar:
       * ?   -> /profile/:id/:name (full)
       * ?   -> /profile/:name (loop 1)
       * ?   -> /profile/:id (loop 2)
       * ?   -> ...etc
       */
      for (const part of optionalParts) {
        const shorterPath = path.replace(part, "");
        this.add(method, shorterPath, handle, ops); //? lloop add
      }
      return handle;
    }

    const isWildcard = path.endsWith("*");
    const cleanPath = isWildcard ? path.slice(0, -1) : path;

    if (!this.roots[method]) this.roots[method] = this.createRoute("/");
    let route = this.roots[method];

    /**
     * ? pecah jadi segments / array
     * ? contoh: /profile/21515/:id
     * ? jadi: ['profile', '21515', ':id']
     */
    const segments = cleanPath.split("/").filter(Boolean);

    for (let i = 0; i < segments.length; i++) {
      const totalIndex = segments.length - 1;
      const part = segments[i];

      // ? handle dinamic / params segments
      if (part[0] === ":") {
        const paramName = part.slice(1); // ? ambil string setelah index 0
        if (!route.params) {
          route.params = { name: paramName, data: null, next: null };
        }

        if (i === totalIndex && !isWildcard) {
          route.params.data = handle;
          return handle;
        }

        if (!route.params.next) route.params.next = this.createRoute("/");
        route = route.params.next;
        continue;
      }

      // ? Handle Static Segment
      if (!route.statics) route.statics = {};
      const charCode = part.charCodeAt(0);

      if (!route.statics[charCode]) {
        route.statics[charCode] = this.createRoute(part);
      }
      route = route.statics[charCode];
    }

    if (isWildcard) route.fallbackData = handle;
    else route.data = handle;

    return handle;
  }

  find(method: string, path: string): MichiResult<T> | null {
    const root = this.roots[method.toUpperCase()];
    if (!root) return null;

    if (path === "/" || path === "") {
      return root.data ? { data: root.data, params: {} } : null;
    }

    return this.match(path, path.length, root, 0);
  }

  private match(
    pathname: string,
    len: number,
    root: Route<T>,
    start: number,
  ): MichiResult<T> | null {
    const path = root.path;
    const pathLen = path.length;

    if (path !== "/") {
      if (pathname.substring(start, start + pathLen) !== path) return null;
      start += pathLen;
    }

    if (pathname[start] === "/") start++;

    if (start >= len) {
      if (root.data) return { data: root.data, params: {} };
      if (root.fallbackData)
        return { data: root.fallbackData, params: { "*": "" } };
      return null;
    }

    // Static Priority
    if (root.statics) {
      const nextNode = root.statics[pathname.charCodeAt(start)];
      if (nextNode) {
        const res = this.match(pathname, len, nextNode, start);
        if (res) return res;
      }
    }

    // Dynamic Params
    if (root.params) {
      const nextSlash = pathname.indexOf("/", start);
      const isLast = nextSlash === -1 || nextSlash >= len;

      if (isLast) {
        if (root.params.data) {
          return {
            data: root.params.data,
            params: { [root.params.name]: nv(pathname.substring(start, len)) },
          };
        }
      } else if (root.params.next) {
        const res = this.match(pathname, len, root.params.next, nextSlash);
        if (res) {
          res.params[root.params.name] = nv(pathname.substring(start, nextSlash));
          return res;
        }
      }
    }

    // Wildcard Fallback
    if (root.fallbackData) {
      return {
        data: root.fallbackData,
        params: { "*": nv(pathname.substring(start, len)) },
      };
    }

    return null;
  }
}
