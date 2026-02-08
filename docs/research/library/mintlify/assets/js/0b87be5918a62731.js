!(() => {
  try {
    var e =
        "undefined" != typeof globalThis
          ? globalThis
          : "undefined" != typeof global
            ? global
            : "undefined" != typeof window
              ? window
              : "undefined" != typeof self
                ? self
                : {},
      n = new e.Error().stack;
    n && ((e._debugIds || (e._debugIds = {}))[n] = "b87cace6-6fc7-a5a8-95c4-3e3d3ca1040e");
  } catch (e) {}
})();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  "object" == typeof document ? document.currentScript : void 0,
  959411,
  (e) => {
    var t = e.i(489419),
      i = e.i(248425),
      r = e.i(45886),
      s = Object.freeze({
        position: "absolute",
        border: 0,
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        wordWrap: "normal",
      }),
      n = t.forwardRef((e, t) =>
        (0, r.jsx)(i.Primitive.span, { ...e, ref: t, style: { ...s, ...e.style } }),
      );
    (n.displayName = "VisuallyHidden"),
      e.s(["VISUALLY_HIDDEN_STYLES", () => s, "VisuallyHidden", () => n]);
  },
  595590,
  (e) => {
    var t = e.i(45886),
      i = e.i(523599),
      r = e.i(489419);
    const s = (e) => "light" === e || "dark" === e || "system" === e,
      n = (0, r.createContext)(void 0);
    function o(e) {
      let o,
        a,
        u,
        l,
        c,
        h,
        d,
        f,
        p = (0, i.c)(14),
        { children: y } = e,
        [m, v] = (0, r.useState)("system"),
        [b, g] = (0, r.useState)("light");
      return (
        p[0] !== m
          ? ((o = () => {
              const e = window.document.documentElement,
                t = () => {
                  let t, i;
                  t =
                    "system" === m
                      ? window.matchMedia("(prefers-color-scheme: dark)").matches
                        ? "dark"
                        : "light"
                      : m;
                  const r =
                    ((i = document.createElement("style")).appendChild(
                      document.createTextNode(
                        "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}",
                      ),
                    ),
                    document.head.appendChild(i),
                    () => {
                      window.getComputedStyle(document.body),
                        setTimeout(() => {
                          document.head.removeChild(i);
                        }, 1);
                    });
                  g(t), e.classList.remove("light", "dark"), e.classList.add(t), r();
                };
              if ((t(), "system" === m)) {
                const e = window.matchMedia("(prefers-color-scheme: dark)");
                return e.addEventListener("change", t), () => e.removeEventListener("change", t);
              }
            }),
            (a = [m]),
            (p[0] = m),
            (p[1] = o),
            (p[2] = a))
          : ((o = p[1]), (a = p[2])),
        (0, r.useEffect)(o, a),
        p[3] === Symbol.for("react.memo_cache_sentinel")
          ? ((u = () => {
              const e = localStorage.getItem("theme");
              s(e) && v(e);
            }),
            (l = []),
            (p[3] = u),
            (p[4] = l))
          : ((u = p[3]), (l = p[4])),
        (0, r.useEffect)(u, l),
        p[5] !== m
          ? ((c = () => {
              localStorage.setItem("theme", m);
            }),
            (h = [m]),
            (p[5] = m),
            (p[6] = c),
            (p[7] = h))
          : ((c = p[6]), (h = p[7])),
        (0, r.useEffect)(c, h),
        p[8] !== b || p[9] !== m
          ? ((d = { theme: m, setTheme: v, resolvedTheme: b }), (p[8] = b), (p[9] = m), (p[10] = d))
          : (d = p[10]),
        p[11] !== y || p[12] !== d
          ? ((f = (0, t.jsx)(n.Provider, { value: d, children: y })),
            (p[11] = y),
            (p[12] = d),
            (p[13] = f))
          : (f = p[13]),
        f
      );
    }
    function a() {
      const e = (0, r.useContext)(n);
      if (!e) throw Error("useThemeContext must be used within a ThemeProvider");
      return e;
    }
    e.s(["ThemeProvider", () => o, "isValidTheme", 0, s, "useThemeContext", () => a]);
  },
  426199,
  (e, t, i) => {
    Object.defineProperty(i, "__esModule", { value: !0 }),
      Object.defineProperty(i, "BailoutToCSR", { enumerable: !0, get: () => s });
    const r = e.r(326743);
    function s({ reason: e, children: t }) {
      if ("undefined" == typeof window)
        throw Object.defineProperty(new r.BailoutToCSRError(e), "__NEXT_ERROR_CODE", {
          value: "E394",
          enumerable: !1,
          configurable: !0,
        });
      return t;
    }
  },
  128024,
  (e, t, i) => {
    Object.defineProperty(i, "__esModule", { value: !0 }),
      Object.defineProperty(i, "PreloadChunks", { enumerable: !0, get: () => a });
    const r = e.r(45886),
      s = e.r(777833),
      n = e.r(838898),
      o = e.r(187844);
    function a({ moduleIds: e }) {
      if ("undefined" != typeof window) return null;
      const t = n.workAsyncStorage.getStore();
      if (void 0 === t) return null;
      const i = [];
      if (t.reactLoadableManifest && e) {
        const r = t.reactLoadableManifest;
        for (const t of e) {
          if (!r[t]) continue;
          const e = r[t].files;
          i.push(...e);
        }
      }
      return 0 === i.length
        ? null
        : (0, r.jsx)(r.Fragment, {
            children: i.map((e) => {
              const i = `${t.assetPrefix}/_next/${(0, o.encodeURIPath)(e)}?dpl=dpl_3bq395izgizpVU7ft93B6FgPyiAU`;
              return e.endsWith(".css")
                ? (0, r.jsx)(
                    "link",
                    {
                      precedence: "dynamic",
                      href: i,
                      rel: "stylesheet",
                      as: "style",
                      nonce: t.nonce,
                    },
                    e,
                  )
                : ((0, s.preload)(i, { as: "script", fetchPriority: "low", nonce: t.nonce }), null);
            }),
          });
    }
  },
  697539,
  (e, t, i) => {
    Object.defineProperty(i, "__esModule", { value: !0 }),
      Object.defineProperty(i, "default", { enumerable: !0, get: () => l });
    const r = e.r(45886),
      s = e.r(489419),
      n = e.r(426199),
      o = e.r(128024);
    function a(e) {
      return { default: e && "default" in e ? e.default : e };
    }
    const u = { loader: () => Promise.resolve(a(() => null)), loading: null, ssr: !0 },
      l = (e) => {
        const t = { ...u, ...e },
          i = (0, s.lazy)(() => t.loader().then(a)),
          l = t.loading;
        function c(e) {
          const a = l ? (0, r.jsx)(l, { isLoading: !0, pastDelay: !0, error: null }) : null,
            u = !t.ssr || !!t.loading,
            c = u ? s.Suspense : s.Fragment,
            h = t.ssr
              ? (0, r.jsxs)(r.Fragment, {
                  children: [
                    "undefined" == typeof window
                      ? (0, r.jsx)(o.PreloadChunks, { moduleIds: t.modules })
                      : null,
                    (0, r.jsx)(i, { ...e }),
                  ],
                })
              : (0, r.jsx)(n.BailoutToCSR, {
                  reason: "next/dynamic",
                  children: (0, r.jsx)(i, { ...e }),
                });
          return (0, r.jsx)(c, { ...(u ? { fallback: a } : {}), children: h });
        }
        return (c.displayName = "LoadableComponent"), c;
      };
  },
  296634,
  (e, t, i) => {
    Object.defineProperty(i, "__esModule", { value: !0 }),
      Object.defineProperty(i, "default", { enumerable: !0, get: () => s });
    const r = e.r(60864)._(e.r(697539));
    function s(e, t) {
      const i = {};
      "function" == typeof e && (i.loader = e);
      const s = { ...i, ...t };
      return (0, r.default)({ ...s, modules: s.loadableGenerated?.modules });
    }
    ("function" == typeof i.default || ("object" == typeof i.default && null !== i.default)) &&
      void 0 === i.default.__esModule &&
      (Object.defineProperty(i.default, "__esModule", { value: !0 }),
      Object.assign(i.default, i),
      (t.exports = i.default));
  },
  114272,
  (e) => {
    var t = e.i(540143),
      i = e.i(88587),
      r = e.i(936553),
      s = class extends i.Removable {
        #e;
        #t;
        #i;
        constructor(e) {
          super(),
            (this.mutationId = e.mutationId),
            (this.#t = e.mutationCache),
            (this.#e = []),
            (this.state = e.state || n()),
            this.setOptions(e.options),
            this.scheduleGc();
        }
        setOptions(e) {
          (this.options = e), this.updateGcTime(this.options.gcTime);
        }
        get meta() {
          return this.options.meta;
        }
        addObserver(e) {
          this.#e.includes(e) ||
            (this.#e.push(e),
            this.clearGcTimeout(),
            this.#t.notify({ type: "observerAdded", mutation: this, observer: e }));
        }
        removeObserver(e) {
          (this.#e = this.#e.filter((t) => t !== e)),
            this.scheduleGc(),
            this.#t.notify({ type: "observerRemoved", mutation: this, observer: e });
        }
        optionalRemove() {
          this.#e.length ||
            ("pending" === this.state.status ? this.scheduleGc() : this.#t.remove(this));
        }
        continue() {
          return this.#i?.continue() ?? this.execute(this.state.variables);
        }
        async execute(e) {
          const t = () => {
            this.#r({ type: "continue" });
          };
          this.#i = (0, r.createRetryer)({
            fn: () =>
              this.options.mutationFn
                ? this.options.mutationFn(e)
                : Promise.reject(Error("No mutationFn found")),
            onFail: (e, t) => {
              this.#r({ type: "failed", failureCount: e, error: t });
            },
            onPause: () => {
              this.#r({ type: "pause" });
            },
            onContinue: t,
            retry: this.options.retry ?? 0,
            retryDelay: this.options.retryDelay,
            networkMode: this.options.networkMode,
            canRun: () => this.#t.canRun(this),
          });
          const i = "pending" === this.state.status,
            s = !this.#i.canStart();
          try {
            if (i) t();
            else {
              this.#r({ type: "pending", variables: e, isPaused: s }),
                await this.#t.config.onMutate?.(e, this);
              const t = await this.options.onMutate?.(e);
              t !== this.state.context &&
                this.#r({ type: "pending", context: t, variables: e, isPaused: s });
            }
            const r = await this.#i.start();
            return (
              await this.#t.config.onSuccess?.(r, e, this.state.context, this),
              await this.options.onSuccess?.(r, e, this.state.context),
              await this.#t.config.onSettled?.(
                r,
                null,
                this.state.variables,
                this.state.context,
                this,
              ),
              await this.options.onSettled?.(r, null, e, this.state.context),
              this.#r({ type: "success", data: r }),
              r
            );
          } catch (t) {
            try {
              throw (
                (await this.#t.config.onError?.(t, e, this.state.context, this),
                await this.options.onError?.(t, e, this.state.context),
                await this.#t.config.onSettled?.(
                  void 0,
                  t,
                  this.state.variables,
                  this.state.context,
                  this,
                ),
                await this.options.onSettled?.(void 0, t, e, this.state.context),
                t)
              );
            } finally {
              this.#r({ type: "error", error: t });
            }
          } finally {
            this.#t.runNext(this);
          }
        }
        #r(e) {
          (this.state = ((t) => {
            switch (e.type) {
              case "failed":
                return { ...t, failureCount: e.failureCount, failureReason: e.error };
              case "pause":
                return { ...t, isPaused: !0 };
              case "continue":
                return { ...t, isPaused: !1 };
              case "pending":
                return {
                  ...t,
                  context: e.context,
                  data: void 0,
                  failureCount: 0,
                  failureReason: null,
                  error: null,
                  isPaused: e.isPaused,
                  status: "pending",
                  variables: e.variables,
                  submittedAt: Date.now(),
                };
              case "success":
                return {
                  ...t,
                  data: e.data,
                  failureCount: 0,
                  failureReason: null,
                  error: null,
                  status: "success",
                  isPaused: !1,
                };
              case "error":
                return {
                  ...t,
                  data: void 0,
                  error: e.error,
                  failureCount: t.failureCount + 1,
                  failureReason: e.error,
                  isPaused: !1,
                  status: "error",
                };
            }
          })(this.state)),
            t.notifyManager.batch(() => {
              this.#e.forEach((t) => {
                t.onMutationUpdate(e);
              }),
                this.#t.notify({ mutation: this, type: "updated", action: e });
            });
        }
      };
    function n() {
      return {
        context: void 0,
        data: void 0,
        error: null,
        failureCount: 0,
        failureReason: null,
        isPaused: !1,
        status: "idle",
        variables: void 0,
        submittedAt: 0,
      };
    }
    e.s(["Mutation", () => s, "getDefaultState", () => n]);
  },
  912598,
  (e) => {
    var t = e.i(489419),
      i = e.i(45886),
      r = t.createContext(void 0),
      s = (e) => {
        const i = t.useContext(r);
        if (e) return e;
        if (!i) throw Error("No QueryClient set, use QueryClientProvider to set one");
        return i;
      },
      n = ({ client: e, children: s }) => (
        t.useEffect(
          () => (
            e.mount(),
            () => {
              e.unmount();
            }
          ),
          [e],
        ),
        (0, i.jsx)(r.Provider, { value: e, children: s })
      );
    e.s(["QueryClientProvider", () => n, "useQueryClient", () => s]);
  },
  619273,
  (e) => {
    var t = "undefined" == typeof window || "Deno" in globalThis;
    function i() {}
    function r(e, t) {
      return "function" == typeof e ? e(t) : e;
    }
    function s(e) {
      return "number" == typeof e && e >= 0 && e !== 1 / 0;
    }
    function n(e, t) {
      return Math.max(e + (t || 0) - Date.now(), 0);
    }
    function o(e, t) {
      return "function" == typeof e ? e(t) : e;
    }
    function a(e, t) {
      return "function" == typeof e ? e(t) : e;
    }
    function u(e, t) {
      const { type: i = "all", exact: r, fetchStatus: s, predicate: n, queryKey: o, stale: a } = e;
      if (o) {
        if (r) {
          if (t.queryHash !== c(o, t.options)) return !1;
        } else if (!d(t.queryKey, o)) return !1;
      }
      if ("all" !== i) {
        const e = t.isActive();
        if (("active" === i && !e) || ("inactive" === i && e)) return !1;
      }
      return (
        ("boolean" != typeof a || t.isStale() === a) &&
        (!s || s === t.state.fetchStatus) &&
        (!n || !!n(t))
      );
    }
    function l(e, t) {
      const { exact: i, status: r, predicate: s, mutationKey: n } = e;
      if (n) {
        if (!t.options.mutationKey) return !1;
        if (i) {
          if (h(t.options.mutationKey) !== h(n)) return !1;
        } else if (!d(t.options.mutationKey, n)) return !1;
      }
      return (!r || t.state.status === r) && (!s || !!s(t));
    }
    function c(e, t) {
      return (t?.queryKeyHashFn || h)(e);
    }
    function h(e) {
      return JSON.stringify(e, (e, t) =>
        y(t)
          ? Object.keys(t)
              .sort()
              .reduce((e, i) => ((e[i] = t[i]), e), {})
          : t,
      );
    }
    function d(e, t) {
      return (
        e === t ||
        (typeof e == typeof t &&
          !!e &&
          !!t &&
          "object" == typeof e &&
          "object" == typeof t &&
          Object.keys(t).every((i) => d(e[i], t[i])))
      );
    }
    function f(e, t) {
      if (!t || Object.keys(e).length !== Object.keys(t).length) return !1;
      for (const i in e) if (e[i] !== t[i]) return !1;
      return !0;
    }
    function p(e) {
      return Array.isArray(e) && e.length === Object.keys(e).length;
    }
    function y(e) {
      if (!m(e)) return !1;
      const t = e.constructor;
      if (void 0 === t) return !0;
      const i = t.prototype;
      return (
        !!m(i) &&
        !!Object.hasOwn(i, "isPrototypeOf") &&
        Object.getPrototypeOf(e) === Object.prototype
      );
    }
    function m(e) {
      return "[object Object]" === Object.prototype.toString.call(e);
    }
    function v(e) {
      return new Promise((t) => {
        setTimeout(t, e);
      });
    }
    function b(e, t, i) {
      return "function" == typeof i.structuralSharing
        ? i.structuralSharing(e, t)
        : !1 !== i.structuralSharing
          ? (function e(t, i) {
              if (t === i) return t;
              const r = p(t) && p(i);
              if (r || (y(t) && y(i))) {
                let s = r ? t : Object.keys(t),
                  n = s.length,
                  o = r ? i : Object.keys(i),
                  a = o.length,
                  u = r ? [] : {},
                  l = 0;
                for (let n = 0; n < a; n++) {
                  const a = r ? n : o[n];
                  ((!r && s.includes(a)) || r) && void 0 === t[a] && void 0 === i[a]
                    ? ((u[a] = void 0), l++)
                    : ((u[a] = e(t[a], i[a])), u[a] === t[a] && void 0 !== t[a] && l++);
                }
                return n === a && l === n ? t : u;
              }
              return i;
            })(e, t)
          : t;
    }
    function g(e) {
      return e;
    }
    function w(e, t, i = 0) {
      const r = [...e, t];
      return i && r.length > i ? r.slice(1) : r;
    }
    function S(e, t, i = 0) {
      const r = [t, ...e];
      return i && r.length > i ? r.slice(0, -1) : r;
    }
    var P = Symbol();
    function C(e, t) {
      return !e.queryFn && t?.initialPromise
        ? () => t.initialPromise
        : e.queryFn && e.queryFn !== P
          ? e.queryFn
          : () => Promise.reject(Error(`Missing queryFn: '${e.queryHash}'`));
    }
    e.s([
      "addToEnd",
      () => w,
      "addToStart",
      () => S,
      "ensureQueryFn",
      () => C,
      "functionalUpdate",
      () => r,
      "hashKey",
      () => h,
      "hashQueryKeyByOptions",
      () => c,
      "isServer",
      () => t,
      "isValidTimeout",
      () => s,
      "keepPreviousData",
      () => g,
      "matchMutation",
      () => l,
      "matchQuery",
      () => u,
      "noop",
      () => i,
      "partialMatchKey",
      () => d,
      "replaceData",
      () => b,
      "resolveEnabled",
      () => a,
      "resolveStaleTime",
      () => o,
      "shallowEqualObjects",
      () => f,
      "skipToken",
      () => P,
      "sleep",
      () => v,
      "timeUntilStale",
      () => n,
    ]);
  },
  540143,
  (e) => {
    let t, i, r, s, n, o;
    var a =
      ((t = []),
      (i = 0),
      (r = (e) => {
        e();
      }),
      (s = (e) => {
        e();
      }),
      (n = (e) => setTimeout(e, 0)),
      {
        batch: (e) => {
          let o;
          i++;
          try {
            o = e();
          } finally {
            let e;
            --i ||
              ((e = t),
              (t = []),
              e.length &&
                n(() => {
                  s(() => {
                    e.forEach((e) => {
                      r(e);
                    });
                  });
                }));
          }
          return o;
        },
        batchCalls:
          (e) =>
          (...t) => {
            o(() => {
              e(...t);
            });
          },
        schedule: (o = (e) => {
          i
            ? t.push(e)
            : n(() => {
                r(e);
              });
        }),
        setNotifyFunction: (e) => {
          r = e;
        },
        setBatchNotifyFunction: (e) => {
          s = e;
        },
        setScheduler: (e) => {
          n = e;
        },
      });
    e.s(["notifyManager", () => a]);
  },
  915823,
  (e) => {
    var t = class {
      constructor() {
        (this.listeners = new Set()), (this.subscribe = this.subscribe.bind(this));
      }
      subscribe(e) {
        return (
          this.listeners.add(e),
          this.onSubscribe(),
          () => {
            this.listeners.delete(e), this.onUnsubscribe();
          }
        );
      }
      hasListeners() {
        return this.listeners.size > 0;
      }
      onSubscribe() {}
      onUnsubscribe() {}
    };
    e.s(["Subscribable", () => t]);
  },
  175555,
  (e) => {
    var t = e.i(915823),
      i = e.i(619273),
      r = new (class extends t.Subscribable {
        #s;
        #n;
        #o;
        constructor() {
          super(),
            (this.#o = (e) => {
              if (!i.isServer && window.addEventListener) {
                const t = () => e();
                return (
                  window.addEventListener("visibilitychange", t, !1),
                  () => {
                    window.removeEventListener("visibilitychange", t);
                  }
                );
              }
            });
        }
        onSubscribe() {
          this.#n || this.setEventListener(this.#o);
        }
        onUnsubscribe() {
          this.hasListeners() || (this.#n?.(), (this.#n = void 0));
        }
        setEventListener(e) {
          (this.#o = e),
            this.#n?.(),
            (this.#n = e((e) => {
              "boolean" == typeof e ? this.setFocused(e) : this.onFocus();
            }));
        }
        setFocused(e) {
          this.#s !== e && ((this.#s = e), this.onFocus());
        }
        onFocus() {
          const e = this.isFocused();
          this.listeners.forEach((t) => {
            t(e);
          });
        }
        isFocused() {
          return "boolean" == typeof this.#s
            ? this.#s
            : globalThis.document?.visibilityState !== "hidden";
        }
      })();
    e.s(["focusManager", () => r]);
  },
  936553,
  814448,
  793803,
  (e) => {
    var t = e.i(175555),
      i = e.i(915823),
      r = e.i(619273),
      s = new (class extends i.Subscribable {
        #a = !0;
        #n;
        #o;
        constructor() {
          super(),
            (this.#o = (e) => {
              if (!r.isServer && window.addEventListener) {
                const t = () => e(!0),
                  i = () => e(!1);
                return (
                  window.addEventListener("online", t, !1),
                  window.addEventListener("offline", i, !1),
                  () => {
                    window.removeEventListener("online", t),
                      window.removeEventListener("offline", i);
                  }
                );
              }
            });
        }
        onSubscribe() {
          this.#n || this.setEventListener(this.#o);
        }
        onUnsubscribe() {
          this.hasListeners() || (this.#n?.(), (this.#n = void 0));
        }
        setEventListener(e) {
          (this.#o = e), this.#n?.(), (this.#n = e(this.setOnline.bind(this)));
        }
        setOnline(e) {
          this.#a !== e &&
            ((this.#a = e),
            this.listeners.forEach((t) => {
              t(e);
            }));
        }
        isOnline() {
          return this.#a;
        }
      })();
    function n() {
      let e,
        t,
        i = new Promise((i, r) => {
          (e = i), (t = r);
        });
      function r(e) {
        Object.assign(i, e), delete i.resolve, delete i.reject;
      }
      return (
        (i.status = "pending"),
        i.catch(() => {}),
        (i.resolve = (t) => {
          r({ status: "fulfilled", value: t }), e(t);
        }),
        (i.reject = (e) => {
          r({ status: "rejected", reason: e }), t(e);
        }),
        i
      );
    }
    function o(e) {
      return Math.min(1e3 * 2 ** e, 3e4);
    }
    function a(e) {
      return (e ?? "online") !== "online" || s.isOnline();
    }
    e.s(["onlineManager", () => s], 814448), e.s(["pendingThenable", () => n], 793803);
    var u = class extends Error {
      constructor(e) {
        super("CancelledError"), (this.revert = e?.revert), (this.silent = e?.silent);
      }
    };
    function l(e) {
      return e instanceof u;
    }
    function c(e) {
      let i,
        l = !1,
        c = 0,
        h = !1,
        d = n(),
        f = () =>
          t.focusManager.isFocused() && ("always" === e.networkMode || s.isOnline()) && e.canRun(),
        p = () => a(e.networkMode) && e.canRun(),
        y = (t) => {
          h || ((h = !0), e.onSuccess?.(t), i?.(), d.resolve(t));
        },
        m = (t) => {
          h || ((h = !0), e.onError?.(t), i?.(), d.reject(t));
        },
        v = () =>
          new Promise((t) => {
            (i = (e) => {
              (h || f()) && t(e);
            }),
              e.onPause?.();
          }).then(() => {
            (i = void 0), h || e.onContinue?.();
          }),
        b = () => {
          let t;
          if (h) return;
          const i = 0 === c ? e.initialPromise : void 0;
          try {
            t = i ?? e.fn();
          } catch (e) {
            t = Promise.reject(e);
          }
          Promise.resolve(t)
            .then(y)
            .catch((t) => {
              if (h) return;
              const i = e.retry ?? 3 * !r.isServer,
                s = e.retryDelay ?? o,
                n = "function" == typeof s ? s(c, t) : s,
                a =
                  !0 === i ||
                  ("number" == typeof i && c < i) ||
                  ("function" == typeof i && i(c, t));
              l || !a
                ? m(t)
                : (c++,
                  e.onFail?.(c, t),
                  (0, r.sleep)(n)
                    .then(() => (f() ? void 0 : v()))
                    .then(() => {
                      l ? m(t) : b();
                    }));
            });
        };
      return {
        promise: d,
        cancel: (t) => {
          h || (m(new u(t)), e.abort?.());
        },
        continue: () => (i?.(), d),
        cancelRetry: () => {
          l = !0;
        },
        continueRetry: () => {
          l = !1;
        },
        canStart: p,
        start: () => (p() ? b() : v().then(b), d),
      };
    }
    e.s(["canFetch", () => a, "createRetryer", () => c, "isCancelledError", () => l], 936553);
  },
  88587,
  (e) => {
    var t = e.i(619273),
      i = class {
        #u;
        destroy() {
          this.clearGcTimeout();
        }
        scheduleGc() {
          this.clearGcTimeout(),
            (0, t.isValidTimeout)(this.gcTime) &&
              (this.#u = setTimeout(() => {
                this.optionalRemove();
              }, this.gcTime));
        }
        updateGcTime(e) {
          this.gcTime = Math.max(this.gcTime || 0, e ?? (t.isServer ? 1 / 0 : 3e5));
        }
        clearGcTimeout() {
          this.#u && (clearTimeout(this.#u), (this.#u = void 0));
        }
      };
    e.s(["Removable", () => i]);
  },
  286491,
  (e) => {
    var t = e.i(619273),
      i = e.i(540143),
      r = e.i(936553),
      s = e.i(88587),
      n = class extends s.Removable {
        #l;
        #c;
        #h;
        #d;
        #i;
        #f;
        #p;
        constructor(e) {
          super(),
            (this.#p = !1),
            (this.#f = e.defaultOptions),
            this.setOptions(e.options),
            (this.observers = []),
            (this.#d = e.client),
            (this.#h = this.#d.getQueryCache()),
            (this.queryKey = e.queryKey),
            (this.queryHash = e.queryHash),
            (this.#l = ((e) => {
              const t = "function" == typeof e.initialData ? e.initialData() : e.initialData,
                i = void 0 !== t,
                r = i
                  ? "function" == typeof e.initialDataUpdatedAt
                    ? e.initialDataUpdatedAt()
                    : e.initialDataUpdatedAt
                  : 0;
              return {
                data: t,
                dataUpdateCount: 0,
                dataUpdatedAt: i ? (r ?? Date.now()) : 0,
                error: null,
                errorUpdateCount: 0,
                errorUpdatedAt: 0,
                fetchFailureCount: 0,
                fetchFailureReason: null,
                fetchMeta: null,
                isInvalidated: !1,
                status: i ? "success" : "pending",
                fetchStatus: "idle",
              };
            })(this.options)),
            (this.state = e.state ?? this.#l),
            this.scheduleGc();
        }
        get meta() {
          return this.options.meta;
        }
        get promise() {
          return this.#i?.promise;
        }
        setOptions(e) {
          (this.options = { ...this.#f, ...e }), this.updateGcTime(this.options.gcTime);
        }
        optionalRemove() {
          this.observers.length || "idle" !== this.state.fetchStatus || this.#h.remove(this);
        }
        setData(e, i) {
          const r = (0, t.replaceData)(this.state.data, e, this.options);
          return (
            this.#r({ data: r, type: "success", dataUpdatedAt: i?.updatedAt, manual: i?.manual }), r
          );
        }
        setState(e, t) {
          this.#r({ type: "setState", state: e, setStateOptions: t });
        }
        cancel(e) {
          const i = this.#i?.promise;
          return this.#i?.cancel(e), i ? i.then(t.noop).catch(t.noop) : Promise.resolve();
        }
        destroy() {
          super.destroy(), this.cancel({ silent: !0 });
        }
        reset() {
          this.destroy(), this.setState(this.#l);
        }
        isActive() {
          return this.observers.some((e) => !1 !== (0, t.resolveEnabled)(e.options.enabled, this));
        }
        isDisabled() {
          return this.getObserversCount() > 0
            ? !this.isActive()
            : this.options.queryFn === t.skipToken ||
                this.state.dataUpdateCount + this.state.errorUpdateCount === 0;
        }
        isStale() {
          return (
            !!this.state.isInvalidated ||
            (this.getObserversCount() > 0
              ? this.observers.some((e) => e.getCurrentResult().isStale)
              : void 0 === this.state.data)
          );
        }
        isStaleByTime(e = 0) {
          return (
            this.state.isInvalidated ||
            void 0 === this.state.data ||
            !(0, t.timeUntilStale)(this.state.dataUpdatedAt, e)
          );
        }
        onFocus() {
          const e = this.observers.find((e) => e.shouldFetchOnWindowFocus());
          e?.refetch({ cancelRefetch: !1 }), this.#i?.continue();
        }
        onOnline() {
          const e = this.observers.find((e) => e.shouldFetchOnReconnect());
          e?.refetch({ cancelRefetch: !1 }), this.#i?.continue();
        }
        addObserver(e) {
          this.observers.includes(e) ||
            (this.observers.push(e),
            this.clearGcTimeout(),
            this.#h.notify({ type: "observerAdded", query: this, observer: e }));
        }
        removeObserver(e) {
          this.observers.includes(e) &&
            ((this.observers = this.observers.filter((t) => t !== e)),
            this.observers.length ||
              (this.#i && (this.#p ? this.#i.cancel({ revert: !0 }) : this.#i.cancelRetry()),
              this.scheduleGc()),
            this.#h.notify({ type: "observerRemoved", query: this, observer: e }));
        }
        getObserversCount() {
          return this.observers.length;
        }
        invalidate() {
          this.state.isInvalidated || this.#r({ type: "invalidate" });
        }
        fetch(e, i) {
          if ("idle" !== this.state.fetchStatus) {
            if (void 0 !== this.state.data && i?.cancelRefetch) this.cancel({ silent: !0 });
            else if (this.#i) return this.#i.continueRetry(), this.#i.promise;
          }
          if ((e && this.setOptions(e), !this.options.queryFn)) {
            const e = this.observers.find((e) => e.options.queryFn);
            e && this.setOptions(e.options);
          }
          const s = new AbortController(),
            n = (e) => {
              Object.defineProperty(e, "signal", {
                enumerable: !0,
                get: () => ((this.#p = !0), s.signal),
              });
            },
            o = () => {
              const e = (0, t.ensureQueryFn)(this.options, i),
                r = { client: this.#d, queryKey: this.queryKey, meta: this.meta };
              return (n(r), (this.#p = !1), this.options.persister)
                ? this.options.persister(e, r, this)
                : e(r);
            },
            a = {
              fetchOptions: i,
              options: this.options,
              queryKey: this.queryKey,
              client: this.#d,
              state: this.state,
              fetchFn: o,
            };
          n(a),
            this.options.behavior?.onFetch(a, this),
            (this.#c = this.state),
            ("idle" === this.state.fetchStatus || this.state.fetchMeta !== a.fetchOptions?.meta) &&
              this.#r({ type: "fetch", meta: a.fetchOptions?.meta });
          const u = (e) => {
            ((0, r.isCancelledError)(e) && e.silent) || this.#r({ type: "error", error: e }),
              (0, r.isCancelledError)(e) ||
                (this.#h.config.onError?.(e, this),
                this.#h.config.onSettled?.(this.state.data, e, this)),
              this.scheduleGc();
          };
          return (
            (this.#i = (0, r.createRetryer)({
              initialPromise: i?.initialPromise,
              fn: a.fetchFn,
              abort: s.abort.bind(s),
              onSuccess: (e) => {
                if (void 0 === e) return void u(Error(`${this.queryHash} data is undefined`));
                try {
                  this.setData(e);
                } catch (e) {
                  u(e);
                  return;
                }
                this.#h.config.onSuccess?.(e, this),
                  this.#h.config.onSettled?.(e, this.state.error, this),
                  this.scheduleGc();
              },
              onError: u,
              onFail: (e, t) => {
                this.#r({ type: "failed", failureCount: e, error: t });
              },
              onPause: () => {
                this.#r({ type: "pause" });
              },
              onContinue: () => {
                this.#r({ type: "continue" });
              },
              retry: a.options.retry,
              retryDelay: a.options.retryDelay,
              networkMode: a.options.networkMode,
              canRun: () => !0,
            })),
            this.#i.start()
          );
        }
        #r(e) {
          const t = (t) => {
            switch (e.type) {
              case "failed":
                return { ...t, fetchFailureCount: e.failureCount, fetchFailureReason: e.error };
              case "pause":
                return { ...t, fetchStatus: "paused" };
              case "continue":
                return { ...t, fetchStatus: "fetching" };
              case "fetch":
                return { ...t, ...o(t.data, this.options), fetchMeta: e.meta ?? null };
              case "success":
                return {
                  ...t,
                  data: e.data,
                  dataUpdateCount: t.dataUpdateCount + 1,
                  dataUpdatedAt: e.dataUpdatedAt ?? Date.now(),
                  error: null,
                  isInvalidated: !1,
                  status: "success",
                  ...(!e.manual && {
                    fetchStatus: "idle",
                    fetchFailureCount: 0,
                    fetchFailureReason: null,
                  }),
                };
              case "error": {
                const i = e.error;
                if ((0, r.isCancelledError)(i) && i.revert && this.#c)
                  return { ...this.#c, fetchStatus: "idle" };
                return {
                  ...t,
                  error: i,
                  errorUpdateCount: t.errorUpdateCount + 1,
                  errorUpdatedAt: Date.now(),
                  fetchFailureCount: t.fetchFailureCount + 1,
                  fetchFailureReason: i,
                  fetchStatus: "idle",
                  status: "error",
                };
              }
              case "invalidate":
                return { ...t, isInvalidated: !0 };
              case "setState":
                return { ...t, ...e.state };
            }
          };
          (this.state = t(this.state)),
            i.notifyManager.batch(() => {
              this.observers.forEach((e) => {
                e.onQueryUpdate();
              }),
                this.#h.notify({ query: this, type: "updated", action: e });
            });
        }
      };
    function o(e, t) {
      return {
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchStatus: (0, r.canFetch)(t.networkMode) ? "fetching" : "paused",
        ...(void 0 === e && { error: null, status: "pending" }),
      };
    }
    e.s(["Query", () => n, "fetchState", () => o]);
  },
  992571,
  (e) => {
    var t = e.i(619273);
    function i(e) {
      return {
        onFetch: (i, n) => {
          let o = i.options,
            a = i.fetchOptions?.meta?.fetchMore?.direction,
            u = i.state.data?.pages || [],
            l = i.state.data?.pageParams || [],
            c = { pages: [], pageParams: [] },
            h = 0,
            d = async () => {
              let n = !1,
                d = (0, t.ensureQueryFn)(i.options, i.fetchOptions),
                f = async (e, r, s) => {
                  if (n) return Promise.reject();
                  if (null == r && e.pages.length) return Promise.resolve(e);
                  const o = {
                    client: i.client,
                    queryKey: i.queryKey,
                    pageParam: r,
                    direction: s ? "backward" : "forward",
                    meta: i.options.meta,
                  };
                  Object.defineProperty(o, "signal", {
                    enumerable: !0,
                    get: () => (
                      i.signal.aborted
                        ? (n = !0)
                        : i.signal.addEventListener("abort", () => {
                            n = !0;
                          }),
                      i.signal
                    ),
                  });
                  const a = await d(o),
                    { maxPages: u } = i.options,
                    l = s ? t.addToStart : t.addToEnd;
                  return { pages: l(e.pages, a, u), pageParams: l(e.pageParams, r, u) };
                };
              if (a && u.length) {
                const e = "backward" === a,
                  t = { pages: u, pageParams: l },
                  i = (e ? s : r)(o, t);
                c = await f(t, i, e);
              } else {
                const t = e ?? u.length;
                do {
                  const e = 0 === h ? (l[0] ?? o.initialPageParam) : r(o, c);
                  if (h > 0 && null == e) break;
                  (c = await f(c, e)), h++;
                } while (h < t);
              }
              return c;
            };
          i.options.persister
            ? (i.fetchFn = () =>
                i.options.persister?.(
                  d,
                  {
                    client: i.client,
                    queryKey: i.queryKey,
                    meta: i.options.meta,
                    signal: i.signal,
                  },
                  n,
                ))
            : (i.fetchFn = d);
        },
      };
    }
    function r(e, { pages: t, pageParams: i }) {
      const r = t.length - 1;
      return t.length > 0 ? e.getNextPageParam(t[r], t, i[r], i) : void 0;
    }
    function s(e, { pages: t, pageParams: i }) {
      return t.length > 0 ? e.getPreviousPageParam?.(t[0], t, i[0], i) : void 0;
    }
    function n(e, t) {
      return !!t && null != r(e, t);
    }
    function o(e, t) {
      return !!t && !!e.getPreviousPageParam && null != s(e, t);
    }
    e.s(["hasNextPage", () => n, "hasPreviousPage", () => o, "infiniteQueryBehavior", () => i]);
  },
  797239,
  (e) => {
    var t = e.i(582458);
    e.s(["AlertTriangleIcon", () => t.default]);
  },
  168118,
  879664,
  (e) => {
    const t = (0, e.i(475254).default)("Info", [
      ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
      ["path", { d: "M12 16v-4", key: "1dtifu" }],
      ["path", { d: "M12 8h.01", key: "e9boi3" }],
    ]);
    e.s(["default", () => t], 879664), e.s(["InfoIcon", () => t], 168118);
  },
  123287,
  (e) => {
    const t = (0, e.i(475254).default)("CircleCheck", [
      ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
      ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
    ]);
    e.s(["default", () => t]);
  },
  927946,
  (e) => {
    var t = e.i(123287);
    e.s(["CheckCircle2Icon", () => t.default]);
  },
  13714,
  (e) => {
    var t = e.i(45886),
      i = e.i(489419);
    function r(e) {
      return "string" != typeof e
        ? (0, t.jsx)(t.Fragment, { children: e })
        : e.split(/(`[^`]+`)/).map((e, r) =>
            e.startsWith("`") && e.endsWith("`")
              ? (0, t.jsxs)(
                  "span",
                  {
                    className: "font-mono text-black dark:text-white",
                    children: ["`", e.slice(1, -1), "`"],
                  },
                  r,
                )
              : (0, t.jsx)(i.Fragment, { children: e }, r),
          );
    }
    e.s(["parseErrorMessage", () => r]);
  },
  730309,
  (e) => {
    var t = e.i(523599),
      i = e.i(489419);
    const r = (0, i.createContext)({
        isDesktopSidebarCollapsed: void 0,
        setIsDesktopSidebarCollapsed: () => void 0,
        isMobileMenuExpanded: !1,
        setIsMobileMenuExpanded: () => void 0,
      }),
      s = "sidebarCollapsed";
    e.s([
      "SidebarContext",
      0,
      r,
      "useSidebar",
      0,
      () => {
        let e,
          r,
          n,
          o,
          a = (0, t.c)(6),
          [u, l] = (0, i.useState)(),
          [c, h] = (0, i.useState)(!1);
        a[0] === Symbol.for("react.memo_cache_sentinel")
          ? ((e = () => {
              l(void 0 != window.localStorage.getItem(s));
            }),
            (r = []),
            (a[0] = e),
            (a[1] = r))
          : ((e = a[0]), (r = a[1])),
          (0, i.useEffect)(e, r),
          a[2] === Symbol.for("react.memo_cache_sentinel")
            ? ((n = (e) => {
                e
                  ? window.localStorage.setItem(s, e.toString())
                  : window.localStorage.removeItem(s),
                  l(e);
              }),
              (a[2] = n))
            : (n = a[2]);
        const d = n;
        return (
          a[3] !== u || a[4] !== c
            ? ((o = {
                isDesktopSidebarCollapsed: u,
                setIsDesktopSidebarCollapsed: d,
                isMobileMenuExpanded: c,
                setIsMobileMenuExpanded: h,
              }),
              (a[3] = u),
              (a[4] = c),
              (a[5] = o))
            : (o = a[5]),
          o
        );
      },
    ]);
  },
  929081,
  (e, t, i) => {
    t.exports = e.r(587233);
  },
  720565,
  (e) => {
    var t = e.i(604570),
      i = e.i(489419),
      r = (0, i.createContext)({ client: t.default, bootstrap: void 0 });
    function s(e) {
      var s,
        n,
        o = e.children,
        a = e.client,
        u = e.apiKey,
        l = e.options,
        c = (0, i.useRef)(null),
        h = (0, i.useMemo)(
          () =>
            a
              ? (u &&
                  console.warn(
                    "[PostHog.js] You have provided both `client` and `apiKey` to `PostHogProvider`. `apiKey` will be ignored in favour of `client`.",
                  ),
                l &&
                  console.warn(
                    "[PostHog.js] You have provided both `client` and `options` to `PostHogProvider`. `options` will be ignored in favour of `client`.",
                  ),
                a)
              : (u ||
                  console.warn(
                    "[PostHog.js] No `apiKey` or `client` were provided to `PostHogProvider`. Using default global `window.posthog` instance. You must initialize it manually. This is not recommended behavior.",
                  ),
                t.default),
          [a, u, JSON.stringify(l)],
        );
      return (
        (0, i.useEffect)(() => {
          if (!a) {
            var e = c.current;
            e
              ? (u !== e.apiKey &&
                  console.warn(
                    "[PostHog.js] You have provided a different `apiKey` to `PostHogProvider` than the one that was already initialized. This is not supported by our provider and we'll keep using the previous key. If you need to toggle between API Keys you need to control the `client` yourself and pass it in as a prop rather than an `apiKey` prop.",
                  ),
                l &&
                  !(function e(t, i, r) {
                    if ((void 0 === r && (r = new WeakMap()), t === i)) return !0;
                    if ("object" != typeof t || null === t || "object" != typeof i || null === i)
                      return !1;
                    if (r.has(t) && r.get(t) === i) return !0;
                    r.set(t, i);
                    var s = Object.keys(t),
                      n = Object.keys(i);
                    if (s.length !== n.length) return !1;
                    for (var o = 0; o < s.length; o++) {
                      var a = s[o];
                      if (!n.includes(a) || !e(t[a], i[a], r)) return !1;
                    }
                    return !0;
                  })(l, e.options) &&
                  t.default.set_config(l))
              : (t.default.__loaded &&
                  console.warn(
                    "[PostHog.js] `posthog` was already loaded elsewhere. This may cause issues.",
                  ),
                t.default.init(u, l)),
              (c.current = { apiKey: u, options: null != l ? l : {} });
          }
        }, [a, u, JSON.stringify(l)]),
        i.default.createElement(
          r.Provider,
          {
            value: {
              client: h,
              bootstrap:
                null != (s = null == l ? void 0 : l.bootstrap)
                  ? s
                  : null == (n = null == a ? void 0 : a.config)
                    ? void 0
                    : n.bootstrap,
            },
          },
          o,
        )
      );
    }
    var n = (e) => "function" == typeof e,
      o = () => (0, i.useContext)(r).client,
      a = (e, t) =>
        (a =
          Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array &&
            ((e, t) => {
              e.__proto__ = t;
            })) ||
          ((e, t) => {
            for (var i in t) Object.hasOwn(t, i) && (e[i] = t[i]);
          }))(e, t);
    "function" == typeof SuppressedError && SuppressedError;
    var u = { componentStack: null, exceptionEvent: null, error: null };
    !((e) => {
      if ("function" != typeof e && null !== e)
        throw TypeError("Class extends value " + String(e) + " is not a constructor or null");
      function t() {
        this.constructor = s;
      }
      function s(t) {
        var i = e.call(this, t) || this;
        return (i.state = u), i;
      }
      a(s, e),
        (s.prototype = null === e ? Object.create(e) : ((t.prototype = e.prototype), new t())),
        (s.prototype.componentDidCatch = function (e, t) {
          var i,
            r = this.props.additionalProperties;
          n(r) ? (i = r(e)) : "object" == typeof r && (i = r);
          var s = this.context.client.captureException(e, i),
            o = t.componentStack;
          this.setState({ error: e, componentStack: o, exceptionEvent: s });
        }),
        (s.prototype.render = function () {
          var e = this.props,
            t = e.children,
            r = e.fallback,
            s = this.state;
          if (null == s.componentStack) return n(t) ? t() : t;
          var o = n(r)
            ? i.default.createElement(r, {
                error: s.error,
                componentStack: s.componentStack,
                exceptionEvent: s.exceptionEvent,
              })
            : r;
          return i.default.isValidElement(o)
            ? o
            : (console.warn(
                "[PostHog.js][PostHogErrorBoundary] Invalid fallback prop, provide a valid React element or a function that returns a valid React element.",
              ),
              i.default.createElement(i.default.Fragment, null));
        }),
        (s.contextType = r);
    })(i.default.Component),
      e.s(["PostHogProvider", () => s, "usePostHog", () => o]);
  },
  817695,
  (e) => {
    e.v((t) =>
      Promise.all(["static/chunks/4c597b1353f106b7.js"].map((t) => e.l(t))).then(() => t(665080)),
    );
  },
]);

//# debugId=b87cace6-6fc7-a5a8-95c4-3e3d3ca1040e
//# sourceMappingURL=a757b712bf522632.js.map
