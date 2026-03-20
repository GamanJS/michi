export interface MichiResult<T> {
  handle: T;
  params: Record<string, any>;
}

export interface ChunkRoute<T> {
  name: string;
  handle: T | null;
  next: Route<T> | null;
}

export interface Route<T> {
  path: string;
  handle: T | null;
  wildcardHandle: T | null;
  childrens: Record<number, Route<T>> | null;
  chunks: ChunkRoute<T> | null;
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
      handle: null,
      wildcardHandle: null,
      childrens: null,
      chunks: null,
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
        if (!route.chunks) {
          route.chunks = { name: paramName, handle: null, next: null };
        }

        if (i === totalIndex && !isWildcard) {
          route.chunks.handle = handle;
          return handle;
        }

        if (!route.chunks.next) route.chunks.next = this.createRoute("/");
        route = route.chunks.next;
        continue;
      }

      // ? Handle Static Segment
      if (!route.childrens) route.childrens = {};
      const charCode = part.charCodeAt(0);

      if (!route.childrens[charCode]) {
        route.childrens[charCode] = this.createRoute(part);
      }
      route = route.childrens[charCode];
    }

    if (isWildcard) route.wildcardHandle = handle;
    else route.handle = handle;

    return handle;
  }

  find(method: string, path: string): MichiResult<T> | null {
    const root = this.roots[method.toUpperCase()];
    if (!root) return null;

    if (path === "/" || path === "") {
      return root.handle ? { handle: root.handle, params: {} } : null;
    }

    return this.match(path, path.length, root, 0);
  }

  private match(
    url: string,
    len: number,
    root: Route<T>,
    start: number,
  ): MichiResult<T> | null {
    const path = root.path;
    const pathLen = path.length;

    if (path !== "/") {
      if (url.substring(start, start + pathLen) !== path) return null;
      start += pathLen;
    }

    if (url[start] === "/") start++;

    if (start >= len) {
      if (root.handle) return { handle: root.handle, params: {} };
      if (root.wildcardHandle)
        return { handle: root.wildcardHandle, params: { "*": "" } };
      return null;
    }

    // Static Priority
    if (root.childrens) {
      const nextNode = root.childrens[url.charCodeAt(start)];
      if (nextNode) {
        const res = this.match(url, len, nextNode, start);
        if (res) return res;
      }
    }

    // Dynamic Params
    if (root.chunks) {
      const nextSlash = url.indexOf("/", start);
      const isLast = nextSlash === -1 || nextSlash >= len;

      if (isLast) {
        if (root.chunks.handle) {
          return {
            handle: root.chunks.handle,
            params: { [root.chunks.name]: nv(url.substring(start, len)) },
          };
        }
      } else if (root.chunks.next) {
        const res = this.match(url, len, root.chunks.next, nextSlash);
        if (res) {
          res.params[root.chunks.name] = nv(url.substring(start, nextSlash));
          return res;
        }
      }
    }

    // Wildcard Fallback
    if (root.wildcardHandle) {
      return {
        handle: root.wildcardHandle,
        params: { "*": nv(url.substring(start, len)) },
      };
    }

    return null;
  }
}
