
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function (exports) {
    'use strict';

    function getUserAgent() {
        if (typeof navigator === "object" && "userAgent" in navigator) {
            return navigator.userAgent;
        }
        if (typeof process === "object" && "version" in process) {
            return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
        }
        return "<environment undetectable>";
    }

    var distWeb$a = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getUserAgent: getUserAgent
    });

    var register_1 = register;

    function register(state, name, method, options) {
      if (typeof method !== "function") {
        throw new Error("method for before hook must be a function");
      }

      if (!options) {
        options = {};
      }

      if (Array.isArray(name)) {
        return name.reverse().reduce(function (callback, name) {
          return register.bind(null, state, name, callback, options);
        }, method)();
      }

      return Promise.resolve().then(function () {
        if (!state.registry[name]) {
          return method(options);
        }

        return state.registry[name].reduce(function (method, registered) {
          return registered.hook.bind(null, method, options);
        }, method)();
      });
    }

    var add = addHook;

    function addHook(state, kind, name, hook) {
      var orig = hook;
      if (!state.registry[name]) {
        state.registry[name] = [];
      }

      if (kind === "before") {
        hook = function (method, options) {
          return Promise.resolve()
            .then(orig.bind(null, options))
            .then(method.bind(null, options));
        };
      }

      if (kind === "after") {
        hook = function (method, options) {
          var result;
          return Promise.resolve()
            .then(method.bind(null, options))
            .then(function (result_) {
              result = result_;
              return orig(result, options);
            })
            .then(function () {
              return result;
            });
        };
      }

      if (kind === "error") {
        hook = function (method, options) {
          return Promise.resolve()
            .then(method.bind(null, options))
            .catch(function (error) {
              return orig(error, options);
            });
        };
      }

      state.registry[name].push({
        hook: hook,
        orig: orig,
      });
    }

    var remove = removeHook;

    function removeHook(state, name, method) {
      if (!state.registry[name]) {
        return;
      }

      var index = state.registry[name]
        .map(function (registered) {
          return registered.orig;
        })
        .indexOf(method);

      if (index === -1) {
        return;
      }

      state.registry[name].splice(index, 1);
    }

    // bind with array of arguments: https://stackoverflow.com/a/21792913
    var bind = Function.bind;
    var bindable = bind.bind(bind);

    function bindApi (hook, state, name) {
      var removeHookRef = bindable(remove, null).apply(null, name ? [state, name] : [state]);
      hook.api = { remove: removeHookRef };
      hook.remove = removeHookRef

      ;['before', 'error', 'after', 'wrap'].forEach(function (kind) {
        var args = name ? [state, kind, name] : [state, kind];
        hook[kind] = hook.api[kind] = bindable(add, null).apply(null, args);
      });
    }

    function HookSingular () {
      var singularHookName = 'h';
      var singularHookState = {
        registry: {}
      };
      var singularHook = register_1.bind(null, singularHookState, singularHookName);
      bindApi(singularHook, singularHookState, singularHookName);
      return singularHook
    }

    function HookCollection () {
      var state = {
        registry: {}
      };

      var hook = register_1.bind(null, state);
      bindApi(hook, state);

      return hook
    }

    var collectionHookDeprecationMessageDisplayed = false;
    function Hook () {
      if (!collectionHookDeprecationMessageDisplayed) {
        console.warn('[before-after-hook]: "Hook()" repurposing warning, use "Hook.Collection()". Read more: https://git.io/upgrade-before-after-hook-to-1.4');
        collectionHookDeprecationMessageDisplayed = true;
      }
      return HookCollection()
    }

    Hook.Singular = HookSingular.bind();
    Hook.Collection = HookCollection.bind();

    var beforeAfterHook = Hook;
    // expose constructors as a named property for TypeScript
    var Hook_1 = Hook;
    var Singular = Hook.Singular;
    var Collection = Hook.Collection;
    beforeAfterHook.Hook = Hook_1;
    beforeAfterHook.Singular = Singular;
    beforeAfterHook.Collection = Collection;

    /*!
     * is-plain-object <https://github.com/jonschlinkert/is-plain-object>
     *
     * Copyright (c) 2014-2017, Jon Schlinkert.
     * Released under the MIT License.
     */

    function isObject(o) {
      return Object.prototype.toString.call(o) === '[object Object]';
    }

    function isPlainObject(o) {
      var ctor,prot;

      if (isObject(o) === false) return false;

      // If has modified constructor
      ctor = o.constructor;
      if (ctor === undefined) return true;

      // If has modified prototype
      prot = ctor.prototype;
      if (isObject(prot) === false) return false;

      // If constructor does not have an Object-specific method
      if (prot.hasOwnProperty('isPrototypeOf') === false) {
        return false;
      }

      // Most likely a plain Object
      return true;
    }

    function lowercaseKeys(object) {
        if (!object) {
            return {};
        }
        return Object.keys(object).reduce((newObj, key) => {
            newObj[key.toLowerCase()] = object[key];
            return newObj;
        }, {});
    }

    function mergeDeep(defaults, options) {
        const result = Object.assign({}, defaults);
        Object.keys(options).forEach((key) => {
            if (isPlainObject(options[key])) {
                if (!(key in defaults))
                    Object.assign(result, { [key]: options[key] });
                else
                    result[key] = mergeDeep(defaults[key], options[key]);
            }
            else {
                Object.assign(result, { [key]: options[key] });
            }
        });
        return result;
    }

    function removeUndefinedProperties(obj) {
        for (const key in obj) {
            if (obj[key] === undefined) {
                delete obj[key];
            }
        }
        return obj;
    }

    function merge(defaults, route, options) {
        if (typeof route === "string") {
            let [method, url] = route.split(" ");
            options = Object.assign(url ? { method, url } : { url: method }, options);
        }
        else {
            options = Object.assign({}, route);
        }
        // lowercase header names before merging with defaults to avoid duplicates
        options.headers = lowercaseKeys(options.headers);
        // remove properties with undefined values before merging
        removeUndefinedProperties(options);
        removeUndefinedProperties(options.headers);
        const mergedOptions = mergeDeep(defaults || {}, options);
        // mediaType.previews arrays are merged, instead of overwritten
        if (defaults && defaults.mediaType.previews.length) {
            mergedOptions.mediaType.previews = defaults.mediaType.previews
                .filter((preview) => !mergedOptions.mediaType.previews.includes(preview))
                .concat(mergedOptions.mediaType.previews);
        }
        mergedOptions.mediaType.previews = mergedOptions.mediaType.previews.map((preview) => preview.replace(/-preview/, ""));
        return mergedOptions;
    }

    function addQueryParameters(url, parameters) {
        const separator = /\?/.test(url) ? "&" : "?";
        const names = Object.keys(parameters);
        if (names.length === 0) {
            return url;
        }
        return (url +
            separator +
            names
                .map((name) => {
                if (name === "q") {
                    return ("q=" + parameters.q.split("+").map(encodeURIComponent).join("+"));
                }
                return `${name}=${encodeURIComponent(parameters[name])}`;
            })
                .join("&"));
    }

    const urlVariableRegex = /\{[^}]+\}/g;
    function removeNonChars(variableName) {
        return variableName.replace(/^\W+|\W+$/g, "").split(/,/);
    }
    function extractUrlVariableNames(url) {
        const matches = url.match(urlVariableRegex);
        if (!matches) {
            return [];
        }
        return matches.map(removeNonChars).reduce((a, b) => a.concat(b), []);
    }

    function omit(object, keysToOmit) {
        return Object.keys(object)
            .filter((option) => !keysToOmit.includes(option))
            .reduce((obj, key) => {
            obj[key] = object[key];
            return obj;
        }, {});
    }

    // Based on https://github.com/bramstein/url-template, licensed under BSD
    // TODO: create separate package.
    //
    // Copyright (c) 2012-2014, Bram Stein
    // All rights reserved.
    // Redistribution and use in source and binary forms, with or without
    // modification, are permitted provided that the following conditions
    // are met:
    //  1. Redistributions of source code must retain the above copyright
    //     notice, this list of conditions and the following disclaimer.
    //  2. Redistributions in binary form must reproduce the above copyright
    //     notice, this list of conditions and the following disclaimer in the
    //     documentation and/or other materials provided with the distribution.
    //  3. The name of the author may not be used to endorse or promote products
    //     derived from this software without specific prior written permission.
    // THIS SOFTWARE IS PROVIDED BY THE AUTHOR "AS IS" AND ANY EXPRESS OR IMPLIED
    // WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
    // MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO
    // EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
    // INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
    // BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
    // DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
    // OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
    // NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
    // EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    /* istanbul ignore file */
    function encodeReserved(str) {
        return str
            .split(/(%[0-9A-Fa-f]{2})/g)
            .map(function (part) {
            if (!/%[0-9A-Fa-f]/.test(part)) {
                part = encodeURI(part).replace(/%5B/g, "[").replace(/%5D/g, "]");
            }
            return part;
        })
            .join("");
    }
    function encodeUnreserved(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
            return "%" + c.charCodeAt(0).toString(16).toUpperCase();
        });
    }
    function encodeValue(operator, value, key) {
        value =
            operator === "+" || operator === "#"
                ? encodeReserved(value)
                : encodeUnreserved(value);
        if (key) {
            return encodeUnreserved(key) + "=" + value;
        }
        else {
            return value;
        }
    }
    function isDefined(value) {
        return value !== undefined && value !== null;
    }
    function isKeyOperator(operator) {
        return operator === ";" || operator === "&" || operator === "?";
    }
    function getValues(context, operator, key, modifier) {
        var value = context[key], result = [];
        if (isDefined(value) && value !== "") {
            if (typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean") {
                value = value.toString();
                if (modifier && modifier !== "*") {
                    value = value.substring(0, parseInt(modifier, 10));
                }
                result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : ""));
            }
            else {
                if (modifier === "*") {
                    if (Array.isArray(value)) {
                        value.filter(isDefined).forEach(function (value) {
                            result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : ""));
                        });
                    }
                    else {
                        Object.keys(value).forEach(function (k) {
                            if (isDefined(value[k])) {
                                result.push(encodeValue(operator, value[k], k));
                            }
                        });
                    }
                }
                else {
                    const tmp = [];
                    if (Array.isArray(value)) {
                        value.filter(isDefined).forEach(function (value) {
                            tmp.push(encodeValue(operator, value));
                        });
                    }
                    else {
                        Object.keys(value).forEach(function (k) {
                            if (isDefined(value[k])) {
                                tmp.push(encodeUnreserved(k));
                                tmp.push(encodeValue(operator, value[k].toString()));
                            }
                        });
                    }
                    if (isKeyOperator(operator)) {
                        result.push(encodeUnreserved(key) + "=" + tmp.join(","));
                    }
                    else if (tmp.length !== 0) {
                        result.push(tmp.join(","));
                    }
                }
            }
        }
        else {
            if (operator === ";") {
                if (isDefined(value)) {
                    result.push(encodeUnreserved(key));
                }
            }
            else if (value === "" && (operator === "&" || operator === "?")) {
                result.push(encodeUnreserved(key) + "=");
            }
            else if (value === "") {
                result.push("");
            }
        }
        return result;
    }
    function parseUrl(template) {
        return {
            expand: expand.bind(null, template),
        };
    }
    function expand(template, context) {
        var operators = ["+", "#", ".", "/", ";", "?", "&"];
        return template.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function (_, expression, literal) {
            if (expression) {
                let operator = "";
                const values = [];
                if (operators.indexOf(expression.charAt(0)) !== -1) {
                    operator = expression.charAt(0);
                    expression = expression.substr(1);
                }
                expression.split(/,/g).forEach(function (variable) {
                    var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
                    values.push(getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
                });
                if (operator && operator !== "+") {
                    var separator = ",";
                    if (operator === "?") {
                        separator = "&";
                    }
                    else if (operator !== "#") {
                        separator = operator;
                    }
                    return (values.length !== 0 ? operator : "") + values.join(separator);
                }
                else {
                    return values.join(",");
                }
            }
            else {
                return encodeReserved(literal);
            }
        });
    }

    function parse(options) {
        // https://fetch.spec.whatwg.org/#methods
        let method = options.method.toUpperCase();
        // replace :varname with {varname} to make it RFC 6570 compatible
        let url = (options.url || "/").replace(/:([a-z]\w+)/g, "{$1}");
        let headers = Object.assign({}, options.headers);
        let body;
        let parameters = omit(options, [
            "method",
            "baseUrl",
            "url",
            "headers",
            "request",
            "mediaType",
        ]);
        // extract variable names from URL to calculate remaining variables later
        const urlVariableNames = extractUrlVariableNames(url);
        url = parseUrl(url).expand(parameters);
        if (!/^http/.test(url)) {
            url = options.baseUrl + url;
        }
        const omittedParameters = Object.keys(options)
            .filter((option) => urlVariableNames.includes(option))
            .concat("baseUrl");
        const remainingParameters = omit(parameters, omittedParameters);
        const isBinaryRequest = /application\/octet-stream/i.test(headers.accept);
        if (!isBinaryRequest) {
            if (options.mediaType.format) {
                // e.g. application/vnd.github.v3+json => application/vnd.github.v3.raw
                headers.accept = headers.accept
                    .split(/,/)
                    .map((preview) => preview.replace(/application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/, `application/vnd$1$2.${options.mediaType.format}`))
                    .join(",");
            }
            if (options.mediaType.previews.length) {
                const previewsFromAcceptHeader = headers.accept.match(/[\w-]+(?=-preview)/g) || [];
                headers.accept = previewsFromAcceptHeader
                    .concat(options.mediaType.previews)
                    .map((preview) => {
                    const format = options.mediaType.format
                        ? `.${options.mediaType.format}`
                        : "+json";
                    return `application/vnd.github.${preview}-preview${format}`;
                })
                    .join(",");
            }
        }
        // for GET/HEAD requests, set URL query parameters from remaining parameters
        // for PATCH/POST/PUT/DELETE requests, set request body from remaining parameters
        if (["GET", "HEAD"].includes(method)) {
            url = addQueryParameters(url, remainingParameters);
        }
        else {
            if ("data" in remainingParameters) {
                body = remainingParameters.data;
            }
            else {
                if (Object.keys(remainingParameters).length) {
                    body = remainingParameters;
                }
                else {
                    headers["content-length"] = 0;
                }
            }
        }
        // default content-type for JSON if body is set
        if (!headers["content-type"] && typeof body !== "undefined") {
            headers["content-type"] = "application/json; charset=utf-8";
        }
        // GitHub expects 'content-length: 0' header for PUT/PATCH requests without body.
        // fetch does not allow to set `content-length` header, but we can set body to an empty string
        if (["PATCH", "PUT"].includes(method) && typeof body === "undefined") {
            body = "";
        }
        // Only return body/request keys if present
        return Object.assign({ method, url, headers }, typeof body !== "undefined" ? { body } : null, options.request ? { request: options.request } : null);
    }

    function endpointWithDefaults(defaults, route, options) {
        return parse(merge(defaults, route, options));
    }

    function withDefaults$2(oldDefaults, newDefaults) {
        const DEFAULTS = merge(oldDefaults, newDefaults);
        const endpoint = endpointWithDefaults.bind(null, DEFAULTS);
        return Object.assign(endpoint, {
            DEFAULTS,
            defaults: withDefaults$2.bind(null, DEFAULTS),
            merge: merge.bind(null, DEFAULTS),
            parse,
        });
    }

    const VERSION$e = "6.0.12";

    const userAgent = `octokit-endpoint.js/${VERSION$e} ${getUserAgent()}`;
    // DEFAULTS has all properties set that EndpointOptions has, except url.
    // So we use RequestParameters and add method as additional required property.
    const DEFAULTS = {
        method: "GET",
        baseUrl: "https://api.github.com",
        headers: {
            accept: "application/vnd.github.v3+json",
            "user-agent": userAgent,
        },
        mediaType: {
            format: "",
            previews: [],
        },
    };

    const endpoint = withDefaults$2(null, DEFAULTS);

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var browser = createCommonjsModule(function (module, exports) {

    // ref: https://github.com/tc39/proposal-global
    var getGlobal = function () {
    	// the only reliable means to get the global object is
    	// `Function('return this')()`
    	// However, this causes CSP violations in Chrome apps.
    	if (typeof self !== 'undefined') { return self; }
    	if (typeof window !== 'undefined') { return window; }
    	if (typeof global !== 'undefined') { return global; }
    	throw new Error('unable to locate global object');
    };

    var global = getGlobal();

    module.exports = exports = global.fetch;

    // Needed for TypeScript and Webpack.
    if (global.fetch) {
    	exports.default = global.fetch.bind(global);
    }

    exports.Headers = global.Headers;
    exports.Request = global.Request;
    exports.Response = global.Response;
    });

    class Deprecation extends Error {
      constructor(message) {
        super(message); // Maintains proper stack trace (only available on V8)

        /* istanbul ignore next */

        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, this.constructor);
        }

        this.name = 'Deprecation';
      }

    }

    // Returns a wrapper function that returns a wrapped callback
    // The wrapper function should do some stuff, and return a
    // presumably different callback function.
    // This makes sure that own properties are retained, so that
    // decorations and such are not lost along the way.
    var wrappy_1 = wrappy;
    function wrappy (fn, cb) {
      if (fn && cb) return wrappy(fn)(cb)

      if (typeof fn !== 'function')
        throw new TypeError('need wrapper function')

      Object.keys(fn).forEach(function (k) {
        wrapper[k] = fn[k];
      });

      return wrapper

      function wrapper() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        var ret = fn.apply(this, args);
        var cb = args[args.length-1];
        if (typeof ret === 'function' && ret !== cb) {
          Object.keys(cb).forEach(function (k) {
            ret[k] = cb[k];
          });
        }
        return ret
      }
    }

    var once_1 = wrappy_1(once);
    var strict = wrappy_1(onceStrict);

    once.proto = once(function () {
      Object.defineProperty(Function.prototype, 'once', {
        value: function () {
          return once(this)
        },
        configurable: true
      });

      Object.defineProperty(Function.prototype, 'onceStrict', {
        value: function () {
          return onceStrict(this)
        },
        configurable: true
      });
    });

    function once (fn) {
      var f = function () {
        if (f.called) return f.value
        f.called = true;
        return f.value = fn.apply(this, arguments)
      };
      f.called = false;
      return f
    }

    function onceStrict (fn) {
      var f = function () {
        if (f.called)
          throw new Error(f.onceError)
        f.called = true;
        return f.value = fn.apply(this, arguments)
      };
      var name = fn.name || 'Function wrapped with `once`';
      f.onceError = name + " shouldn't be called more than once";
      f.called = false;
      return f
    }
    once_1.strict = strict;

    const logOnceCode = once_1((deprecation) => console.warn(deprecation));
    const logOnceHeaders = once_1((deprecation) => console.warn(deprecation));
    /**
     * Error with extra properties to help with debugging
     */
    class RequestError extends Error {
        constructor(message, statusCode, options) {
            super(message);
            // Maintains proper stack trace (only available on V8)
            /* istanbul ignore next */
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, this.constructor);
            }
            this.name = "HttpError";
            this.status = statusCode;
            let headers;
            if ("headers" in options && typeof options.headers !== "undefined") {
                headers = options.headers;
            }
            if ("response" in options) {
                this.response = options.response;
                headers = options.response.headers;
            }
            // redact request credentials without mutating original request options
            const requestCopy = Object.assign({}, options.request);
            if (options.request.headers.authorization) {
                requestCopy.headers = Object.assign({}, options.request.headers, {
                    authorization: options.request.headers.authorization.replace(/ .*$/, " [REDACTED]"),
                });
            }
            requestCopy.url = requestCopy.url
                // client_id & client_secret can be passed as URL query parameters to increase rate limit
                // see https://developer.github.com/v3/#increasing-the-unauthenticated-rate-limit-for-oauth-applications
                .replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]")
                // OAuth tokens can be passed as URL query parameters, although it is not recommended
                // see https://developer.github.com/v3/#oauth2-token-sent-in-a-header
                .replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
            this.request = requestCopy;
            // deprecations
            Object.defineProperty(this, "code", {
                get() {
                    logOnceCode(new Deprecation("[@octokit/request-error] `error.code` is deprecated, use `error.status`."));
                    return statusCode;
                },
            });
            Object.defineProperty(this, "headers", {
                get() {
                    logOnceHeaders(new Deprecation("[@octokit/request-error] `error.headers` is deprecated, use `error.response.headers`."));
                    return headers || {};
                },
            });
        }
    }

    var distWeb$9 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        RequestError: RequestError
    });

    const VERSION$d = "5.6.0";

    function getBufferResponse(response) {
        return response.arrayBuffer();
    }

    function fetchWrapper(requestOptions) {
        const log = requestOptions.request && requestOptions.request.log
            ? requestOptions.request.log
            : console;
        if (isPlainObject(requestOptions.body) ||
            Array.isArray(requestOptions.body)) {
            requestOptions.body = JSON.stringify(requestOptions.body);
        }
        let headers = {};
        let status;
        let url;
        const fetch = (requestOptions.request && requestOptions.request.fetch) || browser;
        return fetch(requestOptions.url, Object.assign({
            method: requestOptions.method,
            body: requestOptions.body,
            headers: requestOptions.headers,
            redirect: requestOptions.redirect,
        }, 
        // `requestOptions.request.agent` type is incompatible
        // see https://github.com/octokit/types.ts/pull/264
        requestOptions.request))
            .then(async (response) => {
            url = response.url;
            status = response.status;
            for (const keyAndValue of response.headers) {
                headers[keyAndValue[0]] = keyAndValue[1];
            }
            if ("deprecation" in headers) {
                const matches = headers.link && headers.link.match(/<([^>]+)>; rel="deprecation"/);
                const deprecationLink = matches && matches.pop();
                log.warn(`[@octokit/request] "${requestOptions.method} ${requestOptions.url}" is deprecated. It is scheduled to be removed on ${headers.sunset}${deprecationLink ? `. See ${deprecationLink}` : ""}`);
            }
            if (status === 204 || status === 205) {
                return;
            }
            // GitHub API returns 200 for HEAD requests
            if (requestOptions.method === "HEAD") {
                if (status < 400) {
                    return;
                }
                throw new RequestError(response.statusText, status, {
                    response: {
                        url,
                        status,
                        headers,
                        data: undefined,
                    },
                    request: requestOptions,
                });
            }
            if (status === 304) {
                throw new RequestError("Not modified", status, {
                    response: {
                        url,
                        status,
                        headers,
                        data: await getResponseData(response),
                    },
                    request: requestOptions,
                });
            }
            if (status >= 400) {
                const data = await getResponseData(response);
                const error = new RequestError(toErrorMessage(data), status, {
                    response: {
                        url,
                        status,
                        headers,
                        data,
                    },
                    request: requestOptions,
                });
                throw error;
            }
            return getResponseData(response);
        })
            .then((data) => {
            return {
                status,
                url,
                headers,
                data,
            };
        })
            .catch((error) => {
            if (error instanceof RequestError)
                throw error;
            throw new RequestError(error.message, 500, {
                request: requestOptions,
            });
        });
    }
    async function getResponseData(response) {
        const contentType = response.headers.get("content-type");
        if (/application\/json/.test(contentType)) {
            return response.json();
        }
        if (!contentType || /^text\/|charset=utf-8$/.test(contentType)) {
            return response.text();
        }
        return getBufferResponse(response);
    }
    function toErrorMessage(data) {
        if (typeof data === "string")
            return data;
        // istanbul ignore else - just in case
        if ("message" in data) {
            if (Array.isArray(data.errors)) {
                return `${data.message}: ${data.errors.map(JSON.stringify).join(", ")}`;
            }
            return data.message;
        }
        // istanbul ignore next - just in case
        return `Unknown error: ${JSON.stringify(data)}`;
    }

    function withDefaults$1(oldEndpoint, newDefaults) {
        const endpoint = oldEndpoint.defaults(newDefaults);
        const newApi = function (route, parameters) {
            const endpointOptions = endpoint.merge(route, parameters);
            if (!endpointOptions.request || !endpointOptions.request.hook) {
                return fetchWrapper(endpoint.parse(endpointOptions));
            }
            const request = (route, parameters) => {
                return fetchWrapper(endpoint.parse(endpoint.merge(route, parameters)));
            };
            Object.assign(request, {
                endpoint,
                defaults: withDefaults$1.bind(null, endpoint),
            });
            return endpointOptions.request.hook(request, endpointOptions);
        };
        return Object.assign(newApi, {
            endpoint,
            defaults: withDefaults$1.bind(null, endpoint),
        });
    }

    const request$1 = withDefaults$1(endpoint, {
        headers: {
            "user-agent": `octokit-request.js/${VERSION$d} ${getUserAgent()}`,
        },
    });

    var distWeb$8 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        request: request$1
    });

    const VERSION$c = "4.6.4";

    class GraphqlError extends Error {
        constructor(request, response) {
            const message = response.data.errors[0].message;
            super(message);
            Object.assign(this, response.data);
            Object.assign(this, { headers: response.headers });
            this.name = "GraphqlError";
            this.request = request;
            // Maintains proper stack trace (only available on V8)
            /* istanbul ignore next */
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, this.constructor);
            }
        }
    }

    const NON_VARIABLE_OPTIONS = [
        "method",
        "baseUrl",
        "url",
        "headers",
        "request",
        "query",
        "mediaType",
    ];
    const FORBIDDEN_VARIABLE_OPTIONS = ["query", "method", "url"];
    const GHES_V3_SUFFIX_REGEX = /\/api\/v3\/?$/;
    function graphql(request, query, options) {
        if (options) {
            if (typeof query === "string" && "query" in options) {
                return Promise.reject(new Error(`[@octokit/graphql] "query" cannot be used as variable name`));
            }
            for (const key in options) {
                if (!FORBIDDEN_VARIABLE_OPTIONS.includes(key))
                    continue;
                return Promise.reject(new Error(`[@octokit/graphql] "${key}" cannot be used as variable name`));
            }
        }
        const parsedOptions = typeof query === "string" ? Object.assign({ query }, options) : query;
        const requestOptions = Object.keys(parsedOptions).reduce((result, key) => {
            if (NON_VARIABLE_OPTIONS.includes(key)) {
                result[key] = parsedOptions[key];
                return result;
            }
            if (!result.variables) {
                result.variables = {};
            }
            result.variables[key] = parsedOptions[key];
            return result;
        }, {});
        // workaround for GitHub Enterprise baseUrl set with /api/v3 suffix
        // https://github.com/octokit/auth-app.js/issues/111#issuecomment-657610451
        const baseUrl = parsedOptions.baseUrl || request.endpoint.DEFAULTS.baseUrl;
        if (GHES_V3_SUFFIX_REGEX.test(baseUrl)) {
            requestOptions.url = baseUrl.replace(GHES_V3_SUFFIX_REGEX, "/api/graphql");
        }
        return request(requestOptions).then((response) => {
            if (response.data.errors) {
                const headers = {};
                for (const key of Object.keys(response.headers)) {
                    headers[key] = response.headers[key];
                }
                throw new GraphqlError(requestOptions, {
                    headers,
                    data: response.data,
                });
            }
            return response.data.data;
        });
    }

    function withDefaults(request$1$1, newDefaults) {
        const newRequest = request$1$1.defaults(newDefaults);
        const newApi = (query, options) => {
            return graphql(newRequest, query, options);
        };
        return Object.assign(newApi, {
            defaults: withDefaults.bind(null, newRequest),
            endpoint: request$1.endpoint,
        });
    }

    withDefaults(request$1, {
        headers: {
            "user-agent": `octokit-graphql.js/${VERSION$c} ${getUserAgent()}`,
        },
        method: "POST",
        url: "/graphql",
    });
    function withCustomRequest(customRequest) {
        return withDefaults(customRequest, {
            method: "POST",
            url: "/graphql",
        });
    }

    async function auth$5(token) {
        const tokenType = token.split(/\./).length === 3
            ? "app"
            : /^v\d+\./.test(token)
                ? "installation"
                : "oauth";
        return {
            type: "token",
            token: token,
            tokenType
        };
    }

    /**
     * Prefix token for usage in the Authorization header
     *
     * @param token OAuth token or JSON Web Token
     */
    function withAuthorizationPrefix(token) {
        if (token.split(/\./).length === 3) {
            return `bearer ${token}`;
        }
        return `token ${token}`;
    }

    async function hook$5(token, request, route, parameters) {
        const endpoint = request.endpoint.merge(route, parameters);
        endpoint.headers.authorization = withAuthorizationPrefix(token);
        return request(endpoint);
    }

    const createTokenAuth = function createTokenAuth(token) {
        if (!token) {
            throw new Error("[@octokit/auth-token] No token passed to createTokenAuth");
        }
        if (typeof token !== "string") {
            throw new Error("[@octokit/auth-token] Token passed to createTokenAuth is not a string");
        }
        token = token.replace(/^(token|bearer) +/i, "");
        return Object.assign(auth$5.bind(null, token), {
            hook: hook$5.bind(null, token)
        });
    };

    const VERSION$b = "3.5.1";

    class Octokit$1 {
        constructor(options = {}) {
            const hook = new Collection();
            const requestDefaults = {
                baseUrl: request$1.endpoint.DEFAULTS.baseUrl,
                headers: {},
                request: Object.assign({}, options.request, {
                    // @ts-ignore internal usage only, no need to type
                    hook: hook.bind(null, "request"),
                }),
                mediaType: {
                    previews: [],
                    format: "",
                },
            };
            // prepend default user agent with `options.userAgent` if set
            requestDefaults.headers["user-agent"] = [
                options.userAgent,
                `octokit-core.js/${VERSION$b} ${getUserAgent()}`,
            ]
                .filter(Boolean)
                .join(" ");
            if (options.baseUrl) {
                requestDefaults.baseUrl = options.baseUrl;
            }
            if (options.previews) {
                requestDefaults.mediaType.previews = options.previews;
            }
            if (options.timeZone) {
                requestDefaults.headers["time-zone"] = options.timeZone;
            }
            this.request = request$1.defaults(requestDefaults);
            this.graphql = withCustomRequest(this.request).defaults(requestDefaults);
            this.log = Object.assign({
                debug: () => { },
                info: () => { },
                warn: console.warn.bind(console),
                error: console.error.bind(console),
            }, options.log);
            this.hook = hook;
            // (1) If neither `options.authStrategy` nor `options.auth` are set, the `octokit` instance
            //     is unauthenticated. The `this.auth()` method is a no-op and no request hook is registered.
            // (2) If only `options.auth` is set, use the default token authentication strategy.
            // (3) If `options.authStrategy` is set then use it and pass in `options.auth`. Always pass own request as many strategies accept a custom request instance.
            // TODO: type `options.auth` based on `options.authStrategy`.
            if (!options.authStrategy) {
                if (!options.auth) {
                    // (1)
                    this.auth = async () => ({
                        type: "unauthenticated",
                    });
                }
                else {
                    // (2)
                    const auth = createTokenAuth(options.auth);
                    // @ts-ignore  ¯\_(ツ)_/¯
                    hook.wrap("request", auth.hook);
                    this.auth = auth;
                }
            }
            else {
                const { authStrategy, ...otherOptions } = options;
                const auth = authStrategy(Object.assign({
                    request: this.request,
                    log: this.log,
                    // we pass the current octokit instance as well as its constructor options
                    // to allow for authentication strategies that return a new octokit instance
                    // that shares the same internal state as the current one. The original
                    // requirement for this was the "event-octokit" authentication strategy
                    // of https://github.com/probot/octokit-auth-probot.
                    octokit: this,
                    octokitOptions: otherOptions,
                }, options.auth));
                // @ts-ignore  ¯\_(ツ)_/¯
                hook.wrap("request", auth.hook);
                this.auth = auth;
            }
            // apply plugins
            // https://stackoverflow.com/a/16345172
            const classConstructor = this.constructor;
            classConstructor.plugins.forEach((plugin) => {
                Object.assign(this, plugin(this, options));
            });
        }
        static defaults(defaults) {
            const OctokitWithDefaults = class extends this {
                constructor(...args) {
                    const options = args[0] || {};
                    if (typeof defaults === "function") {
                        super(defaults(options));
                        return;
                    }
                    super(Object.assign({}, defaults, options, options.userAgent && defaults.userAgent
                        ? {
                            userAgent: `${options.userAgent} ${defaults.userAgent}`,
                        }
                        : null));
                }
            };
            return OctokitWithDefaults;
        }
        /**
         * Attach a plugin (or many) to your Octokit instance.
         *
         * @example
         * const API = Octokit.plugin(plugin1, plugin2, plugin3, ...)
         */
        static plugin(...newPlugins) {
            var _a;
            const currentPlugins = this.plugins;
            const NewOctokit = (_a = class extends this {
                },
                _a.plugins = currentPlugins.concat(newPlugins.filter((plugin) => !currentPlugins.includes(plugin))),
                _a);
            return NewOctokit;
        }
    }
    Octokit$1.VERSION = VERSION$b;
    Octokit$1.plugins = [];

    var distWeb$7 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Octokit: Octokit$1
    });

    const VERSION$a = "2.14.0";

    /**
     * Some “list” response that can be paginated have a different response structure
     *
     * They have a `total_count` key in the response (search also has `incomplete_results`,
     * /installation/repositories also has `repository_selection`), as well as a key with
     * the list of the items which name varies from endpoint to endpoint.
     *
     * Octokit normalizes these responses so that paginated results are always returned following
     * the same structure. One challenge is that if the list response has only one page, no Link
     * header is provided, so this header alone is not sufficient to check wether a response is
     * paginated or not.
     *
     * We check if a "total_count" key is present in the response data, but also make sure that
     * a "url" property is not, as the "Get the combined status for a specific ref" endpoint would
     * otherwise match: https://developer.github.com/v3/repos/statuses/#get-the-combined-status-for-a-specific-ref
     */
    function normalizePaginatedListResponse(response) {
        // endpoints can respond with 204 if repository is empty
        if (!response.data) {
            return {
                ...response,
                data: [],
            };
        }
        const responseNeedsNormalization = "total_count" in response.data && !("url" in response.data);
        if (!responseNeedsNormalization)
            return response;
        // keep the additional properties intact as there is currently no other way
        // to retrieve the same information.
        const incompleteResults = response.data.incomplete_results;
        const repositorySelection = response.data.repository_selection;
        const totalCount = response.data.total_count;
        delete response.data.incomplete_results;
        delete response.data.repository_selection;
        delete response.data.total_count;
        const namespaceKey = Object.keys(response.data)[0];
        const data = response.data[namespaceKey];
        response.data = data;
        if (typeof incompleteResults !== "undefined") {
            response.data.incomplete_results = incompleteResults;
        }
        if (typeof repositorySelection !== "undefined") {
            response.data.repository_selection = repositorySelection;
        }
        response.data.total_count = totalCount;
        return response;
    }

    function iterator$1(octokit, route, parameters) {
        const options = typeof route === "function"
            ? route.endpoint(parameters)
            : octokit.request.endpoint(route, parameters);
        const requestMethod = typeof route === "function" ? route : octokit.request;
        const method = options.method;
        const headers = options.headers;
        let url = options.url;
        return {
            [Symbol.asyncIterator]: () => ({
                async next() {
                    if (!url)
                        return { done: true };
                    try {
                        const response = await requestMethod({ method, url, headers });
                        const normalizedResponse = normalizePaginatedListResponse(response);
                        // `response.headers.link` format:
                        // '<https://api.github.com/users/aseemk/followers?page=2>; rel="next", <https://api.github.com/users/aseemk/followers?page=2>; rel="last"'
                        // sets `url` to undefined if "next" URL is not present or `link` header is not set
                        url = ((normalizedResponse.headers.link || "").match(/<([^>]+)>;\s*rel="next"/) || [])[1];
                        return { value: normalizedResponse };
                    }
                    catch (error) {
                        if (error.status !== 409)
                            throw error;
                        url = "";
                        return {
                            value: {
                                status: 200,
                                headers: {},
                                data: [],
                            },
                        };
                    }
                },
            }),
        };
    }

    function paginate(octokit, route, parameters, mapFn) {
        if (typeof parameters === "function") {
            mapFn = parameters;
            parameters = undefined;
        }
        return gather(octokit, [], iterator$1(octokit, route, parameters)[Symbol.asyncIterator](), mapFn);
    }
    function gather(octokit, results, iterator, mapFn) {
        return iterator.next().then((result) => {
            if (result.done) {
                return results;
            }
            let earlyExit = false;
            function done() {
                earlyExit = true;
            }
            results = results.concat(mapFn ? mapFn(result.value, done) : result.value.data);
            if (earlyExit) {
                return results;
            }
            return gather(octokit, results, iterator, mapFn);
        });
    }

    const composePaginateRest = Object.assign(paginate, {
        iterator: iterator$1,
    });

    const paginatingEndpoints = [
        "GET /app/hook/deliveries",
        "GET /app/installations",
        "GET /applications/grants",
        "GET /authorizations",
        "GET /enterprises/{enterprise}/actions/permissions/organizations",
        "GET /enterprises/{enterprise}/actions/runner-groups",
        "GET /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations",
        "GET /enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/runners",
        "GET /enterprises/{enterprise}/actions/runners",
        "GET /enterprises/{enterprise}/actions/runners/downloads",
        "GET /events",
        "GET /gists",
        "GET /gists/public",
        "GET /gists/starred",
        "GET /gists/{gist_id}/comments",
        "GET /gists/{gist_id}/commits",
        "GET /gists/{gist_id}/forks",
        "GET /installation/repositories",
        "GET /issues",
        "GET /marketplace_listing/plans",
        "GET /marketplace_listing/plans/{plan_id}/accounts",
        "GET /marketplace_listing/stubbed/plans",
        "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts",
        "GET /networks/{owner}/{repo}/events",
        "GET /notifications",
        "GET /organizations",
        "GET /orgs/{org}/actions/permissions/repositories",
        "GET /orgs/{org}/actions/runner-groups",
        "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories",
        "GET /orgs/{org}/actions/runner-groups/{runner_group_id}/runners",
        "GET /orgs/{org}/actions/runners",
        "GET /orgs/{org}/actions/runners/downloads",
        "GET /orgs/{org}/actions/secrets",
        "GET /orgs/{org}/actions/secrets/{secret_name}/repositories",
        "GET /orgs/{org}/blocks",
        "GET /orgs/{org}/credential-authorizations",
        "GET /orgs/{org}/events",
        "GET /orgs/{org}/failed_invitations",
        "GET /orgs/{org}/hooks",
        "GET /orgs/{org}/hooks/{hook_id}/deliveries",
        "GET /orgs/{org}/installations",
        "GET /orgs/{org}/invitations",
        "GET /orgs/{org}/invitations/{invitation_id}/teams",
        "GET /orgs/{org}/issues",
        "GET /orgs/{org}/members",
        "GET /orgs/{org}/migrations",
        "GET /orgs/{org}/migrations/{migration_id}/repositories",
        "GET /orgs/{org}/outside_collaborators",
        "GET /orgs/{org}/projects",
        "GET /orgs/{org}/public_members",
        "GET /orgs/{org}/repos",
        "GET /orgs/{org}/team-sync/groups",
        "GET /orgs/{org}/teams",
        "GET /orgs/{org}/teams/{team_slug}/discussions",
        "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
        "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
        "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
        "GET /orgs/{org}/teams/{team_slug}/invitations",
        "GET /orgs/{org}/teams/{team_slug}/members",
        "GET /orgs/{org}/teams/{team_slug}/projects",
        "GET /orgs/{org}/teams/{team_slug}/repos",
        "GET /orgs/{org}/teams/{team_slug}/team-sync/group-mappings",
        "GET /orgs/{org}/teams/{team_slug}/teams",
        "GET /projects/columns/{column_id}/cards",
        "GET /projects/{project_id}/collaborators",
        "GET /projects/{project_id}/columns",
        "GET /repos/{owner}/{repo}/actions/artifacts",
        "GET /repos/{owner}/{repo}/actions/runners",
        "GET /repos/{owner}/{repo}/actions/runners/downloads",
        "GET /repos/{owner}/{repo}/actions/runs",
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
        "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
        "GET /repos/{owner}/{repo}/actions/secrets",
        "GET /repos/{owner}/{repo}/actions/workflows",
        "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
        "GET /repos/{owner}/{repo}/assignees",
        "GET /repos/{owner}/{repo}/branches",
        "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations",
        "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs",
        "GET /repos/{owner}/{repo}/code-scanning/alerts",
        "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
        "GET /repos/{owner}/{repo}/code-scanning/analyses",
        "GET /repos/{owner}/{repo}/collaborators",
        "GET /repos/{owner}/{repo}/comments",
        "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions",
        "GET /repos/{owner}/{repo}/commits",
        "GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head",
        "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments",
        "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls",
        "GET /repos/{owner}/{repo}/commits/{ref}/check-runs",
        "GET /repos/{owner}/{repo}/commits/{ref}/check-suites",
        "GET /repos/{owner}/{repo}/commits/{ref}/statuses",
        "GET /repos/{owner}/{repo}/contributors",
        "GET /repos/{owner}/{repo}/deployments",
        "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
        "GET /repos/{owner}/{repo}/events",
        "GET /repos/{owner}/{repo}/forks",
        "GET /repos/{owner}/{repo}/git/matching-refs/{ref}",
        "GET /repos/{owner}/{repo}/hooks",
        "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries",
        "GET /repos/{owner}/{repo}/invitations",
        "GET /repos/{owner}/{repo}/issues",
        "GET /repos/{owner}/{repo}/issues/comments",
        "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
        "GET /repos/{owner}/{repo}/issues/events",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/events",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/labels",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/reactions",
        "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
        "GET /repos/{owner}/{repo}/keys",
        "GET /repos/{owner}/{repo}/labels",
        "GET /repos/{owner}/{repo}/milestones",
        "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels",
        "GET /repos/{owner}/{repo}/notifications",
        "GET /repos/{owner}/{repo}/pages/builds",
        "GET /repos/{owner}/{repo}/projects",
        "GET /repos/{owner}/{repo}/pulls",
        "GET /repos/{owner}/{repo}/pulls/comments",
        "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments",
        "GET /repos/{owner}/{repo}/releases",
        "GET /repos/{owner}/{repo}/releases/{release_id}/assets",
        "GET /repos/{owner}/{repo}/secret-scanning/alerts",
        "GET /repos/{owner}/{repo}/stargazers",
        "GET /repos/{owner}/{repo}/subscribers",
        "GET /repos/{owner}/{repo}/tags",
        "GET /repos/{owner}/{repo}/teams",
        "GET /repositories",
        "GET /repositories/{repository_id}/environments/{environment_name}/secrets",
        "GET /scim/v2/enterprises/{enterprise}/Groups",
        "GET /scim/v2/enterprises/{enterprise}/Users",
        "GET /scim/v2/organizations/{org}/Users",
        "GET /search/code",
        "GET /search/commits",
        "GET /search/issues",
        "GET /search/labels",
        "GET /search/repositories",
        "GET /search/topics",
        "GET /search/users",
        "GET /teams/{team_id}/discussions",
        "GET /teams/{team_id}/discussions/{discussion_number}/comments",
        "GET /teams/{team_id}/discussions/{discussion_number}/comments/{comment_number}/reactions",
        "GET /teams/{team_id}/discussions/{discussion_number}/reactions",
        "GET /teams/{team_id}/invitations",
        "GET /teams/{team_id}/members",
        "GET /teams/{team_id}/projects",
        "GET /teams/{team_id}/repos",
        "GET /teams/{team_id}/team-sync/group-mappings",
        "GET /teams/{team_id}/teams",
        "GET /user/blocks",
        "GET /user/emails",
        "GET /user/followers",
        "GET /user/following",
        "GET /user/gpg_keys",
        "GET /user/installations",
        "GET /user/installations/{installation_id}/repositories",
        "GET /user/issues",
        "GET /user/keys",
        "GET /user/marketplace_purchases",
        "GET /user/marketplace_purchases/stubbed",
        "GET /user/memberships/orgs",
        "GET /user/migrations",
        "GET /user/migrations/{migration_id}/repositories",
        "GET /user/orgs",
        "GET /user/public_emails",
        "GET /user/repos",
        "GET /user/repository_invitations",
        "GET /user/starred",
        "GET /user/subscriptions",
        "GET /user/teams",
        "GET /users",
        "GET /users/{username}/events",
        "GET /users/{username}/events/orgs/{org}",
        "GET /users/{username}/events/public",
        "GET /users/{username}/followers",
        "GET /users/{username}/following",
        "GET /users/{username}/gists",
        "GET /users/{username}/gpg_keys",
        "GET /users/{username}/keys",
        "GET /users/{username}/orgs",
        "GET /users/{username}/projects",
        "GET /users/{username}/received_events",
        "GET /users/{username}/received_events/public",
        "GET /users/{username}/repos",
        "GET /users/{username}/starred",
        "GET /users/{username}/subscriptions",
    ];

    function isPaginatingEndpoint(arg) {
        if (typeof arg === "string") {
            return paginatingEndpoints.includes(arg);
        }
        else {
            return false;
        }
    }

    /**
     * @param octokit Octokit instance
     * @param options Options passed to Octokit constructor
     */
    function paginateRest(octokit) {
        return {
            paginate: Object.assign(paginate.bind(null, octokit), {
                iterator: iterator$1.bind(null, octokit),
            }),
        };
    }
    paginateRest.VERSION = VERSION$a;

    var distWeb$6 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        composePaginateRest: composePaginateRest,
        isPaginatingEndpoint: isPaginatingEndpoint,
        paginateRest: paginateRest,
        paginatingEndpoints: paginatingEndpoints
    });

    const Endpoints = {
        actions: {
            addSelectedRepoToOrgSecret: [
                "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}",
            ],
            approveWorkflowRun: [
                "POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve",
            ],
            cancelWorkflowRun: [
                "POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel",
            ],
            createOrUpdateEnvironmentSecret: [
                "PUT /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
            ],
            createOrUpdateOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}"],
            createOrUpdateRepoSecret: [
                "PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}",
            ],
            createRegistrationTokenForOrg: [
                "POST /orgs/{org}/actions/runners/registration-token",
            ],
            createRegistrationTokenForRepo: [
                "POST /repos/{owner}/{repo}/actions/runners/registration-token",
            ],
            createRemoveTokenForOrg: ["POST /orgs/{org}/actions/runners/remove-token"],
            createRemoveTokenForRepo: [
                "POST /repos/{owner}/{repo}/actions/runners/remove-token",
            ],
            createWorkflowDispatch: [
                "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
            ],
            deleteArtifact: [
                "DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}",
            ],
            deleteEnvironmentSecret: [
                "DELETE /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
            ],
            deleteOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}"],
            deleteRepoSecret: [
                "DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}",
            ],
            deleteSelfHostedRunnerFromOrg: [
                "DELETE /orgs/{org}/actions/runners/{runner_id}",
            ],
            deleteSelfHostedRunnerFromRepo: [
                "DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}",
            ],
            deleteWorkflowRun: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}"],
            deleteWorkflowRunLogs: [
                "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs",
            ],
            disableSelectedRepositoryGithubActionsOrganization: [
                "DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}",
            ],
            disableWorkflow: [
                "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable",
            ],
            downloadArtifact: [
                "GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}",
            ],
            downloadJobLogsForWorkflowRun: [
                "GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs",
            ],
            downloadWorkflowRunLogs: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs",
            ],
            enableSelectedRepositoryGithubActionsOrganization: [
                "PUT /orgs/{org}/actions/permissions/repositories/{repository_id}",
            ],
            enableWorkflow: [
                "PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable",
            ],
            getAllowedActionsOrganization: [
                "GET /orgs/{org}/actions/permissions/selected-actions",
            ],
            getAllowedActionsRepository: [
                "GET /repos/{owner}/{repo}/actions/permissions/selected-actions",
            ],
            getArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
            getEnvironmentPublicKey: [
                "GET /repositories/{repository_id}/environments/{environment_name}/secrets/public-key",
            ],
            getEnvironmentSecret: [
                "GET /repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
            ],
            getGithubActionsPermissionsOrganization: [
                "GET /orgs/{org}/actions/permissions",
            ],
            getGithubActionsPermissionsRepository: [
                "GET /repos/{owner}/{repo}/actions/permissions",
            ],
            getJobForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"],
            getOrgPublicKey: ["GET /orgs/{org}/actions/secrets/public-key"],
            getOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}"],
            getPendingDeploymentsForRun: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
            ],
            getRepoPermissions: [
                "GET /repos/{owner}/{repo}/actions/permissions",
                {},
                { renamed: ["actions", "getGithubActionsPermissionsRepository"] },
            ],
            getRepoPublicKey: ["GET /repos/{owner}/{repo}/actions/secrets/public-key"],
            getRepoSecret: ["GET /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
            getReviewsForRun: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals",
            ],
            getSelfHostedRunnerForOrg: ["GET /orgs/{org}/actions/runners/{runner_id}"],
            getSelfHostedRunnerForRepo: [
                "GET /repos/{owner}/{repo}/actions/runners/{runner_id}",
            ],
            getWorkflow: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}"],
            getWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}"],
            getWorkflowRunUsage: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing",
            ],
            getWorkflowUsage: [
                "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing",
            ],
            listArtifactsForRepo: ["GET /repos/{owner}/{repo}/actions/artifacts"],
            listEnvironmentSecrets: [
                "GET /repositories/{repository_id}/environments/{environment_name}/secrets",
            ],
            listJobsForWorkflowRun: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
            ],
            listOrgSecrets: ["GET /orgs/{org}/actions/secrets"],
            listRepoSecrets: ["GET /repos/{owner}/{repo}/actions/secrets"],
            listRepoWorkflows: ["GET /repos/{owner}/{repo}/actions/workflows"],
            listRunnerApplicationsForOrg: ["GET /orgs/{org}/actions/runners/downloads"],
            listRunnerApplicationsForRepo: [
                "GET /repos/{owner}/{repo}/actions/runners/downloads",
            ],
            listSelectedReposForOrgSecret: [
                "GET /orgs/{org}/actions/secrets/{secret_name}/repositories",
            ],
            listSelectedRepositoriesEnabledGithubActionsOrganization: [
                "GET /orgs/{org}/actions/permissions/repositories",
            ],
            listSelfHostedRunnersForOrg: ["GET /orgs/{org}/actions/runners"],
            listSelfHostedRunnersForRepo: ["GET /repos/{owner}/{repo}/actions/runners"],
            listWorkflowRunArtifacts: [
                "GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
            ],
            listWorkflowRuns: [
                "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
            ],
            listWorkflowRunsForRepo: ["GET /repos/{owner}/{repo}/actions/runs"],
            reRunWorkflow: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"],
            removeSelectedRepoFromOrgSecret: [
                "DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}",
            ],
            reviewPendingDeploymentsForRun: [
                "POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
            ],
            setAllowedActionsOrganization: [
                "PUT /orgs/{org}/actions/permissions/selected-actions",
            ],
            setAllowedActionsRepository: [
                "PUT /repos/{owner}/{repo}/actions/permissions/selected-actions",
            ],
            setGithubActionsPermissionsOrganization: [
                "PUT /orgs/{org}/actions/permissions",
            ],
            setGithubActionsPermissionsRepository: [
                "PUT /repos/{owner}/{repo}/actions/permissions",
            ],
            setSelectedReposForOrgSecret: [
                "PUT /orgs/{org}/actions/secrets/{secret_name}/repositories",
            ],
            setSelectedRepositoriesEnabledGithubActionsOrganization: [
                "PUT /orgs/{org}/actions/permissions/repositories",
            ],
        },
        activity: {
            checkRepoIsStarredByAuthenticatedUser: ["GET /user/starred/{owner}/{repo}"],
            deleteRepoSubscription: ["DELETE /repos/{owner}/{repo}/subscription"],
            deleteThreadSubscription: [
                "DELETE /notifications/threads/{thread_id}/subscription",
            ],
            getFeeds: ["GET /feeds"],
            getRepoSubscription: ["GET /repos/{owner}/{repo}/subscription"],
            getThread: ["GET /notifications/threads/{thread_id}"],
            getThreadSubscriptionForAuthenticatedUser: [
                "GET /notifications/threads/{thread_id}/subscription",
            ],
            listEventsForAuthenticatedUser: ["GET /users/{username}/events"],
            listNotificationsForAuthenticatedUser: ["GET /notifications"],
            listOrgEventsForAuthenticatedUser: [
                "GET /users/{username}/events/orgs/{org}",
            ],
            listPublicEvents: ["GET /events"],
            listPublicEventsForRepoNetwork: ["GET /networks/{owner}/{repo}/events"],
            listPublicEventsForUser: ["GET /users/{username}/events/public"],
            listPublicOrgEvents: ["GET /orgs/{org}/events"],
            listReceivedEventsForUser: ["GET /users/{username}/received_events"],
            listReceivedPublicEventsForUser: [
                "GET /users/{username}/received_events/public",
            ],
            listRepoEvents: ["GET /repos/{owner}/{repo}/events"],
            listRepoNotificationsForAuthenticatedUser: [
                "GET /repos/{owner}/{repo}/notifications",
            ],
            listReposStarredByAuthenticatedUser: ["GET /user/starred"],
            listReposStarredByUser: ["GET /users/{username}/starred"],
            listReposWatchedByUser: ["GET /users/{username}/subscriptions"],
            listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"],
            listWatchedReposForAuthenticatedUser: ["GET /user/subscriptions"],
            listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"],
            markNotificationsAsRead: ["PUT /notifications"],
            markRepoNotificationsAsRead: ["PUT /repos/{owner}/{repo}/notifications"],
            markThreadAsRead: ["PATCH /notifications/threads/{thread_id}"],
            setRepoSubscription: ["PUT /repos/{owner}/{repo}/subscription"],
            setThreadSubscription: [
                "PUT /notifications/threads/{thread_id}/subscription",
            ],
            starRepoForAuthenticatedUser: ["PUT /user/starred/{owner}/{repo}"],
            unstarRepoForAuthenticatedUser: ["DELETE /user/starred/{owner}/{repo}"],
        },
        apps: {
            addRepoToInstallation: [
                "PUT /user/installations/{installation_id}/repositories/{repository_id}",
            ],
            checkToken: ["POST /applications/{client_id}/token"],
            createContentAttachment: [
                "POST /content_references/{content_reference_id}/attachments",
                { mediaType: { previews: ["corsair"] } },
            ],
            createContentAttachmentForRepo: [
                "POST /repos/{owner}/{repo}/content_references/{content_reference_id}/attachments",
                { mediaType: { previews: ["corsair"] } },
            ],
            createFromManifest: ["POST /app-manifests/{code}/conversions"],
            createInstallationAccessToken: [
                "POST /app/installations/{installation_id}/access_tokens",
            ],
            deleteAuthorization: ["DELETE /applications/{client_id}/grant"],
            deleteInstallation: ["DELETE /app/installations/{installation_id}"],
            deleteToken: ["DELETE /applications/{client_id}/token"],
            getAuthenticated: ["GET /app"],
            getBySlug: ["GET /apps/{app_slug}"],
            getInstallation: ["GET /app/installations/{installation_id}"],
            getOrgInstallation: ["GET /orgs/{org}/installation"],
            getRepoInstallation: ["GET /repos/{owner}/{repo}/installation"],
            getSubscriptionPlanForAccount: [
                "GET /marketplace_listing/accounts/{account_id}",
            ],
            getSubscriptionPlanForAccountStubbed: [
                "GET /marketplace_listing/stubbed/accounts/{account_id}",
            ],
            getUserInstallation: ["GET /users/{username}/installation"],
            getWebhookConfigForApp: ["GET /app/hook/config"],
            getWebhookDelivery: ["GET /app/hook/deliveries/{delivery_id}"],
            listAccountsForPlan: ["GET /marketplace_listing/plans/{plan_id}/accounts"],
            listAccountsForPlanStubbed: [
                "GET /marketplace_listing/stubbed/plans/{plan_id}/accounts",
            ],
            listInstallationReposForAuthenticatedUser: [
                "GET /user/installations/{installation_id}/repositories",
            ],
            listInstallations: ["GET /app/installations"],
            listInstallationsForAuthenticatedUser: ["GET /user/installations"],
            listPlans: ["GET /marketplace_listing/plans"],
            listPlansStubbed: ["GET /marketplace_listing/stubbed/plans"],
            listReposAccessibleToInstallation: ["GET /installation/repositories"],
            listSubscriptionsForAuthenticatedUser: ["GET /user/marketplace_purchases"],
            listSubscriptionsForAuthenticatedUserStubbed: [
                "GET /user/marketplace_purchases/stubbed",
            ],
            listWebhookDeliveries: ["GET /app/hook/deliveries"],
            redeliverWebhookDelivery: [
                "POST /app/hook/deliveries/{delivery_id}/attempts",
            ],
            removeRepoFromInstallation: [
                "DELETE /user/installations/{installation_id}/repositories/{repository_id}",
            ],
            resetToken: ["PATCH /applications/{client_id}/token"],
            revokeInstallationAccessToken: ["DELETE /installation/token"],
            scopeToken: ["POST /applications/{client_id}/token/scoped"],
            suspendInstallation: ["PUT /app/installations/{installation_id}/suspended"],
            unsuspendInstallation: [
                "DELETE /app/installations/{installation_id}/suspended",
            ],
            updateWebhookConfigForApp: ["PATCH /app/hook/config"],
        },
        billing: {
            getGithubActionsBillingOrg: ["GET /orgs/{org}/settings/billing/actions"],
            getGithubActionsBillingUser: [
                "GET /users/{username}/settings/billing/actions",
            ],
            getGithubPackagesBillingOrg: ["GET /orgs/{org}/settings/billing/packages"],
            getGithubPackagesBillingUser: [
                "GET /users/{username}/settings/billing/packages",
            ],
            getSharedStorageBillingOrg: [
                "GET /orgs/{org}/settings/billing/shared-storage",
            ],
            getSharedStorageBillingUser: [
                "GET /users/{username}/settings/billing/shared-storage",
            ],
        },
        checks: {
            create: ["POST /repos/{owner}/{repo}/check-runs"],
            createSuite: ["POST /repos/{owner}/{repo}/check-suites"],
            get: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}"],
            getSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}"],
            listAnnotations: [
                "GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations",
            ],
            listForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"],
            listForSuite: [
                "GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs",
            ],
            listSuitesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-suites"],
            rerequestSuite: [
                "POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest",
            ],
            setSuitesPreferences: [
                "PATCH /repos/{owner}/{repo}/check-suites/preferences",
            ],
            update: ["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"],
        },
        codeScanning: {
            deleteAnalysis: [
                "DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}",
            ],
            getAlert: [
                "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
                {},
                { renamedParameters: { alert_id: "alert_number" } },
            ],
            getAnalysis: [
                "GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}",
            ],
            getSarif: ["GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}"],
            listAlertInstances: [
                "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
            ],
            listAlertsForRepo: ["GET /repos/{owner}/{repo}/code-scanning/alerts"],
            listAlertsInstances: [
                "GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
                {},
                { renamed: ["codeScanning", "listAlertInstances"] },
            ],
            listRecentAnalyses: ["GET /repos/{owner}/{repo}/code-scanning/analyses"],
            updateAlert: [
                "PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
            ],
            uploadSarif: ["POST /repos/{owner}/{repo}/code-scanning/sarifs"],
        },
        codesOfConduct: {
            getAllCodesOfConduct: [
                "GET /codes_of_conduct",
                { mediaType: { previews: ["scarlet-witch"] } },
            ],
            getConductCode: [
                "GET /codes_of_conduct/{key}",
                { mediaType: { previews: ["scarlet-witch"] } },
            ],
            getForRepo: [
                "GET /repos/{owner}/{repo}/community/code_of_conduct",
                { mediaType: { previews: ["scarlet-witch"] } },
            ],
        },
        emojis: { get: ["GET /emojis"] },
        enterpriseAdmin: {
            disableSelectedOrganizationGithubActionsEnterprise: [
                "DELETE /enterprises/{enterprise}/actions/permissions/organizations/{org_id}",
            ],
            enableSelectedOrganizationGithubActionsEnterprise: [
                "PUT /enterprises/{enterprise}/actions/permissions/organizations/{org_id}",
            ],
            getAllowedActionsEnterprise: [
                "GET /enterprises/{enterprise}/actions/permissions/selected-actions",
            ],
            getGithubActionsPermissionsEnterprise: [
                "GET /enterprises/{enterprise}/actions/permissions",
            ],
            listSelectedOrganizationsEnabledGithubActionsEnterprise: [
                "GET /enterprises/{enterprise}/actions/permissions/organizations",
            ],
            setAllowedActionsEnterprise: [
                "PUT /enterprises/{enterprise}/actions/permissions/selected-actions",
            ],
            setGithubActionsPermissionsEnterprise: [
                "PUT /enterprises/{enterprise}/actions/permissions",
            ],
            setSelectedOrganizationsEnabledGithubActionsEnterprise: [
                "PUT /enterprises/{enterprise}/actions/permissions/organizations",
            ],
        },
        gists: {
            checkIsStarred: ["GET /gists/{gist_id}/star"],
            create: ["POST /gists"],
            createComment: ["POST /gists/{gist_id}/comments"],
            delete: ["DELETE /gists/{gist_id}"],
            deleteComment: ["DELETE /gists/{gist_id}/comments/{comment_id}"],
            fork: ["POST /gists/{gist_id}/forks"],
            get: ["GET /gists/{gist_id}"],
            getComment: ["GET /gists/{gist_id}/comments/{comment_id}"],
            getRevision: ["GET /gists/{gist_id}/{sha}"],
            list: ["GET /gists"],
            listComments: ["GET /gists/{gist_id}/comments"],
            listCommits: ["GET /gists/{gist_id}/commits"],
            listForUser: ["GET /users/{username}/gists"],
            listForks: ["GET /gists/{gist_id}/forks"],
            listPublic: ["GET /gists/public"],
            listStarred: ["GET /gists/starred"],
            star: ["PUT /gists/{gist_id}/star"],
            unstar: ["DELETE /gists/{gist_id}/star"],
            update: ["PATCH /gists/{gist_id}"],
            updateComment: ["PATCH /gists/{gist_id}/comments/{comment_id}"],
        },
        git: {
            createBlob: ["POST /repos/{owner}/{repo}/git/blobs"],
            createCommit: ["POST /repos/{owner}/{repo}/git/commits"],
            createRef: ["POST /repos/{owner}/{repo}/git/refs"],
            createTag: ["POST /repos/{owner}/{repo}/git/tags"],
            createTree: ["POST /repos/{owner}/{repo}/git/trees"],
            deleteRef: ["DELETE /repos/{owner}/{repo}/git/refs/{ref}"],
            getBlob: ["GET /repos/{owner}/{repo}/git/blobs/{file_sha}"],
            getCommit: ["GET /repos/{owner}/{repo}/git/commits/{commit_sha}"],
            getRef: ["GET /repos/{owner}/{repo}/git/ref/{ref}"],
            getTag: ["GET /repos/{owner}/{repo}/git/tags/{tag_sha}"],
            getTree: ["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"],
            listMatchingRefs: ["GET /repos/{owner}/{repo}/git/matching-refs/{ref}"],
            updateRef: ["PATCH /repos/{owner}/{repo}/git/refs/{ref}"],
        },
        gitignore: {
            getAllTemplates: ["GET /gitignore/templates"],
            getTemplate: ["GET /gitignore/templates/{name}"],
        },
        interactions: {
            getRestrictionsForAuthenticatedUser: ["GET /user/interaction-limits"],
            getRestrictionsForOrg: ["GET /orgs/{org}/interaction-limits"],
            getRestrictionsForRepo: ["GET /repos/{owner}/{repo}/interaction-limits"],
            getRestrictionsForYourPublicRepos: [
                "GET /user/interaction-limits",
                {},
                { renamed: ["interactions", "getRestrictionsForAuthenticatedUser"] },
            ],
            removeRestrictionsForAuthenticatedUser: ["DELETE /user/interaction-limits"],
            removeRestrictionsForOrg: ["DELETE /orgs/{org}/interaction-limits"],
            removeRestrictionsForRepo: [
                "DELETE /repos/{owner}/{repo}/interaction-limits",
            ],
            removeRestrictionsForYourPublicRepos: [
                "DELETE /user/interaction-limits",
                {},
                { renamed: ["interactions", "removeRestrictionsForAuthenticatedUser"] },
            ],
            setRestrictionsForAuthenticatedUser: ["PUT /user/interaction-limits"],
            setRestrictionsForOrg: ["PUT /orgs/{org}/interaction-limits"],
            setRestrictionsForRepo: ["PUT /repos/{owner}/{repo}/interaction-limits"],
            setRestrictionsForYourPublicRepos: [
                "PUT /user/interaction-limits",
                {},
                { renamed: ["interactions", "setRestrictionsForAuthenticatedUser"] },
            ],
        },
        issues: {
            addAssignees: [
                "POST /repos/{owner}/{repo}/issues/{issue_number}/assignees",
            ],
            addLabels: ["POST /repos/{owner}/{repo}/issues/{issue_number}/labels"],
            checkUserCanBeAssigned: ["GET /repos/{owner}/{repo}/assignees/{assignee}"],
            create: ["POST /repos/{owner}/{repo}/issues"],
            createComment: [
                "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
            ],
            createLabel: ["POST /repos/{owner}/{repo}/labels"],
            createMilestone: ["POST /repos/{owner}/{repo}/milestones"],
            deleteComment: [
                "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}",
            ],
            deleteLabel: ["DELETE /repos/{owner}/{repo}/labels/{name}"],
            deleteMilestone: [
                "DELETE /repos/{owner}/{repo}/milestones/{milestone_number}",
            ],
            get: ["GET /repos/{owner}/{repo}/issues/{issue_number}"],
            getComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}"],
            getEvent: ["GET /repos/{owner}/{repo}/issues/events/{event_id}"],
            getLabel: ["GET /repos/{owner}/{repo}/labels/{name}"],
            getMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}"],
            list: ["GET /issues"],
            listAssignees: ["GET /repos/{owner}/{repo}/assignees"],
            listComments: ["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"],
            listCommentsForRepo: ["GET /repos/{owner}/{repo}/issues/comments"],
            listEvents: ["GET /repos/{owner}/{repo}/issues/{issue_number}/events"],
            listEventsForRepo: ["GET /repos/{owner}/{repo}/issues/events"],
            listEventsForTimeline: [
                "GET /repos/{owner}/{repo}/issues/{issue_number}/timeline",
                { mediaType: { previews: ["mockingbird"] } },
            ],
            listForAuthenticatedUser: ["GET /user/issues"],
            listForOrg: ["GET /orgs/{org}/issues"],
            listForRepo: ["GET /repos/{owner}/{repo}/issues"],
            listLabelsForMilestone: [
                "GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels",
            ],
            listLabelsForRepo: ["GET /repos/{owner}/{repo}/labels"],
            listLabelsOnIssue: [
                "GET /repos/{owner}/{repo}/issues/{issue_number}/labels",
            ],
            listMilestones: ["GET /repos/{owner}/{repo}/milestones"],
            lock: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/lock"],
            removeAllLabels: [
                "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels",
            ],
            removeAssignees: [
                "DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees",
            ],
            removeLabel: [
                "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}",
            ],
            setLabels: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/labels"],
            unlock: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock"],
            update: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}"],
            updateComment: ["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"],
            updateLabel: ["PATCH /repos/{owner}/{repo}/labels/{name}"],
            updateMilestone: [
                "PATCH /repos/{owner}/{repo}/milestones/{milestone_number}",
            ],
        },
        licenses: {
            get: ["GET /licenses/{license}"],
            getAllCommonlyUsed: ["GET /licenses"],
            getForRepo: ["GET /repos/{owner}/{repo}/license"],
        },
        markdown: {
            render: ["POST /markdown"],
            renderRaw: [
                "POST /markdown/raw",
                { headers: { "content-type": "text/plain; charset=utf-8" } },
            ],
        },
        meta: {
            get: ["GET /meta"],
            getOctocat: ["GET /octocat"],
            getZen: ["GET /zen"],
            root: ["GET /"],
        },
        migrations: {
            cancelImport: ["DELETE /repos/{owner}/{repo}/import"],
            deleteArchiveForAuthenticatedUser: [
                "DELETE /user/migrations/{migration_id}/archive",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            deleteArchiveForOrg: [
                "DELETE /orgs/{org}/migrations/{migration_id}/archive",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            downloadArchiveForOrg: [
                "GET /orgs/{org}/migrations/{migration_id}/archive",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            getArchiveForAuthenticatedUser: [
                "GET /user/migrations/{migration_id}/archive",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            getCommitAuthors: ["GET /repos/{owner}/{repo}/import/authors"],
            getImportStatus: ["GET /repos/{owner}/{repo}/import"],
            getLargeFiles: ["GET /repos/{owner}/{repo}/import/large_files"],
            getStatusForAuthenticatedUser: [
                "GET /user/migrations/{migration_id}",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            getStatusForOrg: [
                "GET /orgs/{org}/migrations/{migration_id}",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            listForAuthenticatedUser: [
                "GET /user/migrations",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            listForOrg: [
                "GET /orgs/{org}/migrations",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            listReposForOrg: [
                "GET /orgs/{org}/migrations/{migration_id}/repositories",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            listReposForUser: [
                "GET /user/migrations/{migration_id}/repositories",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            mapCommitAuthor: ["PATCH /repos/{owner}/{repo}/import/authors/{author_id}"],
            setLfsPreference: ["PATCH /repos/{owner}/{repo}/import/lfs"],
            startForAuthenticatedUser: ["POST /user/migrations"],
            startForOrg: ["POST /orgs/{org}/migrations"],
            startImport: ["PUT /repos/{owner}/{repo}/import"],
            unlockRepoForAuthenticatedUser: [
                "DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            unlockRepoForOrg: [
                "DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock",
                { mediaType: { previews: ["wyandotte"] } },
            ],
            updateImport: ["PATCH /repos/{owner}/{repo}/import"],
        },
        orgs: {
            blockUser: ["PUT /orgs/{org}/blocks/{username}"],
            cancelInvitation: ["DELETE /orgs/{org}/invitations/{invitation_id}"],
            checkBlockedUser: ["GET /orgs/{org}/blocks/{username}"],
            checkMembershipForUser: ["GET /orgs/{org}/members/{username}"],
            checkPublicMembershipForUser: ["GET /orgs/{org}/public_members/{username}"],
            convertMemberToOutsideCollaborator: [
                "PUT /orgs/{org}/outside_collaborators/{username}",
            ],
            createInvitation: ["POST /orgs/{org}/invitations"],
            createWebhook: ["POST /orgs/{org}/hooks"],
            deleteWebhook: ["DELETE /orgs/{org}/hooks/{hook_id}"],
            get: ["GET /orgs/{org}"],
            getMembershipForAuthenticatedUser: ["GET /user/memberships/orgs/{org}"],
            getMembershipForUser: ["GET /orgs/{org}/memberships/{username}"],
            getWebhook: ["GET /orgs/{org}/hooks/{hook_id}"],
            getWebhookConfigForOrg: ["GET /orgs/{org}/hooks/{hook_id}/config"],
            getWebhookDelivery: [
                "GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}",
            ],
            list: ["GET /organizations"],
            listAppInstallations: ["GET /orgs/{org}/installations"],
            listBlockedUsers: ["GET /orgs/{org}/blocks"],
            listFailedInvitations: ["GET /orgs/{org}/failed_invitations"],
            listForAuthenticatedUser: ["GET /user/orgs"],
            listForUser: ["GET /users/{username}/orgs"],
            listInvitationTeams: ["GET /orgs/{org}/invitations/{invitation_id}/teams"],
            listMembers: ["GET /orgs/{org}/members"],
            listMembershipsForAuthenticatedUser: ["GET /user/memberships/orgs"],
            listOutsideCollaborators: ["GET /orgs/{org}/outside_collaborators"],
            listPendingInvitations: ["GET /orgs/{org}/invitations"],
            listPublicMembers: ["GET /orgs/{org}/public_members"],
            listWebhookDeliveries: ["GET /orgs/{org}/hooks/{hook_id}/deliveries"],
            listWebhooks: ["GET /orgs/{org}/hooks"],
            pingWebhook: ["POST /orgs/{org}/hooks/{hook_id}/pings"],
            redeliverWebhookDelivery: [
                "POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
            ],
            removeMember: ["DELETE /orgs/{org}/members/{username}"],
            removeMembershipForUser: ["DELETE /orgs/{org}/memberships/{username}"],
            removeOutsideCollaborator: [
                "DELETE /orgs/{org}/outside_collaborators/{username}",
            ],
            removePublicMembershipForAuthenticatedUser: [
                "DELETE /orgs/{org}/public_members/{username}",
            ],
            setMembershipForUser: ["PUT /orgs/{org}/memberships/{username}"],
            setPublicMembershipForAuthenticatedUser: [
                "PUT /orgs/{org}/public_members/{username}",
            ],
            unblockUser: ["DELETE /orgs/{org}/blocks/{username}"],
            update: ["PATCH /orgs/{org}"],
            updateMembershipForAuthenticatedUser: [
                "PATCH /user/memberships/orgs/{org}",
            ],
            updateWebhook: ["PATCH /orgs/{org}/hooks/{hook_id}"],
            updateWebhookConfigForOrg: ["PATCH /orgs/{org}/hooks/{hook_id}/config"],
        },
        packages: {
            deletePackageForAuthenticatedUser: [
                "DELETE /user/packages/{package_type}/{package_name}",
            ],
            deletePackageForOrg: [
                "DELETE /orgs/{org}/packages/{package_type}/{package_name}",
            ],
            deletePackageVersionForAuthenticatedUser: [
                "DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            deletePackageVersionForOrg: [
                "DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            getAllPackageVersionsForAPackageOwnedByAnOrg: [
                "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
                {},
                { renamed: ["packages", "getAllPackageVersionsForPackageOwnedByOrg"] },
            ],
            getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: [
                "GET /user/packages/{package_type}/{package_name}/versions",
                {},
                {
                    renamed: [
                        "packages",
                        "getAllPackageVersionsForPackageOwnedByAuthenticatedUser",
                    ],
                },
            ],
            getAllPackageVersionsForPackageOwnedByAuthenticatedUser: [
                "GET /user/packages/{package_type}/{package_name}/versions",
            ],
            getAllPackageVersionsForPackageOwnedByOrg: [
                "GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
            ],
            getAllPackageVersionsForPackageOwnedByUser: [
                "GET /users/{username}/packages/{package_type}/{package_name}/versions",
            ],
            getPackageForAuthenticatedUser: [
                "GET /user/packages/{package_type}/{package_name}",
            ],
            getPackageForOrganization: [
                "GET /orgs/{org}/packages/{package_type}/{package_name}",
            ],
            getPackageForUser: [
                "GET /users/{username}/packages/{package_type}/{package_name}",
            ],
            getPackageVersionForAuthenticatedUser: [
                "GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            getPackageVersionForOrganization: [
                "GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            getPackageVersionForUser: [
                "GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}",
            ],
            restorePackageForAuthenticatedUser: [
                "POST /user/packages/{package_type}/{package_name}/restore{?token}",
            ],
            restorePackageForOrg: [
                "POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}",
            ],
            restorePackageVersionForAuthenticatedUser: [
                "POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
            ],
            restorePackageVersionForOrg: [
                "POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore",
            ],
        },
        projects: {
            addCollaborator: [
                "PUT /projects/{project_id}/collaborators/{username}",
                { mediaType: { previews: ["inertia"] } },
            ],
            createCard: [
                "POST /projects/columns/{column_id}/cards",
                { mediaType: { previews: ["inertia"] } },
            ],
            createColumn: [
                "POST /projects/{project_id}/columns",
                { mediaType: { previews: ["inertia"] } },
            ],
            createForAuthenticatedUser: [
                "POST /user/projects",
                { mediaType: { previews: ["inertia"] } },
            ],
            createForOrg: [
                "POST /orgs/{org}/projects",
                { mediaType: { previews: ["inertia"] } },
            ],
            createForRepo: [
                "POST /repos/{owner}/{repo}/projects",
                { mediaType: { previews: ["inertia"] } },
            ],
            delete: [
                "DELETE /projects/{project_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            deleteCard: [
                "DELETE /projects/columns/cards/{card_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            deleteColumn: [
                "DELETE /projects/columns/{column_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            get: [
                "GET /projects/{project_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            getCard: [
                "GET /projects/columns/cards/{card_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            getColumn: [
                "GET /projects/columns/{column_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            getPermissionForUser: [
                "GET /projects/{project_id}/collaborators/{username}/permission",
                { mediaType: { previews: ["inertia"] } },
            ],
            listCards: [
                "GET /projects/columns/{column_id}/cards",
                { mediaType: { previews: ["inertia"] } },
            ],
            listCollaborators: [
                "GET /projects/{project_id}/collaborators",
                { mediaType: { previews: ["inertia"] } },
            ],
            listColumns: [
                "GET /projects/{project_id}/columns",
                { mediaType: { previews: ["inertia"] } },
            ],
            listForOrg: [
                "GET /orgs/{org}/projects",
                { mediaType: { previews: ["inertia"] } },
            ],
            listForRepo: [
                "GET /repos/{owner}/{repo}/projects",
                { mediaType: { previews: ["inertia"] } },
            ],
            listForUser: [
                "GET /users/{username}/projects",
                { mediaType: { previews: ["inertia"] } },
            ],
            moveCard: [
                "POST /projects/columns/cards/{card_id}/moves",
                { mediaType: { previews: ["inertia"] } },
            ],
            moveColumn: [
                "POST /projects/columns/{column_id}/moves",
                { mediaType: { previews: ["inertia"] } },
            ],
            removeCollaborator: [
                "DELETE /projects/{project_id}/collaborators/{username}",
                { mediaType: { previews: ["inertia"] } },
            ],
            update: [
                "PATCH /projects/{project_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            updateCard: [
                "PATCH /projects/columns/cards/{card_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            updateColumn: [
                "PATCH /projects/columns/{column_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
        },
        pulls: {
            checkIfMerged: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
            create: ["POST /repos/{owner}/{repo}/pulls"],
            createReplyForReviewComment: [
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
            ],
            createReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
            createReviewComment: [
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments",
            ],
            deletePendingReview: [
                "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
            ],
            deleteReviewComment: [
                "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}",
            ],
            dismissReview: [
                "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals",
            ],
            get: ["GET /repos/{owner}/{repo}/pulls/{pull_number}"],
            getReview: [
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
            ],
            getReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
            list: ["GET /repos/{owner}/{repo}/pulls"],
            listCommentsForReview: [
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments",
            ],
            listCommits: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"],
            listFiles: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
            listRequestedReviewers: [
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
            ],
            listReviewComments: [
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/comments",
            ],
            listReviewCommentsForRepo: ["GET /repos/{owner}/{repo}/pulls/comments"],
            listReviews: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
            merge: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
            removeRequestedReviewers: [
                "DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
            ],
            requestReviewers: [
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
            ],
            submitReview: [
                "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events",
            ],
            update: ["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"],
            updateBranch: [
                "PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch",
                { mediaType: { previews: ["lydian"] } },
            ],
            updateReview: [
                "PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
            ],
            updateReviewComment: [
                "PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}",
            ],
        },
        rateLimit: { get: ["GET /rate_limit"] },
        reactions: {
            createForCommitComment: [
                "POST /repos/{owner}/{repo}/comments/{comment_id}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            createForIssue: [
                "POST /repos/{owner}/{repo}/issues/{issue_number}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            createForIssueComment: [
                "POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            createForPullRequestReviewComment: [
                "POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            createForRelease: [
                "POST /repos/{owner}/{repo}/releases/{release_id}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            createForTeamDiscussionCommentInOrg: [
                "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            createForTeamDiscussionInOrg: [
                "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            deleteForCommitComment: [
                "DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            deleteForIssue: [
                "DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            deleteForIssueComment: [
                "DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            deleteForPullRequestComment: [
                "DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            deleteForTeamDiscussion: [
                "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            deleteForTeamDiscussionComment: [
                "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            deleteLegacy: [
                "DELETE /reactions/{reaction_id}",
                { mediaType: { previews: ["squirrel-girl"] } },
                {
                    deprecated: "octokit.rest.reactions.deleteLegacy() is deprecated, see https://docs.github.com/rest/reference/reactions/#delete-a-reaction-legacy",
                },
            ],
            listForCommitComment: [
                "GET /repos/{owner}/{repo}/comments/{comment_id}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            listForIssue: [
                "GET /repos/{owner}/{repo}/issues/{issue_number}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            listForIssueComment: [
                "GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            listForPullRequestReviewComment: [
                "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            listForTeamDiscussionCommentInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
            listForTeamDiscussionInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
                { mediaType: { previews: ["squirrel-girl"] } },
            ],
        },
        repos: {
            acceptInvitation: ["PATCH /user/repository_invitations/{invitation_id}"],
            addAppAccessRestrictions: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
                {},
                { mapToData: "apps" },
            ],
            addCollaborator: ["PUT /repos/{owner}/{repo}/collaborators/{username}"],
            addStatusCheckContexts: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
                {},
                { mapToData: "contexts" },
            ],
            addTeamAccessRestrictions: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
                {},
                { mapToData: "teams" },
            ],
            addUserAccessRestrictions: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
                {},
                { mapToData: "users" },
            ],
            checkCollaborator: ["GET /repos/{owner}/{repo}/collaborators/{username}"],
            checkVulnerabilityAlerts: [
                "GET /repos/{owner}/{repo}/vulnerability-alerts",
                { mediaType: { previews: ["dorian"] } },
            ],
            compareCommits: ["GET /repos/{owner}/{repo}/compare/{base}...{head}"],
            compareCommitsWithBasehead: [
                "GET /repos/{owner}/{repo}/compare/{basehead}",
            ],
            createCommitComment: [
                "POST /repos/{owner}/{repo}/commits/{commit_sha}/comments",
            ],
            createCommitSignatureProtection: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
                { mediaType: { previews: ["zzzax"] } },
            ],
            createCommitStatus: ["POST /repos/{owner}/{repo}/statuses/{sha}"],
            createDeployKey: ["POST /repos/{owner}/{repo}/keys"],
            createDeployment: ["POST /repos/{owner}/{repo}/deployments"],
            createDeploymentStatus: [
                "POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
            ],
            createDispatchEvent: ["POST /repos/{owner}/{repo}/dispatches"],
            createForAuthenticatedUser: ["POST /user/repos"],
            createFork: ["POST /repos/{owner}/{repo}/forks"],
            createInOrg: ["POST /orgs/{org}/repos"],
            createOrUpdateEnvironment: [
                "PUT /repos/{owner}/{repo}/environments/{environment_name}",
            ],
            createOrUpdateFileContents: ["PUT /repos/{owner}/{repo}/contents/{path}"],
            createPagesSite: [
                "POST /repos/{owner}/{repo}/pages",
                { mediaType: { previews: ["switcheroo"] } },
            ],
            createRelease: ["POST /repos/{owner}/{repo}/releases"],
            createUsingTemplate: [
                "POST /repos/{template_owner}/{template_repo}/generate",
                { mediaType: { previews: ["baptiste"] } },
            ],
            createWebhook: ["POST /repos/{owner}/{repo}/hooks"],
            declineInvitation: ["DELETE /user/repository_invitations/{invitation_id}"],
            delete: ["DELETE /repos/{owner}/{repo}"],
            deleteAccessRestrictions: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions",
            ],
            deleteAdminBranchProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
            ],
            deleteAnEnvironment: [
                "DELETE /repos/{owner}/{repo}/environments/{environment_name}",
            ],
            deleteBranchProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection",
            ],
            deleteCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}"],
            deleteCommitSignatureProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
                { mediaType: { previews: ["zzzax"] } },
            ],
            deleteDeployKey: ["DELETE /repos/{owner}/{repo}/keys/{key_id}"],
            deleteDeployment: [
                "DELETE /repos/{owner}/{repo}/deployments/{deployment_id}",
            ],
            deleteFile: ["DELETE /repos/{owner}/{repo}/contents/{path}"],
            deleteInvitation: [
                "DELETE /repos/{owner}/{repo}/invitations/{invitation_id}",
            ],
            deletePagesSite: [
                "DELETE /repos/{owner}/{repo}/pages",
                { mediaType: { previews: ["switcheroo"] } },
            ],
            deletePullRequestReviewProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
            ],
            deleteRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}"],
            deleteReleaseAsset: [
                "DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}",
            ],
            deleteWebhook: ["DELETE /repos/{owner}/{repo}/hooks/{hook_id}"],
            disableAutomatedSecurityFixes: [
                "DELETE /repos/{owner}/{repo}/automated-security-fixes",
                { mediaType: { previews: ["london"] } },
            ],
            disableVulnerabilityAlerts: [
                "DELETE /repos/{owner}/{repo}/vulnerability-alerts",
                { mediaType: { previews: ["dorian"] } },
            ],
            downloadArchive: [
                "GET /repos/{owner}/{repo}/zipball/{ref}",
                {},
                { renamed: ["repos", "downloadZipballArchive"] },
            ],
            downloadTarballArchive: ["GET /repos/{owner}/{repo}/tarball/{ref}"],
            downloadZipballArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}"],
            enableAutomatedSecurityFixes: [
                "PUT /repos/{owner}/{repo}/automated-security-fixes",
                { mediaType: { previews: ["london"] } },
            ],
            enableVulnerabilityAlerts: [
                "PUT /repos/{owner}/{repo}/vulnerability-alerts",
                { mediaType: { previews: ["dorian"] } },
            ],
            get: ["GET /repos/{owner}/{repo}"],
            getAccessRestrictions: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions",
            ],
            getAdminBranchProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
            ],
            getAllEnvironments: ["GET /repos/{owner}/{repo}/environments"],
            getAllStatusCheckContexts: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
            ],
            getAllTopics: [
                "GET /repos/{owner}/{repo}/topics",
                { mediaType: { previews: ["mercy"] } },
            ],
            getAppsWithAccessToProtectedBranch: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
            ],
            getBranch: ["GET /repos/{owner}/{repo}/branches/{branch}"],
            getBranchProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection",
            ],
            getClones: ["GET /repos/{owner}/{repo}/traffic/clones"],
            getCodeFrequencyStats: ["GET /repos/{owner}/{repo}/stats/code_frequency"],
            getCollaboratorPermissionLevel: [
                "GET /repos/{owner}/{repo}/collaborators/{username}/permission",
            ],
            getCombinedStatusForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/status"],
            getCommit: ["GET /repos/{owner}/{repo}/commits/{ref}"],
            getCommitActivityStats: ["GET /repos/{owner}/{repo}/stats/commit_activity"],
            getCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}"],
            getCommitSignatureProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
                { mediaType: { previews: ["zzzax"] } },
            ],
            getCommunityProfileMetrics: ["GET /repos/{owner}/{repo}/community/profile"],
            getContent: ["GET /repos/{owner}/{repo}/contents/{path}"],
            getContributorsStats: ["GET /repos/{owner}/{repo}/stats/contributors"],
            getDeployKey: ["GET /repos/{owner}/{repo}/keys/{key_id}"],
            getDeployment: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}"],
            getDeploymentStatus: [
                "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}",
            ],
            getEnvironment: [
                "GET /repos/{owner}/{repo}/environments/{environment_name}",
            ],
            getLatestPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/latest"],
            getLatestRelease: ["GET /repos/{owner}/{repo}/releases/latest"],
            getPages: ["GET /repos/{owner}/{repo}/pages"],
            getPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/{build_id}"],
            getPagesHealthCheck: ["GET /repos/{owner}/{repo}/pages/health"],
            getParticipationStats: ["GET /repos/{owner}/{repo}/stats/participation"],
            getPullRequestReviewProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
            ],
            getPunchCardStats: ["GET /repos/{owner}/{repo}/stats/punch_card"],
            getReadme: ["GET /repos/{owner}/{repo}/readme"],
            getReadmeInDirectory: ["GET /repos/{owner}/{repo}/readme/{dir}"],
            getRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}"],
            getReleaseAsset: ["GET /repos/{owner}/{repo}/releases/assets/{asset_id}"],
            getReleaseByTag: ["GET /repos/{owner}/{repo}/releases/tags/{tag}"],
            getStatusChecksProtection: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
            ],
            getTeamsWithAccessToProtectedBranch: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
            ],
            getTopPaths: ["GET /repos/{owner}/{repo}/traffic/popular/paths"],
            getTopReferrers: ["GET /repos/{owner}/{repo}/traffic/popular/referrers"],
            getUsersWithAccessToProtectedBranch: [
                "GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
            ],
            getViews: ["GET /repos/{owner}/{repo}/traffic/views"],
            getWebhook: ["GET /repos/{owner}/{repo}/hooks/{hook_id}"],
            getWebhookConfigForRepo: [
                "GET /repos/{owner}/{repo}/hooks/{hook_id}/config",
            ],
            getWebhookDelivery: [
                "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}",
            ],
            listBranches: ["GET /repos/{owner}/{repo}/branches"],
            listBranchesForHeadCommit: [
                "GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head",
                { mediaType: { previews: ["groot"] } },
            ],
            listCollaborators: ["GET /repos/{owner}/{repo}/collaborators"],
            listCommentsForCommit: [
                "GET /repos/{owner}/{repo}/commits/{commit_sha}/comments",
            ],
            listCommitCommentsForRepo: ["GET /repos/{owner}/{repo}/comments"],
            listCommitStatusesForRef: [
                "GET /repos/{owner}/{repo}/commits/{ref}/statuses",
            ],
            listCommits: ["GET /repos/{owner}/{repo}/commits"],
            listContributors: ["GET /repos/{owner}/{repo}/contributors"],
            listDeployKeys: ["GET /repos/{owner}/{repo}/keys"],
            listDeploymentStatuses: [
                "GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
            ],
            listDeployments: ["GET /repos/{owner}/{repo}/deployments"],
            listForAuthenticatedUser: ["GET /user/repos"],
            listForOrg: ["GET /orgs/{org}/repos"],
            listForUser: ["GET /users/{username}/repos"],
            listForks: ["GET /repos/{owner}/{repo}/forks"],
            listInvitations: ["GET /repos/{owner}/{repo}/invitations"],
            listInvitationsForAuthenticatedUser: ["GET /user/repository_invitations"],
            listLanguages: ["GET /repos/{owner}/{repo}/languages"],
            listPagesBuilds: ["GET /repos/{owner}/{repo}/pages/builds"],
            listPublic: ["GET /repositories"],
            listPullRequestsAssociatedWithCommit: [
                "GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls",
                { mediaType: { previews: ["groot"] } },
            ],
            listReleaseAssets: [
                "GET /repos/{owner}/{repo}/releases/{release_id}/assets",
            ],
            listReleases: ["GET /repos/{owner}/{repo}/releases"],
            listTags: ["GET /repos/{owner}/{repo}/tags"],
            listTeams: ["GET /repos/{owner}/{repo}/teams"],
            listWebhookDeliveries: [
                "GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries",
            ],
            listWebhooks: ["GET /repos/{owner}/{repo}/hooks"],
            merge: ["POST /repos/{owner}/{repo}/merges"],
            pingWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/pings"],
            redeliverWebhookDelivery: [
                "POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
            ],
            removeAppAccessRestrictions: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
                {},
                { mapToData: "apps" },
            ],
            removeCollaborator: [
                "DELETE /repos/{owner}/{repo}/collaborators/{username}",
            ],
            removeStatusCheckContexts: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
                {},
                { mapToData: "contexts" },
            ],
            removeStatusCheckProtection: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
            ],
            removeTeamAccessRestrictions: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
                {},
                { mapToData: "teams" },
            ],
            removeUserAccessRestrictions: [
                "DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
                {},
                { mapToData: "users" },
            ],
            renameBranch: ["POST /repos/{owner}/{repo}/branches/{branch}/rename"],
            replaceAllTopics: [
                "PUT /repos/{owner}/{repo}/topics",
                { mediaType: { previews: ["mercy"] } },
            ],
            requestPagesBuild: ["POST /repos/{owner}/{repo}/pages/builds"],
            setAdminBranchProtection: [
                "POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
            ],
            setAppAccessRestrictions: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
                {},
                { mapToData: "apps" },
            ],
            setStatusCheckContexts: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
                {},
                { mapToData: "contexts" },
            ],
            setTeamAccessRestrictions: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
                {},
                { mapToData: "teams" },
            ],
            setUserAccessRestrictions: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
                {},
                { mapToData: "users" },
            ],
            testPushWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/tests"],
            transfer: ["POST /repos/{owner}/{repo}/transfer"],
            update: ["PATCH /repos/{owner}/{repo}"],
            updateBranchProtection: [
                "PUT /repos/{owner}/{repo}/branches/{branch}/protection",
            ],
            updateCommitComment: ["PATCH /repos/{owner}/{repo}/comments/{comment_id}"],
            updateInformationAboutPagesSite: ["PUT /repos/{owner}/{repo}/pages"],
            updateInvitation: [
                "PATCH /repos/{owner}/{repo}/invitations/{invitation_id}",
            ],
            updatePullRequestReviewProtection: [
                "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
            ],
            updateRelease: ["PATCH /repos/{owner}/{repo}/releases/{release_id}"],
            updateReleaseAsset: [
                "PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}",
            ],
            updateStatusCheckPotection: [
                "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
                {},
                { renamed: ["repos", "updateStatusCheckProtection"] },
            ],
            updateStatusCheckProtection: [
                "PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
            ],
            updateWebhook: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}"],
            updateWebhookConfigForRepo: [
                "PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config",
            ],
            uploadReleaseAsset: [
                "POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}",
                { baseUrl: "https://uploads.github.com" },
            ],
        },
        search: {
            code: ["GET /search/code"],
            commits: ["GET /search/commits", { mediaType: { previews: ["cloak"] } }],
            issuesAndPullRequests: ["GET /search/issues"],
            labels: ["GET /search/labels"],
            repos: ["GET /search/repositories"],
            topics: ["GET /search/topics", { mediaType: { previews: ["mercy"] } }],
            users: ["GET /search/users"],
        },
        secretScanning: {
            getAlert: [
                "GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}",
            ],
            listAlertsForRepo: ["GET /repos/{owner}/{repo}/secret-scanning/alerts"],
            updateAlert: [
                "PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}",
            ],
        },
        teams: {
            addOrUpdateMembershipForUserInOrg: [
                "PUT /orgs/{org}/teams/{team_slug}/memberships/{username}",
            ],
            addOrUpdateProjectPermissionsInOrg: [
                "PUT /orgs/{org}/teams/{team_slug}/projects/{project_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            addOrUpdateRepoPermissionsInOrg: [
                "PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
            ],
            checkPermissionsForProjectInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/projects/{project_id}",
                { mediaType: { previews: ["inertia"] } },
            ],
            checkPermissionsForRepoInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
            ],
            create: ["POST /orgs/{org}/teams"],
            createDiscussionCommentInOrg: [
                "POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
            ],
            createDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions"],
            deleteDiscussionCommentInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
            ],
            deleteDiscussionInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
            ],
            deleteInOrg: ["DELETE /orgs/{org}/teams/{team_slug}"],
            getByName: ["GET /orgs/{org}/teams/{team_slug}"],
            getDiscussionCommentInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
            ],
            getDiscussionInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
            ],
            getMembershipForUserInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/memberships/{username}",
            ],
            list: ["GET /orgs/{org}/teams"],
            listChildInOrg: ["GET /orgs/{org}/teams/{team_slug}/teams"],
            listDiscussionCommentsInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
            ],
            listDiscussionsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions"],
            listForAuthenticatedUser: ["GET /user/teams"],
            listMembersInOrg: ["GET /orgs/{org}/teams/{team_slug}/members"],
            listPendingInvitationsInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/invitations",
            ],
            listProjectsInOrg: [
                "GET /orgs/{org}/teams/{team_slug}/projects",
                { mediaType: { previews: ["inertia"] } },
            ],
            listReposInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos"],
            removeMembershipForUserInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}",
            ],
            removeProjectInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/projects/{project_id}",
            ],
            removeRepoInOrg: [
                "DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
            ],
            updateDiscussionCommentInOrg: [
                "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
            ],
            updateDiscussionInOrg: [
                "PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
            ],
            updateInOrg: ["PATCH /orgs/{org}/teams/{team_slug}"],
        },
        users: {
            addEmailForAuthenticated: ["POST /user/emails"],
            block: ["PUT /user/blocks/{username}"],
            checkBlocked: ["GET /user/blocks/{username}"],
            checkFollowingForUser: ["GET /users/{username}/following/{target_user}"],
            checkPersonIsFollowedByAuthenticated: ["GET /user/following/{username}"],
            createGpgKeyForAuthenticated: ["POST /user/gpg_keys"],
            createPublicSshKeyForAuthenticated: ["POST /user/keys"],
            deleteEmailForAuthenticated: ["DELETE /user/emails"],
            deleteGpgKeyForAuthenticated: ["DELETE /user/gpg_keys/{gpg_key_id}"],
            deletePublicSshKeyForAuthenticated: ["DELETE /user/keys/{key_id}"],
            follow: ["PUT /user/following/{username}"],
            getAuthenticated: ["GET /user"],
            getByUsername: ["GET /users/{username}"],
            getContextForUser: ["GET /users/{username}/hovercard"],
            getGpgKeyForAuthenticated: ["GET /user/gpg_keys/{gpg_key_id}"],
            getPublicSshKeyForAuthenticated: ["GET /user/keys/{key_id}"],
            list: ["GET /users"],
            listBlockedByAuthenticated: ["GET /user/blocks"],
            listEmailsForAuthenticated: ["GET /user/emails"],
            listFollowedByAuthenticated: ["GET /user/following"],
            listFollowersForAuthenticatedUser: ["GET /user/followers"],
            listFollowersForUser: ["GET /users/{username}/followers"],
            listFollowingForUser: ["GET /users/{username}/following"],
            listGpgKeysForAuthenticated: ["GET /user/gpg_keys"],
            listGpgKeysForUser: ["GET /users/{username}/gpg_keys"],
            listPublicEmailsForAuthenticated: ["GET /user/public_emails"],
            listPublicKeysForUser: ["GET /users/{username}/keys"],
            listPublicSshKeysForAuthenticated: ["GET /user/keys"],
            setPrimaryEmailVisibilityForAuthenticated: ["PATCH /user/email/visibility"],
            unblock: ["DELETE /user/blocks/{username}"],
            unfollow: ["DELETE /user/following/{username}"],
            updateAuthenticated: ["PATCH /user"],
        },
    };

    const VERSION$9 = "5.4.1";

    function endpointsToMethods(octokit, endpointsMap) {
        const newMethods = {};
        for (const [scope, endpoints] of Object.entries(endpointsMap)) {
            for (const [methodName, endpoint] of Object.entries(endpoints)) {
                const [route, defaults, decorations] = endpoint;
                const [method, url] = route.split(/ /);
                const endpointDefaults = Object.assign({ method, url }, defaults);
                if (!newMethods[scope]) {
                    newMethods[scope] = {};
                }
                const scopeMethods = newMethods[scope];
                if (decorations) {
                    scopeMethods[methodName] = decorate(octokit, scope, methodName, endpointDefaults, decorations);
                    continue;
                }
                scopeMethods[methodName] = octokit.request.defaults(endpointDefaults);
            }
        }
        return newMethods;
    }
    function decorate(octokit, scope, methodName, defaults, decorations) {
        const requestWithDefaults = octokit.request.defaults(defaults);
        /* istanbul ignore next */
        function withDecorations(...args) {
            // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
            let options = requestWithDefaults.endpoint.merge(...args);
            // There are currently no other decorations than `.mapToData`
            if (decorations.mapToData) {
                options = Object.assign({}, options, {
                    data: options[decorations.mapToData],
                    [decorations.mapToData]: undefined,
                });
                return requestWithDefaults(options);
            }
            if (decorations.renamed) {
                const [newScope, newMethodName] = decorations.renamed;
                octokit.log.warn(`octokit.${scope}.${methodName}() has been renamed to octokit.${newScope}.${newMethodName}()`);
            }
            if (decorations.deprecated) {
                octokit.log.warn(decorations.deprecated);
            }
            if (decorations.renamedParameters) {
                // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
                const options = requestWithDefaults.endpoint.merge(...args);
                for (const [name, alias] of Object.entries(decorations.renamedParameters)) {
                    if (name in options) {
                        octokit.log.warn(`"${name}" parameter is deprecated for "octokit.${scope}.${methodName}()". Use "${alias}" instead`);
                        if (!(alias in options)) {
                            options[alias] = options[name];
                        }
                        delete options[name];
                    }
                }
                return requestWithDefaults(options);
            }
            // @ts-ignore https://github.com/microsoft/TypeScript/issues/25488
            return requestWithDefaults(...args);
        }
        return Object.assign(withDecorations, requestWithDefaults);
    }

    function restEndpointMethods(octokit) {
        const api = endpointsToMethods(octokit, Endpoints);
        return {
            rest: api,
        };
    }
    restEndpointMethods.VERSION = VERSION$9;

    /**
      * This file contains the Bottleneck library (MIT), compiled to ES2017, and without Clustering support.
      * https://github.com/SGrondin/bottleneck
      */

    var light = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
    	module.exports = factory() ;
    }(commonjsGlobal, (function () {
    	var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof self !== 'undefined' ? self : {};

    	function getCjsExportFromNamespace (n) {
    		return n && n['default'] || n;
    	}

    	var load = function(received, defaults, onto = {}) {
    	  var k, ref, v;
    	  for (k in defaults) {
    	    v = defaults[k];
    	    onto[k] = (ref = received[k]) != null ? ref : v;
    	  }
    	  return onto;
    	};

    	var overwrite = function(received, defaults, onto = {}) {
    	  var k, v;
    	  for (k in received) {
    	    v = received[k];
    	    if (defaults[k] !== void 0) {
    	      onto[k] = v;
    	    }
    	  }
    	  return onto;
    	};

    	var parser = {
    		load: load,
    		overwrite: overwrite
    	};

    	var DLList;

    	DLList = class DLList {
    	  constructor(incr, decr) {
    	    this.incr = incr;
    	    this.decr = decr;
    	    this._first = null;
    	    this._last = null;
    	    this.length = 0;
    	  }

    	  push(value) {
    	    var node;
    	    this.length++;
    	    if (typeof this.incr === "function") {
    	      this.incr();
    	    }
    	    node = {
    	      value,
    	      prev: this._last,
    	      next: null
    	    };
    	    if (this._last != null) {
    	      this._last.next = node;
    	      this._last = node;
    	    } else {
    	      this._first = this._last = node;
    	    }
    	    return void 0;
    	  }

    	  shift() {
    	    var value;
    	    if (this._first == null) {
    	      return;
    	    } else {
    	      this.length--;
    	      if (typeof this.decr === "function") {
    	        this.decr();
    	      }
    	    }
    	    value = this._first.value;
    	    if ((this._first = this._first.next) != null) {
    	      this._first.prev = null;
    	    } else {
    	      this._last = null;
    	    }
    	    return value;
    	  }

    	  first() {
    	    if (this._first != null) {
    	      return this._first.value;
    	    }
    	  }

    	  getArray() {
    	    var node, ref, results;
    	    node = this._first;
    	    results = [];
    	    while (node != null) {
    	      results.push((ref = node, node = node.next, ref.value));
    	    }
    	    return results;
    	  }

    	  forEachShift(cb) {
    	    var node;
    	    node = this.shift();
    	    while (node != null) {
    	      (cb(node), node = this.shift());
    	    }
    	    return void 0;
    	  }

    	  debug() {
    	    var node, ref, ref1, ref2, results;
    	    node = this._first;
    	    results = [];
    	    while (node != null) {
    	      results.push((ref = node, node = node.next, {
    	        value: ref.value,
    	        prev: (ref1 = ref.prev) != null ? ref1.value : void 0,
    	        next: (ref2 = ref.next) != null ? ref2.value : void 0
    	      }));
    	    }
    	    return results;
    	  }

    	};

    	var DLList_1 = DLList;

    	var Events;

    	Events = class Events {
    	  constructor(instance) {
    	    this.instance = instance;
    	    this._events = {};
    	    if ((this.instance.on != null) || (this.instance.once != null) || (this.instance.removeAllListeners != null)) {
    	      throw new Error("An Emitter already exists for this object");
    	    }
    	    this.instance.on = (name, cb) => {
    	      return this._addListener(name, "many", cb);
    	    };
    	    this.instance.once = (name, cb) => {
    	      return this._addListener(name, "once", cb);
    	    };
    	    this.instance.removeAllListeners = (name = null) => {
    	      if (name != null) {
    	        return delete this._events[name];
    	      } else {
    	        return this._events = {};
    	      }
    	    };
    	  }

    	  _addListener(name, status, cb) {
    	    var base;
    	    if ((base = this._events)[name] == null) {
    	      base[name] = [];
    	    }
    	    this._events[name].push({cb, status});
    	    return this.instance;
    	  }

    	  listenerCount(name) {
    	    if (this._events[name] != null) {
    	      return this._events[name].length;
    	    } else {
    	      return 0;
    	    }
    	  }

    	  async trigger(name, ...args) {
    	    var e, promises;
    	    try {
    	      if (name !== "debug") {
    	        this.trigger("debug", `Event triggered: ${name}`, args);
    	      }
    	      if (this._events[name] == null) {
    	        return;
    	      }
    	      this._events[name] = this._events[name].filter(function(listener) {
    	        return listener.status !== "none";
    	      });
    	      promises = this._events[name].map(async(listener) => {
    	        var e, returned;
    	        if (listener.status === "none") {
    	          return;
    	        }
    	        if (listener.status === "once") {
    	          listener.status = "none";
    	        }
    	        try {
    	          returned = typeof listener.cb === "function" ? listener.cb(...args) : void 0;
    	          if (typeof (returned != null ? returned.then : void 0) === "function") {
    	            return (await returned);
    	          } else {
    	            return returned;
    	          }
    	        } catch (error) {
    	          e = error;
    	          {
    	            this.trigger("error", e);
    	          }
    	          return null;
    	        }
    	      });
    	      return ((await Promise.all(promises))).find(function(x) {
    	        return x != null;
    	      });
    	    } catch (error) {
    	      e = error;
    	      {
    	        this.trigger("error", e);
    	      }
    	      return null;
    	    }
    	  }

    	};

    	var Events_1 = Events;

    	var DLList$1, Events$1, Queues;

    	DLList$1 = DLList_1;

    	Events$1 = Events_1;

    	Queues = class Queues {
    	  constructor(num_priorities) {
    	    this.Events = new Events$1(this);
    	    this._length = 0;
    	    this._lists = (function() {
    	      var j, ref, results;
    	      results = [];
    	      for (j = 1, ref = num_priorities; (1 <= ref ? j <= ref : j >= ref); 1 <= ref ? ++j : --j) {
    	        results.push(new DLList$1((() => {
    	          return this.incr();
    	        }), (() => {
    	          return this.decr();
    	        })));
    	      }
    	      return results;
    	    }).call(this);
    	  }

    	  incr() {
    	    if (this._length++ === 0) {
    	      return this.Events.trigger("leftzero");
    	    }
    	  }

    	  decr() {
    	    if (--this._length === 0) {
    	      return this.Events.trigger("zero");
    	    }
    	  }

    	  push(job) {
    	    return this._lists[job.options.priority].push(job);
    	  }

    	  queued(priority) {
    	    if (priority != null) {
    	      return this._lists[priority].length;
    	    } else {
    	      return this._length;
    	    }
    	  }

    	  shiftAll(fn) {
    	    return this._lists.forEach(function(list) {
    	      return list.forEachShift(fn);
    	    });
    	  }

    	  getFirst(arr = this._lists) {
    	    var j, len, list;
    	    for (j = 0, len = arr.length; j < len; j++) {
    	      list = arr[j];
    	      if (list.length > 0) {
    	        return list;
    	      }
    	    }
    	    return [];
    	  }

    	  shiftLastFrom(priority) {
    	    return this.getFirst(this._lists.slice(priority).reverse()).shift();
    	  }

    	};

    	var Queues_1 = Queues;

    	var BottleneckError;

    	BottleneckError = class BottleneckError extends Error {};

    	var BottleneckError_1 = BottleneckError;

    	var BottleneckError$1, DEFAULT_PRIORITY, Job, NUM_PRIORITIES, parser$1;

    	NUM_PRIORITIES = 10;

    	DEFAULT_PRIORITY = 5;

    	parser$1 = parser;

    	BottleneckError$1 = BottleneckError_1;

    	Job = class Job {
    	  constructor(task, args, options, jobDefaults, rejectOnDrop, Events, _states, Promise) {
    	    this.task = task;
    	    this.args = args;
    	    this.rejectOnDrop = rejectOnDrop;
    	    this.Events = Events;
    	    this._states = _states;
    	    this.Promise = Promise;
    	    this.options = parser$1.load(options, jobDefaults);
    	    this.options.priority = this._sanitizePriority(this.options.priority);
    	    if (this.options.id === jobDefaults.id) {
    	      this.options.id = `${this.options.id}-${this._randomIndex()}`;
    	    }
    	    this.promise = new this.Promise((_resolve, _reject) => {
    	      this._resolve = _resolve;
    	      this._reject = _reject;
    	    });
    	    this.retryCount = 0;
    	  }

    	  _sanitizePriority(priority) {
    	    var sProperty;
    	    sProperty = ~~priority !== priority ? DEFAULT_PRIORITY : priority;
    	    if (sProperty < 0) {
    	      return 0;
    	    } else if (sProperty > NUM_PRIORITIES - 1) {
    	      return NUM_PRIORITIES - 1;
    	    } else {
    	      return sProperty;
    	    }
    	  }

    	  _randomIndex() {
    	    return Math.random().toString(36).slice(2);
    	  }

    	  doDrop({error, message = "This job has been dropped by Bottleneck"} = {}) {
    	    if (this._states.remove(this.options.id)) {
    	      if (this.rejectOnDrop) {
    	        this._reject(error != null ? error : new BottleneckError$1(message));
    	      }
    	      this.Events.trigger("dropped", {args: this.args, options: this.options, task: this.task, promise: this.promise});
    	      return true;
    	    } else {
    	      return false;
    	    }
    	  }

    	  _assertStatus(expected) {
    	    var status;
    	    status = this._states.jobStatus(this.options.id);
    	    if (!(status === expected || (expected === "DONE" && status === null))) {
    	      throw new BottleneckError$1(`Invalid job status ${status}, expected ${expected}. Please open an issue at https://github.com/SGrondin/bottleneck/issues`);
    	    }
    	  }

    	  doReceive() {
    	    this._states.start(this.options.id);
    	    return this.Events.trigger("received", {args: this.args, options: this.options});
    	  }

    	  doQueue(reachedHWM, blocked) {
    	    this._assertStatus("RECEIVED");
    	    this._states.next(this.options.id);
    	    return this.Events.trigger("queued", {args: this.args, options: this.options, reachedHWM, blocked});
    	  }

    	  doRun() {
    	    if (this.retryCount === 0) {
    	      this._assertStatus("QUEUED");
    	      this._states.next(this.options.id);
    	    } else {
    	      this._assertStatus("EXECUTING");
    	    }
    	    return this.Events.trigger("scheduled", {args: this.args, options: this.options});
    	  }

    	  async doExecute(chained, clearGlobalState, run, free) {
    	    var error, eventInfo, passed;
    	    if (this.retryCount === 0) {
    	      this._assertStatus("RUNNING");
    	      this._states.next(this.options.id);
    	    } else {
    	      this._assertStatus("EXECUTING");
    	    }
    	    eventInfo = {args: this.args, options: this.options, retryCount: this.retryCount};
    	    this.Events.trigger("executing", eventInfo);
    	    try {
    	      passed = (await (chained != null ? chained.schedule(this.options, this.task, ...this.args) : this.task(...this.args)));
    	      if (clearGlobalState()) {
    	        this.doDone(eventInfo);
    	        await free(this.options, eventInfo);
    	        this._assertStatus("DONE");
    	        return this._resolve(passed);
    	      }
    	    } catch (error1) {
    	      error = error1;
    	      return this._onFailure(error, eventInfo, clearGlobalState, run, free);
    	    }
    	  }

    	  doExpire(clearGlobalState, run, free) {
    	    var error, eventInfo;
    	    if (this._states.jobStatus(this.options.id === "RUNNING")) {
    	      this._states.next(this.options.id);
    	    }
    	    this._assertStatus("EXECUTING");
    	    eventInfo = {args: this.args, options: this.options, retryCount: this.retryCount};
    	    error = new BottleneckError$1(`This job timed out after ${this.options.expiration} ms.`);
    	    return this._onFailure(error, eventInfo, clearGlobalState, run, free);
    	  }

    	  async _onFailure(error, eventInfo, clearGlobalState, run, free) {
    	    var retry, retryAfter;
    	    if (clearGlobalState()) {
    	      retry = (await this.Events.trigger("failed", error, eventInfo));
    	      if (retry != null) {
    	        retryAfter = ~~retry;
    	        this.Events.trigger("retry", `Retrying ${this.options.id} after ${retryAfter} ms`, eventInfo);
    	        this.retryCount++;
    	        return run(retryAfter);
    	      } else {
    	        this.doDone(eventInfo);
    	        await free(this.options, eventInfo);
    	        this._assertStatus("DONE");
    	        return this._reject(error);
    	      }
    	    }
    	  }

    	  doDone(eventInfo) {
    	    this._assertStatus("EXECUTING");
    	    this._states.next(this.options.id);
    	    return this.Events.trigger("done", eventInfo);
    	  }

    	};

    	var Job_1 = Job;

    	var BottleneckError$2, LocalDatastore, parser$2;

    	parser$2 = parser;

    	BottleneckError$2 = BottleneckError_1;

    	LocalDatastore = class LocalDatastore {
    	  constructor(instance, storeOptions, storeInstanceOptions) {
    	    this.instance = instance;
    	    this.storeOptions = storeOptions;
    	    this.clientId = this.instance._randomIndex();
    	    parser$2.load(storeInstanceOptions, storeInstanceOptions, this);
    	    this._nextRequest = this._lastReservoirRefresh = this._lastReservoirIncrease = Date.now();
    	    this._running = 0;
    	    this._done = 0;
    	    this._unblockTime = 0;
    	    this.ready = this.Promise.resolve();
    	    this.clients = {};
    	    this._startHeartbeat();
    	  }

    	  _startHeartbeat() {
    	    var base;
    	    if ((this.heartbeat == null) && (((this.storeOptions.reservoirRefreshInterval != null) && (this.storeOptions.reservoirRefreshAmount != null)) || ((this.storeOptions.reservoirIncreaseInterval != null) && (this.storeOptions.reservoirIncreaseAmount != null)))) {
    	      return typeof (base = (this.heartbeat = setInterval(() => {
    	        var amount, incr, maximum, now, reservoir;
    	        now = Date.now();
    	        if ((this.storeOptions.reservoirRefreshInterval != null) && now >= this._lastReservoirRefresh + this.storeOptions.reservoirRefreshInterval) {
    	          this._lastReservoirRefresh = now;
    	          this.storeOptions.reservoir = this.storeOptions.reservoirRefreshAmount;
    	          this.instance._drainAll(this.computeCapacity());
    	        }
    	        if ((this.storeOptions.reservoirIncreaseInterval != null) && now >= this._lastReservoirIncrease + this.storeOptions.reservoirIncreaseInterval) {
    	          ({
    	            reservoirIncreaseAmount: amount,
    	            reservoirIncreaseMaximum: maximum,
    	            reservoir
    	          } = this.storeOptions);
    	          this._lastReservoirIncrease = now;
    	          incr = maximum != null ? Math.min(amount, maximum - reservoir) : amount;
    	          if (incr > 0) {
    	            this.storeOptions.reservoir += incr;
    	            return this.instance._drainAll(this.computeCapacity());
    	          }
    	        }
    	      }, this.heartbeatInterval))).unref === "function" ? base.unref() : void 0;
    	    } else {
    	      return clearInterval(this.heartbeat);
    	    }
    	  }

    	  async __publish__(message) {
    	    await this.yieldLoop();
    	    return this.instance.Events.trigger("message", message.toString());
    	  }

    	  async __disconnect__(flush) {
    	    await this.yieldLoop();
    	    clearInterval(this.heartbeat);
    	    return this.Promise.resolve();
    	  }

    	  yieldLoop(t = 0) {
    	    return new this.Promise(function(resolve, reject) {
    	      return setTimeout(resolve, t);
    	    });
    	  }

    	  computePenalty() {
    	    var ref;
    	    return (ref = this.storeOptions.penalty) != null ? ref : (15 * this.storeOptions.minTime) || 5000;
    	  }

    	  async __updateSettings__(options) {
    	    await this.yieldLoop();
    	    parser$2.overwrite(options, options, this.storeOptions);
    	    this._startHeartbeat();
    	    this.instance._drainAll(this.computeCapacity());
    	    return true;
    	  }

    	  async __running__() {
    	    await this.yieldLoop();
    	    return this._running;
    	  }

    	  async __queued__() {
    	    await this.yieldLoop();
    	    return this.instance.queued();
    	  }

    	  async __done__() {
    	    await this.yieldLoop();
    	    return this._done;
    	  }

    	  async __groupCheck__(time) {
    	    await this.yieldLoop();
    	    return (this._nextRequest + this.timeout) < time;
    	  }

    	  computeCapacity() {
    	    var maxConcurrent, reservoir;
    	    ({maxConcurrent, reservoir} = this.storeOptions);
    	    if ((maxConcurrent != null) && (reservoir != null)) {
    	      return Math.min(maxConcurrent - this._running, reservoir);
    	    } else if (maxConcurrent != null) {
    	      return maxConcurrent - this._running;
    	    } else if (reservoir != null) {
    	      return reservoir;
    	    } else {
    	      return null;
    	    }
    	  }

    	  conditionsCheck(weight) {
    	    var capacity;
    	    capacity = this.computeCapacity();
    	    return (capacity == null) || weight <= capacity;
    	  }

    	  async __incrementReservoir__(incr) {
    	    var reservoir;
    	    await this.yieldLoop();
    	    reservoir = this.storeOptions.reservoir += incr;
    	    this.instance._drainAll(this.computeCapacity());
    	    return reservoir;
    	  }

    	  async __currentReservoir__() {
    	    await this.yieldLoop();
    	    return this.storeOptions.reservoir;
    	  }

    	  isBlocked(now) {
    	    return this._unblockTime >= now;
    	  }

    	  check(weight, now) {
    	    return this.conditionsCheck(weight) && (this._nextRequest - now) <= 0;
    	  }

    	  async __check__(weight) {
    	    var now;
    	    await this.yieldLoop();
    	    now = Date.now();
    	    return this.check(weight, now);
    	  }

    	  async __register__(index, weight, expiration) {
    	    var now, wait;
    	    await this.yieldLoop();
    	    now = Date.now();
    	    if (this.conditionsCheck(weight)) {
    	      this._running += weight;
    	      if (this.storeOptions.reservoir != null) {
    	        this.storeOptions.reservoir -= weight;
    	      }
    	      wait = Math.max(this._nextRequest - now, 0);
    	      this._nextRequest = now + wait + this.storeOptions.minTime;
    	      return {
    	        success: true,
    	        wait,
    	        reservoir: this.storeOptions.reservoir
    	      };
    	    } else {
    	      return {
    	        success: false
    	      };
    	    }
    	  }

    	  strategyIsBlock() {
    	    return this.storeOptions.strategy === 3;
    	  }

    	  async __submit__(queueLength, weight) {
    	    var blocked, now, reachedHWM;
    	    await this.yieldLoop();
    	    if ((this.storeOptions.maxConcurrent != null) && weight > this.storeOptions.maxConcurrent) {
    	      throw new BottleneckError$2(`Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${this.storeOptions.maxConcurrent}`);
    	    }
    	    now = Date.now();
    	    reachedHWM = (this.storeOptions.highWater != null) && queueLength === this.storeOptions.highWater && !this.check(weight, now);
    	    blocked = this.strategyIsBlock() && (reachedHWM || this.isBlocked(now));
    	    if (blocked) {
    	      this._unblockTime = now + this.computePenalty();
    	      this._nextRequest = this._unblockTime + this.storeOptions.minTime;
    	      this.instance._dropAllQueued();
    	    }
    	    return {
    	      reachedHWM,
    	      blocked,
    	      strategy: this.storeOptions.strategy
    	    };
    	  }

    	  async __free__(index, weight) {
    	    await this.yieldLoop();
    	    this._running -= weight;
    	    this._done += weight;
    	    this.instance._drainAll(this.computeCapacity());
    	    return {
    	      running: this._running
    	    };
    	  }

    	};

    	var LocalDatastore_1 = LocalDatastore;

    	var BottleneckError$3, States;

    	BottleneckError$3 = BottleneckError_1;

    	States = class States {
    	  constructor(status1) {
    	    this.status = status1;
    	    this._jobs = {};
    	    this.counts = this.status.map(function() {
    	      return 0;
    	    });
    	  }

    	  next(id) {
    	    var current, next;
    	    current = this._jobs[id];
    	    next = current + 1;
    	    if ((current != null) && next < this.status.length) {
    	      this.counts[current]--;
    	      this.counts[next]++;
    	      return this._jobs[id]++;
    	    } else if (current != null) {
    	      this.counts[current]--;
    	      return delete this._jobs[id];
    	    }
    	  }

    	  start(id) {
    	    var initial;
    	    initial = 0;
    	    this._jobs[id] = initial;
    	    return this.counts[initial]++;
    	  }

    	  remove(id) {
    	    var current;
    	    current = this._jobs[id];
    	    if (current != null) {
    	      this.counts[current]--;
    	      delete this._jobs[id];
    	    }
    	    return current != null;
    	  }

    	  jobStatus(id) {
    	    var ref;
    	    return (ref = this.status[this._jobs[id]]) != null ? ref : null;
    	  }

    	  statusJobs(status) {
    	    var k, pos, ref, results, v;
    	    if (status != null) {
    	      pos = this.status.indexOf(status);
    	      if (pos < 0) {
    	        throw new BottleneckError$3(`status must be one of ${this.status.join(', ')}`);
    	      }
    	      ref = this._jobs;
    	      results = [];
    	      for (k in ref) {
    	        v = ref[k];
    	        if (v === pos) {
    	          results.push(k);
    	        }
    	      }
    	      return results;
    	    } else {
    	      return Object.keys(this._jobs);
    	    }
    	  }

    	  statusCounts() {
    	    return this.counts.reduce(((acc, v, i) => {
    	      acc[this.status[i]] = v;
    	      return acc;
    	    }), {});
    	  }

    	};

    	var States_1 = States;

    	var DLList$2, Sync;

    	DLList$2 = DLList_1;

    	Sync = class Sync {
    	  constructor(name, Promise) {
    	    this.schedule = this.schedule.bind(this);
    	    this.name = name;
    	    this.Promise = Promise;
    	    this._running = 0;
    	    this._queue = new DLList$2();
    	  }

    	  isEmpty() {
    	    return this._queue.length === 0;
    	  }

    	  async _tryToRun() {
    	    var args, cb, error, reject, resolve, returned, task;
    	    if ((this._running < 1) && this._queue.length > 0) {
    	      this._running++;
    	      ({task, args, resolve, reject} = this._queue.shift());
    	      cb = (await (async function() {
    	        try {
    	          returned = (await task(...args));
    	          return function() {
    	            return resolve(returned);
    	          };
    	        } catch (error1) {
    	          error = error1;
    	          return function() {
    	            return reject(error);
    	          };
    	        }
    	      })());
    	      this._running--;
    	      this._tryToRun();
    	      return cb();
    	    }
    	  }

    	  schedule(task, ...args) {
    	    var promise, reject, resolve;
    	    resolve = reject = null;
    	    promise = new this.Promise(function(_resolve, _reject) {
    	      resolve = _resolve;
    	      return reject = _reject;
    	    });
    	    this._queue.push({task, args, resolve, reject});
    	    this._tryToRun();
    	    return promise;
    	  }

    	};

    	var Sync_1 = Sync;

    	var version = "2.19.5";
    	var version$1 = {
    		version: version
    	};

    	var version$2 = /*#__PURE__*/Object.freeze({
    		version: version,
    		default: version$1
    	});

    	var require$$2 = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

    	var require$$3 = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

    	var require$$4 = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

    	var Events$2, Group, IORedisConnection$1, RedisConnection$1, Scripts$1, parser$3;

    	parser$3 = parser;

    	Events$2 = Events_1;

    	RedisConnection$1 = require$$2;

    	IORedisConnection$1 = require$$3;

    	Scripts$1 = require$$4;

    	Group = (function() {
    	  class Group {
    	    constructor(limiterOptions = {}) {
    	      this.deleteKey = this.deleteKey.bind(this);
    	      this.limiterOptions = limiterOptions;
    	      parser$3.load(this.limiterOptions, this.defaults, this);
    	      this.Events = new Events$2(this);
    	      this.instances = {};
    	      this.Bottleneck = Bottleneck_1;
    	      this._startAutoCleanup();
    	      this.sharedConnection = this.connection != null;
    	      if (this.connection == null) {
    	        if (this.limiterOptions.datastore === "redis") {
    	          this.connection = new RedisConnection$1(Object.assign({}, this.limiterOptions, {Events: this.Events}));
    	        } else if (this.limiterOptions.datastore === "ioredis") {
    	          this.connection = new IORedisConnection$1(Object.assign({}, this.limiterOptions, {Events: this.Events}));
    	        }
    	      }
    	    }

    	    key(key = "") {
    	      var ref;
    	      return (ref = this.instances[key]) != null ? ref : (() => {
    	        var limiter;
    	        limiter = this.instances[key] = new this.Bottleneck(Object.assign(this.limiterOptions, {
    	          id: `${this.id}-${key}`,
    	          timeout: this.timeout,
    	          connection: this.connection
    	        }));
    	        this.Events.trigger("created", limiter, key);
    	        return limiter;
    	      })();
    	    }

    	    async deleteKey(key = "") {
    	      var deleted, instance;
    	      instance = this.instances[key];
    	      if (this.connection) {
    	        deleted = (await this.connection.__runCommand__(['del', ...Scripts$1.allKeys(`${this.id}-${key}`)]));
    	      }
    	      if (instance != null) {
    	        delete this.instances[key];
    	        await instance.disconnect();
    	      }
    	      return (instance != null) || deleted > 0;
    	    }

    	    limiters() {
    	      var k, ref, results, v;
    	      ref = this.instances;
    	      results = [];
    	      for (k in ref) {
    	        v = ref[k];
    	        results.push({
    	          key: k,
    	          limiter: v
    	        });
    	      }
    	      return results;
    	    }

    	    keys() {
    	      return Object.keys(this.instances);
    	    }

    	    async clusterKeys() {
    	      var cursor, end, found, i, k, keys, len, next, start;
    	      if (this.connection == null) {
    	        return this.Promise.resolve(this.keys());
    	      }
    	      keys = [];
    	      cursor = null;
    	      start = `b_${this.id}-`.length;
    	      end = "_settings".length;
    	      while (cursor !== 0) {
    	        [next, found] = (await this.connection.__runCommand__(["scan", cursor != null ? cursor : 0, "match", `b_${this.id}-*_settings`, "count", 10000]));
    	        cursor = ~~next;
    	        for (i = 0, len = found.length; i < len; i++) {
    	          k = found[i];
    	          keys.push(k.slice(start, -end));
    	        }
    	      }
    	      return keys;
    	    }

    	    _startAutoCleanup() {
    	      var base;
    	      clearInterval(this.interval);
    	      return typeof (base = (this.interval = setInterval(async() => {
    	        var e, k, ref, results, time, v;
    	        time = Date.now();
    	        ref = this.instances;
    	        results = [];
    	        for (k in ref) {
    	          v = ref[k];
    	          try {
    	            if ((await v._store.__groupCheck__(time))) {
    	              results.push(this.deleteKey(k));
    	            } else {
    	              results.push(void 0);
    	            }
    	          } catch (error) {
    	            e = error;
    	            results.push(v.Events.trigger("error", e));
    	          }
    	        }
    	        return results;
    	      }, this.timeout / 2))).unref === "function" ? base.unref() : void 0;
    	    }

    	    updateSettings(options = {}) {
    	      parser$3.overwrite(options, this.defaults, this);
    	      parser$3.overwrite(options, options, this.limiterOptions);
    	      if (options.timeout != null) {
    	        return this._startAutoCleanup();
    	      }
    	    }

    	    disconnect(flush = true) {
    	      var ref;
    	      if (!this.sharedConnection) {
    	        return (ref = this.connection) != null ? ref.disconnect(flush) : void 0;
    	      }
    	    }

    	  }
    	  Group.prototype.defaults = {
    	    timeout: 1000 * 60 * 5,
    	    connection: null,
    	    Promise: Promise,
    	    id: "group-key"
    	  };

    	  return Group;

    	}).call(commonjsGlobal$1);

    	var Group_1 = Group;

    	var Batcher, Events$3, parser$4;

    	parser$4 = parser;

    	Events$3 = Events_1;

    	Batcher = (function() {
    	  class Batcher {
    	    constructor(options = {}) {
    	      this.options = options;
    	      parser$4.load(this.options, this.defaults, this);
    	      this.Events = new Events$3(this);
    	      this._arr = [];
    	      this._resetPromise();
    	      this._lastFlush = Date.now();
    	    }

    	    _resetPromise() {
    	      return this._promise = new this.Promise((res, rej) => {
    	        return this._resolve = res;
    	      });
    	    }

    	    _flush() {
    	      clearTimeout(this._timeout);
    	      this._lastFlush = Date.now();
    	      this._resolve();
    	      this.Events.trigger("batch", this._arr);
    	      this._arr = [];
    	      return this._resetPromise();
    	    }

    	    add(data) {
    	      var ret;
    	      this._arr.push(data);
    	      ret = this._promise;
    	      if (this._arr.length === this.maxSize) {
    	        this._flush();
    	      } else if ((this.maxTime != null) && this._arr.length === 1) {
    	        this._timeout = setTimeout(() => {
    	          return this._flush();
    	        }, this.maxTime);
    	      }
    	      return ret;
    	    }

    	  }
    	  Batcher.prototype.defaults = {
    	    maxTime: null,
    	    maxSize: null,
    	    Promise: Promise
    	  };

    	  return Batcher;

    	}).call(commonjsGlobal$1);

    	var Batcher_1 = Batcher;

    	var require$$4$1 = () => console.log('You must import the full version of Bottleneck in order to use this feature.');

    	var require$$8 = getCjsExportFromNamespace(version$2);

    	var Bottleneck, DEFAULT_PRIORITY$1, Events$4, Job$1, LocalDatastore$1, NUM_PRIORITIES$1, Queues$1, RedisDatastore$1, States$1, Sync$1, parser$5,
    	  splice = [].splice;

    	NUM_PRIORITIES$1 = 10;

    	DEFAULT_PRIORITY$1 = 5;

    	parser$5 = parser;

    	Queues$1 = Queues_1;

    	Job$1 = Job_1;

    	LocalDatastore$1 = LocalDatastore_1;

    	RedisDatastore$1 = require$$4$1;

    	Events$4 = Events_1;

    	States$1 = States_1;

    	Sync$1 = Sync_1;

    	Bottleneck = (function() {
    	  class Bottleneck {
    	    constructor(options = {}, ...invalid) {
    	      var storeInstanceOptions, storeOptions;
    	      this._addToQueue = this._addToQueue.bind(this);
    	      this._validateOptions(options, invalid);
    	      parser$5.load(options, this.instanceDefaults, this);
    	      this._queues = new Queues$1(NUM_PRIORITIES$1);
    	      this._scheduled = {};
    	      this._states = new States$1(["RECEIVED", "QUEUED", "RUNNING", "EXECUTING"].concat(this.trackDoneStatus ? ["DONE"] : []));
    	      this._limiter = null;
    	      this.Events = new Events$4(this);
    	      this._submitLock = new Sync$1("submit", this.Promise);
    	      this._registerLock = new Sync$1("register", this.Promise);
    	      storeOptions = parser$5.load(options, this.storeDefaults, {});
    	      this._store = (function() {
    	        if (this.datastore === "redis" || this.datastore === "ioredis" || (this.connection != null)) {
    	          storeInstanceOptions = parser$5.load(options, this.redisStoreDefaults, {});
    	          return new RedisDatastore$1(this, storeOptions, storeInstanceOptions);
    	        } else if (this.datastore === "local") {
    	          storeInstanceOptions = parser$5.load(options, this.localStoreDefaults, {});
    	          return new LocalDatastore$1(this, storeOptions, storeInstanceOptions);
    	        } else {
    	          throw new Bottleneck.prototype.BottleneckError(`Invalid datastore type: ${this.datastore}`);
    	        }
    	      }).call(this);
    	      this._queues.on("leftzero", () => {
    	        var ref;
    	        return (ref = this._store.heartbeat) != null ? typeof ref.ref === "function" ? ref.ref() : void 0 : void 0;
    	      });
    	      this._queues.on("zero", () => {
    	        var ref;
    	        return (ref = this._store.heartbeat) != null ? typeof ref.unref === "function" ? ref.unref() : void 0 : void 0;
    	      });
    	    }

    	    _validateOptions(options, invalid) {
    	      if (!((options != null) && typeof options === "object" && invalid.length === 0)) {
    	        throw new Bottleneck.prototype.BottleneckError("Bottleneck v2 takes a single object argument. Refer to https://github.com/SGrondin/bottleneck#upgrading-to-v2 if you're upgrading from Bottleneck v1.");
    	      }
    	    }

    	    ready() {
    	      return this._store.ready;
    	    }

    	    clients() {
    	      return this._store.clients;
    	    }

    	    channel() {
    	      return `b_${this.id}`;
    	    }

    	    channel_client() {
    	      return `b_${this.id}_${this._store.clientId}`;
    	    }

    	    publish(message) {
    	      return this._store.__publish__(message);
    	    }

    	    disconnect(flush = true) {
    	      return this._store.__disconnect__(flush);
    	    }

    	    chain(_limiter) {
    	      this._limiter = _limiter;
    	      return this;
    	    }

    	    queued(priority) {
    	      return this._queues.queued(priority);
    	    }

    	    clusterQueued() {
    	      return this._store.__queued__();
    	    }

    	    empty() {
    	      return this.queued() === 0 && this._submitLock.isEmpty();
    	    }

    	    running() {
    	      return this._store.__running__();
    	    }

    	    done() {
    	      return this._store.__done__();
    	    }

    	    jobStatus(id) {
    	      return this._states.jobStatus(id);
    	    }

    	    jobs(status) {
    	      return this._states.statusJobs(status);
    	    }

    	    counts() {
    	      return this._states.statusCounts();
    	    }

    	    _randomIndex() {
    	      return Math.random().toString(36).slice(2);
    	    }

    	    check(weight = 1) {
    	      return this._store.__check__(weight);
    	    }

    	    _clearGlobalState(index) {
    	      if (this._scheduled[index] != null) {
    	        clearTimeout(this._scheduled[index].expiration);
    	        delete this._scheduled[index];
    	        return true;
    	      } else {
    	        return false;
    	      }
    	    }

    	    async _free(index, job, options, eventInfo) {
    	      var e, running;
    	      try {
    	        ({running} = (await this._store.__free__(index, options.weight)));
    	        this.Events.trigger("debug", `Freed ${options.id}`, eventInfo);
    	        if (running === 0 && this.empty()) {
    	          return this.Events.trigger("idle");
    	        }
    	      } catch (error1) {
    	        e = error1;
    	        return this.Events.trigger("error", e);
    	      }
    	    }

    	    _run(index, job, wait) {
    	      var clearGlobalState, free, run;
    	      job.doRun();
    	      clearGlobalState = this._clearGlobalState.bind(this, index);
    	      run = this._run.bind(this, index, job);
    	      free = this._free.bind(this, index, job);
    	      return this._scheduled[index] = {
    	        timeout: setTimeout(() => {
    	          return job.doExecute(this._limiter, clearGlobalState, run, free);
    	        }, wait),
    	        expiration: job.options.expiration != null ? setTimeout(function() {
    	          return job.doExpire(clearGlobalState, run, free);
    	        }, wait + job.options.expiration) : void 0,
    	        job: job
    	      };
    	    }

    	    _drainOne(capacity) {
    	      return this._registerLock.schedule(() => {
    	        var args, index, next, options, queue;
    	        if (this.queued() === 0) {
    	          return this.Promise.resolve(null);
    	        }
    	        queue = this._queues.getFirst();
    	        ({options, args} = next = queue.first());
    	        if ((capacity != null) && options.weight > capacity) {
    	          return this.Promise.resolve(null);
    	        }
    	        this.Events.trigger("debug", `Draining ${options.id}`, {args, options});
    	        index = this._randomIndex();
    	        return this._store.__register__(index, options.weight, options.expiration).then(({success, wait, reservoir}) => {
    	          var empty;
    	          this.Events.trigger("debug", `Drained ${options.id}`, {success, args, options});
    	          if (success) {
    	            queue.shift();
    	            empty = this.empty();
    	            if (empty) {
    	              this.Events.trigger("empty");
    	            }
    	            if (reservoir === 0) {
    	              this.Events.trigger("depleted", empty);
    	            }
    	            this._run(index, next, wait);
    	            return this.Promise.resolve(options.weight);
    	          } else {
    	            return this.Promise.resolve(null);
    	          }
    	        });
    	      });
    	    }

    	    _drainAll(capacity, total = 0) {
    	      return this._drainOne(capacity).then((drained) => {
    	        var newCapacity;
    	        if (drained != null) {
    	          newCapacity = capacity != null ? capacity - drained : capacity;
    	          return this._drainAll(newCapacity, total + drained);
    	        } else {
    	          return this.Promise.resolve(total);
    	        }
    	      }).catch((e) => {
    	        return this.Events.trigger("error", e);
    	      });
    	    }

    	    _dropAllQueued(message) {
    	      return this._queues.shiftAll(function(job) {
    	        return job.doDrop({message});
    	      });
    	    }

    	    stop(options = {}) {
    	      var done, waitForExecuting;
    	      options = parser$5.load(options, this.stopDefaults);
    	      waitForExecuting = (at) => {
    	        var finished;
    	        finished = () => {
    	          var counts;
    	          counts = this._states.counts;
    	          return (counts[0] + counts[1] + counts[2] + counts[3]) === at;
    	        };
    	        return new this.Promise((resolve, reject) => {
    	          if (finished()) {
    	            return resolve();
    	          } else {
    	            return this.on("done", () => {
    	              if (finished()) {
    	                this.removeAllListeners("done");
    	                return resolve();
    	              }
    	            });
    	          }
    	        });
    	      };
    	      done = options.dropWaitingJobs ? (this._run = function(index, next) {
    	        return next.doDrop({
    	          message: options.dropErrorMessage
    	        });
    	      }, this._drainOne = () => {
    	        return this.Promise.resolve(null);
    	      }, this._registerLock.schedule(() => {
    	        return this._submitLock.schedule(() => {
    	          var k, ref, v;
    	          ref = this._scheduled;
    	          for (k in ref) {
    	            v = ref[k];
    	            if (this.jobStatus(v.job.options.id) === "RUNNING") {
    	              clearTimeout(v.timeout);
    	              clearTimeout(v.expiration);
    	              v.job.doDrop({
    	                message: options.dropErrorMessage
    	              });
    	            }
    	          }
    	          this._dropAllQueued(options.dropErrorMessage);
    	          return waitForExecuting(0);
    	        });
    	      })) : this.schedule({
    	        priority: NUM_PRIORITIES$1 - 1,
    	        weight: 0
    	      }, () => {
    	        return waitForExecuting(1);
    	      });
    	      this._receive = function(job) {
    	        return job._reject(new Bottleneck.prototype.BottleneckError(options.enqueueErrorMessage));
    	      };
    	      this.stop = () => {
    	        return this.Promise.reject(new Bottleneck.prototype.BottleneckError("stop() has already been called"));
    	      };
    	      return done;
    	    }

    	    async _addToQueue(job) {
    	      var args, blocked, error, options, reachedHWM, shifted, strategy;
    	      ({args, options} = job);
    	      try {
    	        ({reachedHWM, blocked, strategy} = (await this._store.__submit__(this.queued(), options.weight)));
    	      } catch (error1) {
    	        error = error1;
    	        this.Events.trigger("debug", `Could not queue ${options.id}`, {args, options, error});
    	        job.doDrop({error});
    	        return false;
    	      }
    	      if (blocked) {
    	        job.doDrop();
    	        return true;
    	      } else if (reachedHWM) {
    	        shifted = strategy === Bottleneck.prototype.strategy.LEAK ? this._queues.shiftLastFrom(options.priority) : strategy === Bottleneck.prototype.strategy.OVERFLOW_PRIORITY ? this._queues.shiftLastFrom(options.priority + 1) : strategy === Bottleneck.prototype.strategy.OVERFLOW ? job : void 0;
    	        if (shifted != null) {
    	          shifted.doDrop();
    	        }
    	        if ((shifted == null) || strategy === Bottleneck.prototype.strategy.OVERFLOW) {
    	          if (shifted == null) {
    	            job.doDrop();
    	          }
    	          return reachedHWM;
    	        }
    	      }
    	      job.doQueue(reachedHWM, blocked);
    	      this._queues.push(job);
    	      await this._drainAll();
    	      return reachedHWM;
    	    }

    	    _receive(job) {
    	      if (this._states.jobStatus(job.options.id) != null) {
    	        job._reject(new Bottleneck.prototype.BottleneckError(`A job with the same id already exists (id=${job.options.id})`));
    	        return false;
    	      } else {
    	        job.doReceive();
    	        return this._submitLock.schedule(this._addToQueue, job);
    	      }
    	    }

    	    submit(...args) {
    	      var cb, fn, job, options, ref, ref1, task;
    	      if (typeof args[0] === "function") {
    	        ref = args, [fn, ...args] = ref, [cb] = splice.call(args, -1);
    	        options = parser$5.load({}, this.jobDefaults);
    	      } else {
    	        ref1 = args, [options, fn, ...args] = ref1, [cb] = splice.call(args, -1);
    	        options = parser$5.load(options, this.jobDefaults);
    	      }
    	      task = (...args) => {
    	        return new this.Promise(function(resolve, reject) {
    	          return fn(...args, function(...args) {
    	            return (args[0] != null ? reject : resolve)(args);
    	          });
    	        });
    	      };
    	      job = new Job$1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
    	      job.promise.then(function(args) {
    	        return typeof cb === "function" ? cb(...args) : void 0;
    	      }).catch(function(args) {
    	        if (Array.isArray(args)) {
    	          return typeof cb === "function" ? cb(...args) : void 0;
    	        } else {
    	          return typeof cb === "function" ? cb(args) : void 0;
    	        }
    	      });
    	      return this._receive(job);
    	    }

    	    schedule(...args) {
    	      var job, options, task;
    	      if (typeof args[0] === "function") {
    	        [task, ...args] = args;
    	        options = {};
    	      } else {
    	        [options, task, ...args] = args;
    	      }
    	      job = new Job$1(task, args, options, this.jobDefaults, this.rejectOnDrop, this.Events, this._states, this.Promise);
    	      this._receive(job);
    	      return job.promise;
    	    }

    	    wrap(fn) {
    	      var schedule, wrapped;
    	      schedule = this.schedule.bind(this);
    	      wrapped = function(...args) {
    	        return schedule(fn.bind(this), ...args);
    	      };
    	      wrapped.withOptions = function(options, ...args) {
    	        return schedule(options, fn, ...args);
    	      };
    	      return wrapped;
    	    }

    	    async updateSettings(options = {}) {
    	      await this._store.__updateSettings__(parser$5.overwrite(options, this.storeDefaults));
    	      parser$5.overwrite(options, this.instanceDefaults, this);
    	      return this;
    	    }

    	    currentReservoir() {
    	      return this._store.__currentReservoir__();
    	    }

    	    incrementReservoir(incr = 0) {
    	      return this._store.__incrementReservoir__(incr);
    	    }

    	  }
    	  Bottleneck.default = Bottleneck;

    	  Bottleneck.Events = Events$4;

    	  Bottleneck.version = Bottleneck.prototype.version = require$$8.version;

    	  Bottleneck.strategy = Bottleneck.prototype.strategy = {
    	    LEAK: 1,
    	    OVERFLOW: 2,
    	    OVERFLOW_PRIORITY: 4,
    	    BLOCK: 3
    	  };

    	  Bottleneck.BottleneckError = Bottleneck.prototype.BottleneckError = BottleneckError_1;

    	  Bottleneck.Group = Bottleneck.prototype.Group = Group_1;

    	  Bottleneck.RedisConnection = Bottleneck.prototype.RedisConnection = require$$2;

    	  Bottleneck.IORedisConnection = Bottleneck.prototype.IORedisConnection = require$$3;

    	  Bottleneck.Batcher = Bottleneck.prototype.Batcher = Batcher_1;

    	  Bottleneck.prototype.jobDefaults = {
    	    priority: DEFAULT_PRIORITY$1,
    	    weight: 1,
    	    expiration: null,
    	    id: "<no-id>"
    	  };

    	  Bottleneck.prototype.storeDefaults = {
    	    maxConcurrent: null,
    	    minTime: 0,
    	    highWater: null,
    	    strategy: Bottleneck.prototype.strategy.LEAK,
    	    penalty: null,
    	    reservoir: null,
    	    reservoirRefreshInterval: null,
    	    reservoirRefreshAmount: null,
    	    reservoirIncreaseInterval: null,
    	    reservoirIncreaseAmount: null,
    	    reservoirIncreaseMaximum: null
    	  };

    	  Bottleneck.prototype.localStoreDefaults = {
    	    Promise: Promise,
    	    timeout: null,
    	    heartbeatInterval: 250
    	  };

    	  Bottleneck.prototype.redisStoreDefaults = {
    	    Promise: Promise,
    	    timeout: null,
    	    heartbeatInterval: 5000,
    	    clientTimeout: 10000,
    	    Redis: null,
    	    clientOptions: {},
    	    clusterNodes: null,
    	    clearDatastore: false,
    	    connection: null
    	  };

    	  Bottleneck.prototype.instanceDefaults = {
    	    datastore: "local",
    	    connection: null,
    	    id: "<no-id>",
    	    rejectOnDrop: true,
    	    trackDoneStatus: false,
    	    Promise: Promise
    	  };

    	  Bottleneck.prototype.stopDefaults = {
    	    enqueueErrorMessage: "This limiter has been stopped and cannot accept new jobs.",
    	    dropWaitingJobs: true,
    	    dropErrorMessage: "This limiter has been stopped."
    	  };

    	  return Bottleneck;

    	}).call(commonjsGlobal$1);

    	var Bottleneck_1 = Bottleneck;

    	var lib = Bottleneck_1;

    	return lib;

    })));
    });

    // @ts-ignore
    async function errorRequest(octokit, state, error, options) {
        if (!error.request || !error.request.request) {
            // address https://github.com/octokit/plugin-retry.js/issues/8
            throw error;
        }
        // retry all >= 400 && not doNotRetry
        if (error.status >= 400 && !state.doNotRetry.includes(error.status)) {
            const retries = options.request.retries != null ? options.request.retries : state.retries;
            const retryAfter = Math.pow((options.request.retryCount || 0) + 1, 2);
            throw octokit.retry.retryRequest(error, retries, retryAfter);
        }
        // Maybe eventually there will be more cases here
        throw error;
    }

    // @ts-ignore
    // @ts-ignore
    async function wrapRequest(state, request, options) {
        const limiter = new light();
        // @ts-ignore
        limiter.on("failed", function (error, info) {
            const maxRetries = ~~error.request.request.retries;
            const after = ~~error.request.request.retryAfter;
            options.request.retryCount = info.retryCount + 1;
            if (maxRetries > info.retryCount) {
                // Returning a number instructs the limiter to retry
                // the request after that number of milliseconds have passed
                return after * state.retryAfterBaseValue;
            }
        });
        return limiter.schedule(request, options);
    }

    const VERSION$8 = "3.0.9";
    function retry(octokit, octokitOptions) {
        const state = Object.assign({
            enabled: true,
            retryAfterBaseValue: 1000,
            doNotRetry: [400, 401, 403, 404, 422],
            retries: 3,
        }, octokitOptions.retry);
        if (state.enabled) {
            octokit.hook.error("request", errorRequest.bind(null, octokit, state));
            octokit.hook.wrap("request", wrapRequest.bind(null, state));
        }
        return {
            retry: {
                retryRequest: (error, retries, retryAfter) => {
                    error.request.request = Object.assign({}, error.request.request, {
                        retries: retries,
                        retryAfter: retryAfter,
                    });
                    return error;
                },
            },
        };
    }
    retry.VERSION = VERSION$8;

    var btoaBrowser = function _btoa(str) {
      return btoa(str)
    };

    function oauthAuthorizationUrl$1(options) {
        const clientType = options.clientType || "oauth-app";
        const baseUrl = options.baseUrl || "https://github.com";
        const result = {
            clientType,
            allowSignup: options.allowSignup === false ? false : true,
            clientId: options.clientId,
            login: options.login || null,
            redirectUrl: options.redirectUrl || null,
            state: options.state || Math.random().toString(36).substr(2),
            url: "",
        };
        if (clientType === "oauth-app") {
            const scopes = "scopes" in options ? options.scopes : [];
            result.scopes =
                typeof scopes === "string"
                    ? scopes.split(/[,\s]+/).filter(Boolean)
                    : scopes;
        }
        result.url = urlBuilderAuthorize(`${baseUrl}/login/oauth/authorize`, result);
        return result;
    }
    function urlBuilderAuthorize(base, options) {
        const map = {
            allowSignup: "allow_signup",
            clientId: "client_id",
            login: "login",
            redirectUrl: "redirect_uri",
            scopes: "scope",
            state: "state",
        };
        let url = base;
        Object.keys(map)
            // Filter out keys that are null and remove the url key
            .filter((k) => options[k] !== null)
            // Filter out empty scopes array
            .filter((k) => {
            if (k !== "scopes")
                return true;
            if (options.clientType === "github-app")
                return false;
            return !Array.isArray(options[k]) || options[k].length > 0;
        })
            // Map Array with the proper URL parameter names and change the value to a string using template strings
            // @ts-ignore
            .map((key) => [map[key], `${options[key]}`])
            // Finally, build the URL
            .forEach(([key, value], index) => {
            url += index === 0 ? `?` : "&";
            url += `${key}=${value}`;
        });
        return url;
    }

    var distWeb$5 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        oauthAuthorizationUrl: oauthAuthorizationUrl$1
    });

    var oauthAuthorizationUrl = /*@__PURE__*/getAugmentedNamespace(distWeb$5);

    var request = /*@__PURE__*/getAugmentedNamespace(distWeb$8);

    var requestError = /*@__PURE__*/getAugmentedNamespace(distWeb$9);

    function _interopDefault$2 (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }




    var btoa$1 = _interopDefault$2(btoaBrowser);

    const VERSION$7 = "1.2.4";

    function ownKeys$2(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);

        if (enumerableOnly) {
          symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          });
        }

        keys.push.apply(keys, symbols);
      }

      return keys;
    }

    function _objectSpread2$2(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};

        if (i % 2) {
          ownKeys$2(Object(source), true).forEach(function (key) {
            _defineProperty$2(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys$2(Object(source)).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }

      return target;
    }

    function _defineProperty$2(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    function _objectWithoutPropertiesLoose(source, excluded) {
      if (source == null) return {};
      var target = {};
      var sourceKeys = Object.keys(source);
      var key, i;

      for (i = 0; i < sourceKeys.length; i++) {
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
      }

      return target;
    }

    function _objectWithoutProperties(source, excluded) {
      if (source == null) return {};

      var target = _objectWithoutPropertiesLoose(source, excluded);

      var key, i;

      if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

        for (i = 0; i < sourceSymbolKeys.length; i++) {
          key = sourceSymbolKeys[i];
          if (excluded.indexOf(key) >= 0) continue;
          if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
          target[key] = source[key];
        }
      }

      return target;
    }

    function requestToOAuthBaseUrl(request) {
      const endpointDefaults = request.endpoint.DEFAULTS;
      return /^https:\/\/(api\.)?github\.com$/.test(endpointDefaults.baseUrl) ? "https://github.com" : endpointDefaults.baseUrl.replace("/api/v3", "");
    }
    async function oauthRequest(request, route, parameters) {
      const withOAuthParameters = _objectSpread2$2({
        baseUrl: requestToOAuthBaseUrl(request),
        headers: {
          accept: "application/json"
        }
      }, parameters);

      const response = await request(route, withOAuthParameters);

      if ("error" in response.data) {
        const error = new requestError.RequestError(`${response.data.error_description} (${response.data.error}, ${response.data.error_uri})`, 400, {
          request: request.endpoint.merge(route, withOAuthParameters),
          headers: response.headers
        }); // @ts-ignore add custom response property until https://github.com/octokit/request-error.js/issues/169 is resolved

        error.response = response;
        throw error;
      }

      return response;
    }

    const _excluded = ["request"];
    function getWebFlowAuthorizationUrl(_ref) {
      let {
        request: request$1 = request.request
      } = _ref,
          options = _objectWithoutProperties(_ref, _excluded);

      const baseUrl = requestToOAuthBaseUrl(request$1); // @ts-expect-error TypeScript wants `clientType` to be set explicitly ¯\_(ツ)_/¯

      return oauthAuthorizationUrl.oauthAuthorizationUrl(_objectSpread2$2(_objectSpread2$2({}, options), {}, {
        baseUrl
      }));
    }

    async function exchangeWebFlowCode(options) {
      const request$1 = options.request ||
      /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const response = await oauthRequest(request$1, "POST /login/oauth/access_token", {
        client_id: options.clientId,
        client_secret: options.clientSecret,
        code: options.code,
        redirect_uri: options.redirectUrl,
        state: options.state
      });
      const authentication = {
        clientType: options.clientType,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        token: response.data.access_token,
        scopes: response.data.scope.split(/\s+/).filter(Boolean)
      };

      if (options.clientType === "github-app") {
        if ("refresh_token" in response.data) {
          const apiTimeInMs = new Date(response.headers.date).getTime();
          authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp(apiTimeInMs, response.data.expires_in), authentication.refreshTokenExpiresAt = toTimestamp(apiTimeInMs, response.data.refresh_token_expires_in);
        }

        delete authentication.scopes;
      }

      return _objectSpread2$2(_objectSpread2$2({}, response), {}, {
        authentication
      });
    }

    function toTimestamp(apiTimeInMs, expirationInSeconds) {
      return new Date(apiTimeInMs + expirationInSeconds * 1000).toISOString();
    }

    async function createDeviceCode(options) {
      const request$1 = options.request ||
      /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const parameters = {
        client_id: options.clientId
      };

      if ("scopes" in options && Array.isArray(options.scopes)) {
        parameters.scope = options.scopes.join(" ");
      }

      return oauthRequest(request$1, "POST /login/device/code", parameters);
    }

    async function exchangeDeviceCode(options) {
      const request$1 = options.request ||
      /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const response = await oauthRequest(request$1, "POST /login/oauth/access_token", {
        client_id: options.clientId,
        device_code: options.code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code"
      });
      const authentication = {
        clientType: options.clientType,
        clientId: options.clientId,
        token: response.data.access_token,
        scopes: response.data.scope.split(/\s+/).filter(Boolean)
      };

      if ("clientSecret" in options) {
        authentication.clientSecret = options.clientSecret;
      }

      if (options.clientType === "github-app") {
        if ("refresh_token" in response.data) {
          const apiTimeInMs = new Date(response.headers.date).getTime();
          authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp$1(apiTimeInMs, response.data.expires_in), authentication.refreshTokenExpiresAt = toTimestamp$1(apiTimeInMs, response.data.refresh_token_expires_in);
        }

        delete authentication.scopes;
      }

      return _objectSpread2$2(_objectSpread2$2({}, response), {}, {
        authentication
      });
    }

    function toTimestamp$1(apiTimeInMs, expirationInSeconds) {
      return new Date(apiTimeInMs + expirationInSeconds * 1000).toISOString();
    }

    async function checkToken(options) {
      const request$1 = options.request ||
      /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const response = await request$1("POST /applications/{client_id}/token", {
        headers: {
          authorization: `basic ${btoa$1(`${options.clientId}:${options.clientSecret}`)}`
        },
        client_id: options.clientId,
        access_token: options.token
      });
      const authentication = {
        clientType: options.clientType,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        token: options.token,
        scopes: response.data.scopes
      };

      if (options.clientType === "github-app") {
        delete authentication.scopes;
      }

      return _objectSpread2$2(_objectSpread2$2({}, response), {}, {
        authentication
      });
    }

    async function refreshToken(options) {
      const request$1 = options.request ||
      /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const response = await oauthRequest(request$1, "POST /login/oauth/access_token", {
        client_id: options.clientId,
        client_secret: options.clientSecret,
        grant_type: "refresh_token",
        refresh_token: options.refreshToken
      });
      const apiTimeInMs = new Date(response.headers.date).getTime();
      const authentication = {
        clientType: "github-app",
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        token: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: toTimestamp$2(apiTimeInMs, response.data.expires_in),
        refreshTokenExpiresAt: toTimestamp$2(apiTimeInMs, response.data.refresh_token_expires_in)
      };
      return _objectSpread2$2(_objectSpread2$2({}, response), {}, {
        authentication
      });
    }

    function toTimestamp$2(apiTimeInMs, expirationInSeconds) {
      return new Date(apiTimeInMs + expirationInSeconds * 1000).toISOString();
    }

    const _excluded$1 = ["request", "clientType", "clientId", "clientSecret", "token"];
    async function scopeToken(options) {
      const {
        request: request$1,
        clientType,
        clientId,
        clientSecret,
        token
      } = options,
            requestOptions = _objectWithoutProperties(options, _excluded$1);

      const response = await (request$1 ||
      /* istanbul ignore next: we always pass a custom request in tests */
      request.request)("POST /applications/{client_id}/token/scoped", _objectSpread2$2({
        headers: {
          authorization: `basic ${btoa$1(`${clientId}:${clientSecret}`)}`
        },
        client_id: clientId,
        access_token: token
      }, requestOptions));
      const authentication = {
        clientType,
        clientId,
        clientSecret,
        token: response.data.token
      };
      return _objectSpread2$2(_objectSpread2$2({}, response), {}, {
        authentication
      });
    }

    async function resetToken(options) {
      const request$1 = options.request ||
      /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const auth = btoa$1(`${options.clientId}:${options.clientSecret}`);
      const response = await request$1("PATCH /applications/{client_id}/token", {
        headers: {
          authorization: `basic ${auth}`
        },
        client_id: options.clientId,
        access_token: options.token
      });
      const authentication = {
        clientType: options.clientType,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        token: response.data.token,
        scopes: response.data.scopes
      };

      if (options.clientType === "github-app") {
        delete authentication.scopes;
      }

      return _objectSpread2$2(_objectSpread2$2({}, response), {}, {
        authentication
      });
    }

    async function deleteToken(options) {
      const request$1 = options.request ||
      /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const auth = btoa$1(`${options.clientId}:${options.clientSecret}`);
      return request$1("DELETE /applications/{client_id}/token", {
        headers: {
          authorization: `basic ${auth}`
        },
        client_id: options.clientId,
        access_token: options.token
      });
    }

    async function deleteAuthorization(options) {
      const request$1 = options.request ||
      /* istanbul ignore next: we always pass a custom request in tests */
      request.request;
      const auth = btoa$1(`${options.clientId}:${options.clientSecret}`);
      return request$1("DELETE /applications/{client_id}/grant", {
        headers: {
          authorization: `basic ${auth}`
        },
        client_id: options.clientId,
        access_token: options.token
      });
    }

    var VERSION_1 = VERSION$7;
    var checkToken_1 = checkToken;
    var createDeviceCode_1 = createDeviceCode;
    var deleteAuthorization_1 = deleteAuthorization;
    var deleteToken_1 = deleteToken;
    var exchangeDeviceCode_1 = exchangeDeviceCode;
    var exchangeWebFlowCode_1 = exchangeWebFlowCode;
    var getWebFlowAuthorizationUrl_1 = getWebFlowAuthorizationUrl;
    var refreshToken_1 = refreshToken;
    var resetToken_1 = resetToken;
    var scopeToken_1 = scopeToken;


    var distNode$1 = /*#__PURE__*/Object.defineProperty({
    	VERSION: VERSION_1,
    	checkToken: checkToken_1,
    	createDeviceCode: createDeviceCode_1,
    	deleteAuthorization: deleteAuthorization_1,
    	deleteToken: deleteToken_1,
    	exchangeDeviceCode: exchangeDeviceCode_1,
    	exchangeWebFlowCode: exchangeWebFlowCode_1,
    	getWebFlowAuthorizationUrl: getWebFlowAuthorizationUrl_1,
    	refreshToken: refreshToken_1,
    	resetToken: resetToken_1,
    	scopeToken: scopeToken_1
    }, '__esModule', {value: true});

    async function getOAuthAccessToken(state, options) {
        const cachedAuthentication = getCachedAuthentication(state, options.auth);
        if (cachedAuthentication)
            return cachedAuthentication;
        // Step 1: Request device and user codes
        // https://docs.github.com/en/developers/apps/authorizing-oauth-apps#step-1-app-requests-the-device-and-user-verification-codes-from-github
        const { data: verification } = await createDeviceCode_1({
            clientType: state.clientType,
            clientId: state.clientId,
            request: options.request || state.request,
            // @ts-expect-error the extra code to make TS happy is not worth it
            scopes: options.auth.scopes || state.scopes,
        });
        // Step 2: User must enter the user code on https://github.com/login/device
        // See https://docs.github.com/en/developers/apps/authorizing-oauth-apps#step-2-prompt-the-user-to-enter-the-user-code-in-a-browser
        await state.onVerification(verification);
        // Step 3: Exchange device code for access token
        // See https://docs.github.com/en/developers/apps/authorizing-oauth-apps#step-3-app-polls-github-to-check-if-the-user-authorized-the-device
        const authentication = await waitForAccessToken(options.request || state.request, state.clientId, state.clientType, verification);
        state.authentication = authentication;
        return authentication;
    }
    function getCachedAuthentication(state, auth) {
        if (auth.refresh === true)
            return false;
        if (!state.authentication)
            return false;
        if (state.clientType === "github-app") {
            return state.authentication;
        }
        const authentication = state.authentication;
        const newScope = (("scopes" in auth && auth.scopes) || state.scopes).join(" ");
        const currentScope = authentication.scopes.join(" ");
        return newScope === currentScope ? authentication : false;
    }
    async function wait(seconds) {
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
    async function waitForAccessToken(request, clientId, clientType, verification) {
        try {
            const options = {
                clientId,
                request,
                code: verification.device_code,
            };
            // WHY TYPESCRIPT WHY ARE YOU DOING THIS TO ME
            const { authentication } = clientType === "oauth-app"
                ? await exchangeDeviceCode_1({
                    ...options,
                    clientType: "oauth-app",
                })
                : await exchangeDeviceCode_1({
                    ...options,
                    clientType: "github-app",
                });
            return {
                type: "token",
                tokenType: "oauth",
                ...authentication,
            };
        }
        catch (error) {
            // istanbul ignore if
            if (!error.response)
                throw error;
            const errorType = error.response.data.error;
            if (errorType === "authorization_pending") {
                await wait(verification.interval);
                return waitForAccessToken(request, clientId, clientType, verification);
            }
            if (errorType === "slow_down") {
                await wait(verification.interval + 5);
                return waitForAccessToken(request, clientId, clientType, verification);
            }
            throw error;
        }
    }

    async function auth$4(state, authOptions) {
        return getOAuthAccessToken(state, {
            auth: authOptions,
        });
    }

    async function hook$4(state, request, route, parameters) {
        let endpoint = request.endpoint.merge(route, parameters);
        // Do not intercept request to retrieve codes or token
        if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) {
            return request(endpoint);
        }
        const { token } = await getOAuthAccessToken(state, {
            request,
            auth: { type: "oauth" },
        });
        endpoint.headers.authorization = `token ${token}`;
        return request(endpoint);
    }

    const VERSION$6 = "3.1.2";

    function createOAuthDeviceAuth(options) {
        const requestWithDefaults = options.request ||
            request$1.defaults({
                headers: {
                    "user-agent": `octokit-auth-oauth-device.js/${VERSION$6} ${getUserAgent()}`,
                },
            });
        const { request: request$1$1 = requestWithDefaults, ...otherOptions } = options;
        const state = options.clientType === "github-app"
            ? {
                ...otherOptions,
                clientType: "github-app",
                request: request$1$1,
            }
            : {
                ...otherOptions,
                clientType: "oauth-app",
                request: request$1$1,
                scopes: options.scopes || [],
            };
        if (!options.clientId) {
            throw new Error('[@octokit/auth-oauth-device] "clientId" option must be set (https://github.com/octokit/auth-oauth-device.js#usage)');
        }
        if (!options.onVerification) {
            throw new Error('[@octokit/auth-oauth-device] "onVerification" option must be a function (https://github.com/octokit/auth-oauth-device.js#usage)');
        }
        // @ts-ignore too much for tsc / ts-jest ¯\_(ツ)_/¯
        return Object.assign(auth$4.bind(null, state), {
            hook: hook$4.bind(null, state),
        });
    }

    const VERSION$5 = "1.3.0";

    // @ts-nocheck there is only place for one of us in this file. And it's not you, TS
    async function getAuthentication(state) {
        // handle code exchange form OAuth Web Flow
        if ("code" in state.strategyOptions) {
            const { authentication } = await exchangeWebFlowCode_1({
                clientId: state.clientId,
                clientSecret: state.clientSecret,
                clientType: state.clientType,
                ...state.strategyOptions,
                request: state.request,
            });
            return {
                type: "token",
                tokenType: "oauth",
                ...authentication,
            };
        }
        // handle OAuth device flow
        if ("onVerification" in state.strategyOptions) {
            const deviceAuth = createOAuthDeviceAuth({
                clientType: state.clientType,
                clientId: state.clientId,
                ...state.strategyOptions,
                request: state.request,
            });
            const authentication = await deviceAuth({
                type: "oauth",
            });
            return {
                clientSecret: state.clientSecret,
                ...authentication,
            };
        }
        // use existing authentication
        if ("token" in state.strategyOptions) {
            return {
                type: "token",
                tokenType: "oauth",
                clientId: state.clientId,
                clientSecret: state.clientSecret,
                clientType: state.clientType,
                ...state.strategyOptions,
            };
        }
        throw new Error("[@octokit/auth-oauth-user] Invalid strategy options");
    }

    async function auth$3(state, options = {}) {
        if (!state.authentication) {
            // This is what TS makes us do ¯\_(ツ)_/¯
            state.authentication =
                state.clientType === "oauth-app"
                    ? await getAuthentication(state)
                    : await getAuthentication(state);
        }
        if (state.authentication.invalid) {
            throw new Error("[@octokit/auth-oauth-user] Token is invalid");
        }
        const currentAuthentication = state.authentication;
        // (auto) refresh for user-to-server tokens
        if ("expiresAt" in currentAuthentication) {
            if (options.type === "refresh" ||
                new Date(currentAuthentication.expiresAt) < new Date()) {
                const { authentication } = await refreshToken_1({
                    clientType: "github-app",
                    clientId: state.clientId,
                    clientSecret: state.clientSecret,
                    refreshToken: currentAuthentication.refreshToken,
                    request: state.request,
                });
                state.authentication = {
                    tokenType: "oauth",
                    type: "token",
                    ...authentication,
                };
            }
        }
        // throw error for invalid refresh call
        if (options.type === "refresh") {
            if (state.clientType === "oauth-app") {
                throw new Error("[@octokit/auth-oauth-user] OAuth Apps do not support expiring tokens");
            }
            if (!currentAuthentication.hasOwnProperty("expiresAt")) {
                throw new Error("[@octokit/auth-oauth-user] Refresh token missing");
            }
        }
        // check or reset token
        if (options.type === "check" || options.type === "reset") {
            const method = options.type === "check" ? checkToken_1 : resetToken_1;
            try {
                const { authentication } = await method({
                    // @ts-expect-error making TS happy would require unnecessary code so no
                    clientType: state.clientType,
                    clientId: state.clientId,
                    clientSecret: state.clientSecret,
                    token: state.authentication.token,
                    request: state.request,
                });
                state.authentication = {
                    tokenType: "oauth",
                    type: "token",
                    // @ts-expect-error TBD
                    ...authentication,
                };
                return state.authentication;
            }
            catch (error) {
                // istanbul ignore else
                if (error.status === 404) {
                    error.message = "[@octokit/auth-oauth-user] Token is invalid";
                    // @ts-expect-error TBD
                    state.authentication.invalid = true;
                }
                throw error;
            }
        }
        // invalidate
        if (options.type === "delete" || options.type === "deleteAuthorization") {
            const method = options.type === "delete" ? deleteToken_1 : deleteAuthorization_1;
            try {
                await method({
                    // @ts-expect-error making TS happy would require unnecessary code so no
                    clientType: state.clientType,
                    clientId: state.clientId,
                    clientSecret: state.clientSecret,
                    token: state.authentication.token,
                    request: state.request,
                });
            }
            catch (error) {
                // istanbul ignore if
                if (error.status !== 404)
                    throw error;
            }
            state.authentication.invalid = true;
            return state.authentication;
        }
        return state.authentication;
    }

    /**
     * The following endpoints require an OAuth App to authenticate using its client_id and client_secret.
     *
     * - [`POST /applications/{client_id}/token`](https://docs.github.com/en/rest/reference/apps#check-a-token) - Check a token
     * - [`PATCH /applications/{client_id}/token`](https://docs.github.com/en/rest/reference/apps#reset-a-token) - Reset a token
     * - [`POST /applications/{client_id}/token/scoped`](https://docs.github.com/en/rest/reference/apps#create-a-scoped-access-token) - Create a scoped access token
     * - [`DELETE /applications/{client_id}/token`](https://docs.github.com/en/rest/reference/apps#delete-an-app-token) - Delete an app token
     * - [`DELETE /applications/{client_id}/grant`](https://docs.github.com/en/rest/reference/apps#delete-an-app-authorization) - Delete an app authorization
     *
     * deprecated:
     *
     * - [`GET /applications/{client_id}/tokens/{access_token}`](https://docs.github.com/en/rest/reference/apps#check-an-authorization) - Check an authorization
     * - [`POST /applications/{client_id}/tokens/{access_token}`](https://docs.github.com/en/rest/reference/apps#reset-an-authorization) - Reset an authorization
     * - [`DELETE /applications/{client_id}/tokens/{access_token}`](https://docs.github.com/en/rest/reference/apps#revoke-an-authorization-for-an-application) - Revoke an authorization for an application
     * - [`DELETE /applications/{client_id}/grants/{access_token}`](https://docs.github.com/en/rest/reference/apps#revoke-a-grant-for-an-application) - Revoke a grant for an application
     */
    const ROUTES_REQUIRING_BASIC_AUTH = /\/applications\/[^/]+\/(token|grant)s?/;
    function requiresBasicAuth(url) {
        return url && ROUTES_REQUIRING_BASIC_AUTH.test(url);
    }

    async function hook$3(state, request, route, parameters = {}) {
        const endpoint = request.endpoint.merge(route, parameters);
        // Do not intercept OAuth Web/Device flow request
        if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) {
            return request(endpoint);
        }
        if (requiresBasicAuth(endpoint.url)) {
            const credentials = btoaBrowser(`${state.clientId}:${state.clientSecret}`);
            endpoint.headers.authorization = `basic ${credentials}`;
            return request(endpoint);
        }
        // TS makes us do this ¯\_(ツ)_/¯
        const { token } = state.clientType === "oauth-app"
            ? await auth$3({ ...state, request })
            : await auth$3({ ...state, request });
        endpoint.headers.authorization = "token " + token;
        return request(endpoint);
    }

    function createOAuthUserAuth({ clientId, clientSecret, clientType = "oauth-app", request: request$1$1 = request$1.defaults({
        headers: {
            "user-agent": `octokit-auth-oauth-app.js/${VERSION$5} ${getUserAgent()}`,
        },
    }), ...strategyOptions }) {
        const state = Object.assign({
            clientType,
            clientId,
            clientSecret,
            strategyOptions,
            request: request$1$1,
        });
        // @ts-expect-error not worth the extra code needed to appease TS
        return Object.assign(auth$3.bind(null, state), {
            // @ts-expect-error not worth the extra code needed to appease TS
            hook: hook$3.bind(null, state),
        });
    }
    createOAuthUserAuth.VERSION = VERSION$5;

    var distWeb$4 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        createOAuthUserAuth: createOAuthUserAuth,
        requiresBasicAuth: requiresBasicAuth
    });

    async function auth$2(state, authOptions) {
        if (authOptions.type === "oauth-app") {
            return {
                type: "oauth-app",
                clientId: state.clientId,
                clientSecret: state.clientSecret,
                clientType: state.clientType,
                headers: {
                    authorization: `basic ${btoaBrowser(`${state.clientId}:${state.clientSecret}`)}`,
                },
            };
        }
        if ("factory" in authOptions) {
            const { type, ...options } = {
                ...authOptions,
                ...state,
            };
            // @ts-expect-error TODO: `option` cannot be never, is this a bug?
            return authOptions.factory(options);
        }
        const common = {
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            request: state.request,
            ...authOptions,
        };
        // TS: Look what you made me do
        const userAuth = state.clientType === "oauth-app"
            ? await createOAuthUserAuth({
                ...common,
                clientType: state.clientType,
            })
            : await createOAuthUserAuth({
                ...common,
                clientType: state.clientType,
            });
        return userAuth();
    }

    async function hook$2(state, request, route, parameters) {
        let endpoint = request.endpoint.merge(route, parameters);
        // Do not intercept OAuth Web/Device flow request
        if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) {
            return request(endpoint);
        }
        if (state.clientType === "github-app" && !requiresBasicAuth(endpoint.url)) {
            throw new Error(`[@octokit/auth-oauth-app] GitHub Apps cannot use their client ID/secret for basic authentication for endpoints other than "/applications/{client_id}/**". "${endpoint.method} ${endpoint.url}" is not supported.`);
        }
        const credentials = btoaBrowser(`${state.clientId}:${state.clientSecret}`);
        endpoint.headers.authorization = `basic ${credentials}`;
        try {
            return await request(endpoint);
        }
        catch (error) {
            /* istanbul ignore if */
            if (error.status !== 401)
                throw error;
            error.message = `[@octokit/auth-oauth-app] "${endpoint.method} ${endpoint.url}" does not support clientId/clientSecret basic authentication.`;
            throw error;
        }
    }

    const VERSION$4 = "4.3.0";

    function createOAuthAppAuth(options) {
        const state = Object.assign({
            request: request$1.defaults({
                headers: {
                    "user-agent": `octokit-auth-oauth-app.js/${VERSION$4} ${getUserAgent()}`,
                },
            }),
            clientType: "oauth-app",
        }, options);
        // @ts-expect-error not worth the extra code to appease TS
        return Object.assign(auth$2.bind(null, state), {
            hook: hook$2.bind(null, state),
        });
    }

    var distWeb$3 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        createOAuthAppAuth: createOAuthAppAuth,
        createOAuthUserAuth: createOAuthUserAuth
    });

    function t(t,n,r,e,i,a,o){try{var u=t[a](o),c=u.value;}catch(t){return void r(t)}u.done?n(c):Promise.resolve(c).then(e,i);}function n(n){return function(){var r=this,e=arguments;return new Promise((function(i,a){var o=n.apply(r,e);function u(n){t(o,i,a,u,c,"next",n);}function c(n){t(o,i,a,u,c,"throw",n);}u(void 0);}))}}function r(t){for(var n=new ArrayBuffer(t.length),r=new Uint8Array(n),e=0,i=t.length;e<i;e++)r[e]=t.charCodeAt(e);return n}function e(t){return t.replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function i(t){return e(btoa(JSON.stringify(t)))}var a=function(){var t=n((function*(t){var{privateKey:n,payload:a}=t;if(/BEGIN RSA PRIVATE KEY/.test(n))throw new Error("[universal-github-app-jwt] Private Key is in PKCS#1 format, but only PKCS#8 is supported. See https://github.com/gr2m/universal-github-app-jwt#readme");var o,u={name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}},c=(o=n.trim().split("\n").slice(1,-1).join(""),r(atob(o))),p=yield crypto.subtle.importKey("pkcs8",c,u,!1,["sign"]),f=function(t,n){return "".concat(i(t),".").concat(i(n))}({alg:"RS256",typ:"JWT"},a),l=r(f),s=function(t){for(var n="",r=new Uint8Array(t),i=r.byteLength,a=0;a<i;a++)n+=String.fromCharCode(r[a]);return e(btoa(n))}(yield crypto.subtle.sign(u.name,p,l));return "".concat(f,".").concat(s)}));return function(n){return t.apply(this,arguments)}}();function o(t){return u.apply(this,arguments)}function u(){return (u=n((function*(t){var{id:n,privateKey:r,now:e=Math.floor(Date.now()/1e3)}=t,i=e-30,o=i+600,u={iat:i,exp:o,iss:n};return {appId:n,expiration:o,token:yield a({privateKey:r,payload:u})}}))).apply(this,arguments)}

    var iterator = function (Yallist) {
      Yallist.prototype[Symbol.iterator] = function* () {
        for (let walker = this.head; walker; walker = walker.next) {
          yield walker.value;
        }
      };
    };

    var yallist = Yallist;

    Yallist.Node = Node;
    Yallist.create = Yallist;

    function Yallist (list) {
      var self = this;
      if (!(self instanceof Yallist)) {
        self = new Yallist();
      }

      self.tail = null;
      self.head = null;
      self.length = 0;

      if (list && typeof list.forEach === 'function') {
        list.forEach(function (item) {
          self.push(item);
        });
      } else if (arguments.length > 0) {
        for (var i = 0, l = arguments.length; i < l; i++) {
          self.push(arguments[i]);
        }
      }

      return self
    }

    Yallist.prototype.removeNode = function (node) {
      if (node.list !== this) {
        throw new Error('removing node which does not belong to this list')
      }

      var next = node.next;
      var prev = node.prev;

      if (next) {
        next.prev = prev;
      }

      if (prev) {
        prev.next = next;
      }

      if (node === this.head) {
        this.head = next;
      }
      if (node === this.tail) {
        this.tail = prev;
      }

      node.list.length--;
      node.next = null;
      node.prev = null;
      node.list = null;

      return next
    };

    Yallist.prototype.unshiftNode = function (node) {
      if (node === this.head) {
        return
      }

      if (node.list) {
        node.list.removeNode(node);
      }

      var head = this.head;
      node.list = this;
      node.next = head;
      if (head) {
        head.prev = node;
      }

      this.head = node;
      if (!this.tail) {
        this.tail = node;
      }
      this.length++;
    };

    Yallist.prototype.pushNode = function (node) {
      if (node === this.tail) {
        return
      }

      if (node.list) {
        node.list.removeNode(node);
      }

      var tail = this.tail;
      node.list = this;
      node.prev = tail;
      if (tail) {
        tail.next = node;
      }

      this.tail = node;
      if (!this.head) {
        this.head = node;
      }
      this.length++;
    };

    Yallist.prototype.push = function () {
      for (var i = 0, l = arguments.length; i < l; i++) {
        push(this, arguments[i]);
      }
      return this.length
    };

    Yallist.prototype.unshift = function () {
      for (var i = 0, l = arguments.length; i < l; i++) {
        unshift(this, arguments[i]);
      }
      return this.length
    };

    Yallist.prototype.pop = function () {
      if (!this.tail) {
        return undefined
      }

      var res = this.tail.value;
      this.tail = this.tail.prev;
      if (this.tail) {
        this.tail.next = null;
      } else {
        this.head = null;
      }
      this.length--;
      return res
    };

    Yallist.prototype.shift = function () {
      if (!this.head) {
        return undefined
      }

      var res = this.head.value;
      this.head = this.head.next;
      if (this.head) {
        this.head.prev = null;
      } else {
        this.tail = null;
      }
      this.length--;
      return res
    };

    Yallist.prototype.forEach = function (fn, thisp) {
      thisp = thisp || this;
      for (var walker = this.head, i = 0; walker !== null; i++) {
        fn.call(thisp, walker.value, i, this);
        walker = walker.next;
      }
    };

    Yallist.prototype.forEachReverse = function (fn, thisp) {
      thisp = thisp || this;
      for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
        fn.call(thisp, walker.value, i, this);
        walker = walker.prev;
      }
    };

    Yallist.prototype.get = function (n) {
      for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
        // abort out of the list early if we hit a cycle
        walker = walker.next;
      }
      if (i === n && walker !== null) {
        return walker.value
      }
    };

    Yallist.prototype.getReverse = function (n) {
      for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
        // abort out of the list early if we hit a cycle
        walker = walker.prev;
      }
      if (i === n && walker !== null) {
        return walker.value
      }
    };

    Yallist.prototype.map = function (fn, thisp) {
      thisp = thisp || this;
      var res = new Yallist();
      for (var walker = this.head; walker !== null;) {
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.next;
      }
      return res
    };

    Yallist.prototype.mapReverse = function (fn, thisp) {
      thisp = thisp || this;
      var res = new Yallist();
      for (var walker = this.tail; walker !== null;) {
        res.push(fn.call(thisp, walker.value, this));
        walker = walker.prev;
      }
      return res
    };

    Yallist.prototype.reduce = function (fn, initial) {
      var acc;
      var walker = this.head;
      if (arguments.length > 1) {
        acc = initial;
      } else if (this.head) {
        walker = this.head.next;
        acc = this.head.value;
      } else {
        throw new TypeError('Reduce of empty list with no initial value')
      }

      for (var i = 0; walker !== null; i++) {
        acc = fn(acc, walker.value, i);
        walker = walker.next;
      }

      return acc
    };

    Yallist.prototype.reduceReverse = function (fn, initial) {
      var acc;
      var walker = this.tail;
      if (arguments.length > 1) {
        acc = initial;
      } else if (this.tail) {
        walker = this.tail.prev;
        acc = this.tail.value;
      } else {
        throw new TypeError('Reduce of empty list with no initial value')
      }

      for (var i = this.length - 1; walker !== null; i--) {
        acc = fn(acc, walker.value, i);
        walker = walker.prev;
      }

      return acc
    };

    Yallist.prototype.toArray = function () {
      var arr = new Array(this.length);
      for (var i = 0, walker = this.head; walker !== null; i++) {
        arr[i] = walker.value;
        walker = walker.next;
      }
      return arr
    };

    Yallist.prototype.toArrayReverse = function () {
      var arr = new Array(this.length);
      for (var i = 0, walker = this.tail; walker !== null; i++) {
        arr[i] = walker.value;
        walker = walker.prev;
      }
      return arr
    };

    Yallist.prototype.slice = function (from, to) {
      to = to || this.length;
      if (to < 0) {
        to += this.length;
      }
      from = from || 0;
      if (from < 0) {
        from += this.length;
      }
      var ret = new Yallist();
      if (to < from || to < 0) {
        return ret
      }
      if (from < 0) {
        from = 0;
      }
      if (to > this.length) {
        to = this.length;
      }
      for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
        walker = walker.next;
      }
      for (; walker !== null && i < to; i++, walker = walker.next) {
        ret.push(walker.value);
      }
      return ret
    };

    Yallist.prototype.sliceReverse = function (from, to) {
      to = to || this.length;
      if (to < 0) {
        to += this.length;
      }
      from = from || 0;
      if (from < 0) {
        from += this.length;
      }
      var ret = new Yallist();
      if (to < from || to < 0) {
        return ret
      }
      if (from < 0) {
        from = 0;
      }
      if (to > this.length) {
        to = this.length;
      }
      for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
        walker = walker.prev;
      }
      for (; walker !== null && i > from; i--, walker = walker.prev) {
        ret.push(walker.value);
      }
      return ret
    };

    Yallist.prototype.splice = function (start, deleteCount, ...nodes) {
      if (start > this.length) {
        start = this.length - 1;
      }
      if (start < 0) {
        start = this.length + start;
      }

      for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
        walker = walker.next;
      }

      var ret = [];
      for (var i = 0; walker && i < deleteCount; i++) {
        ret.push(walker.value);
        walker = this.removeNode(walker);
      }
      if (walker === null) {
        walker = this.tail;
      }

      if (walker !== this.head && walker !== this.tail) {
        walker = walker.prev;
      }

      for (var i = 0; i < nodes.length; i++) {
        walker = insert$1(this, walker, nodes[i]);
      }
      return ret;
    };

    Yallist.prototype.reverse = function () {
      var head = this.head;
      var tail = this.tail;
      for (var walker = head; walker !== null; walker = walker.prev) {
        var p = walker.prev;
        walker.prev = walker.next;
        walker.next = p;
      }
      this.head = tail;
      this.tail = head;
      return this
    };

    function insert$1 (self, node, value) {
      var inserted = node === self.head ?
        new Node(value, null, node, self) :
        new Node(value, node, node.next, self);

      if (inserted.next === null) {
        self.tail = inserted;
      }
      if (inserted.prev === null) {
        self.head = inserted;
      }

      self.length++;

      return inserted
    }

    function push (self, item) {
      self.tail = new Node(item, self.tail, null, self);
      if (!self.head) {
        self.head = self.tail;
      }
      self.length++;
    }

    function unshift (self, item) {
      self.head = new Node(item, null, self.head, self);
      if (!self.tail) {
        self.tail = self.head;
      }
      self.length++;
    }

    function Node (value, prev, next, list) {
      if (!(this instanceof Node)) {
        return new Node(value, prev, next, list)
      }

      this.list = list;
      this.value = value;

      if (prev) {
        prev.next = this;
        this.prev = prev;
      } else {
        this.prev = null;
      }

      if (next) {
        next.prev = this;
        this.next = next;
      } else {
        this.next = null;
      }
    }

    try {
      // add if support for Symbol.iterator is present
      iterator(Yallist);
    } catch (er) {}

    // A linked list to keep track of recently-used-ness


    const MAX = Symbol('max');
    const LENGTH = Symbol('length');
    const LENGTH_CALCULATOR = Symbol('lengthCalculator');
    const ALLOW_STALE = Symbol('allowStale');
    const MAX_AGE = Symbol('maxAge');
    const DISPOSE = Symbol('dispose');
    const NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet');
    const LRU_LIST = Symbol('lruList');
    const CACHE = Symbol('cache');
    const UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet');

    const naiveLength = () => 1;

    // lruList is a yallist where the head is the youngest
    // item, and the tail is the oldest.  the list contains the Hit
    // objects as the entries.
    // Each Hit object has a reference to its Yallist.Node.  This
    // never changes.
    //
    // cache is a Map (or PseudoMap) that matches the keys to
    // the Yallist.Node object.
    class LRUCache {
      constructor (options) {
        if (typeof options === 'number')
          options = { max: options };

        if (!options)
          options = {};

        if (options.max && (typeof options.max !== 'number' || options.max < 0))
          throw new TypeError('max must be a non-negative number')
        // Kind of weird to have a default max of Infinity, but oh well.
        this[MAX] = options.max || Infinity;

        const lc = options.length || naiveLength;
        this[LENGTH_CALCULATOR] = (typeof lc !== 'function') ? naiveLength : lc;
        this[ALLOW_STALE] = options.stale || false;
        if (options.maxAge && typeof options.maxAge !== 'number')
          throw new TypeError('maxAge must be a number')
        this[MAX_AGE] = options.maxAge || 0;
        this[DISPOSE] = options.dispose;
        this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
        this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
        this.reset();
      }

      // resize the cache when the max changes.
      set max (mL) {
        if (typeof mL !== 'number' || mL < 0)
          throw new TypeError('max must be a non-negative number')

        this[MAX] = mL || Infinity;
        trim(this);
      }
      get max () {
        return this[MAX]
      }

      set allowStale (allowStale) {
        this[ALLOW_STALE] = !!allowStale;
      }
      get allowStale () {
        return this[ALLOW_STALE]
      }

      set maxAge (mA) {
        if (typeof mA !== 'number')
          throw new TypeError('maxAge must be a non-negative number')

        this[MAX_AGE] = mA;
        trim(this);
      }
      get maxAge () {
        return this[MAX_AGE]
      }

      // resize the cache when the lengthCalculator changes.
      set lengthCalculator (lC) {
        if (typeof lC !== 'function')
          lC = naiveLength;

        if (lC !== this[LENGTH_CALCULATOR]) {
          this[LENGTH_CALCULATOR] = lC;
          this[LENGTH] = 0;
          this[LRU_LIST].forEach(hit => {
            hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key);
            this[LENGTH] += hit.length;
          });
        }
        trim(this);
      }
      get lengthCalculator () { return this[LENGTH_CALCULATOR] }

      get length () { return this[LENGTH] }
      get itemCount () { return this[LRU_LIST].length }

      rforEach (fn, thisp) {
        thisp = thisp || this;
        for (let walker = this[LRU_LIST].tail; walker !== null;) {
          const prev = walker.prev;
          forEachStep(this, fn, walker, thisp);
          walker = prev;
        }
      }

      forEach (fn, thisp) {
        thisp = thisp || this;
        for (let walker = this[LRU_LIST].head; walker !== null;) {
          const next = walker.next;
          forEachStep(this, fn, walker, thisp);
          walker = next;
        }
      }

      keys () {
        return this[LRU_LIST].toArray().map(k => k.key)
      }

      values () {
        return this[LRU_LIST].toArray().map(k => k.value)
      }

      reset () {
        if (this[DISPOSE] &&
            this[LRU_LIST] &&
            this[LRU_LIST].length) {
          this[LRU_LIST].forEach(hit => this[DISPOSE](hit.key, hit.value));
        }

        this[CACHE] = new Map(); // hash of items by key
        this[LRU_LIST] = new yallist(); // list of items in order of use recency
        this[LENGTH] = 0; // length of items in the list
      }

      dump () {
        return this[LRU_LIST].map(hit =>
          isStale(this, hit) ? false : {
            k: hit.key,
            v: hit.value,
            e: hit.now + (hit.maxAge || 0)
          }).toArray().filter(h => h)
      }

      dumpLru () {
        return this[LRU_LIST]
      }

      set (key, value, maxAge) {
        maxAge = maxAge || this[MAX_AGE];

        if (maxAge && typeof maxAge !== 'number')
          throw new TypeError('maxAge must be a number')

        const now = maxAge ? Date.now() : 0;
        const len = this[LENGTH_CALCULATOR](value, key);

        if (this[CACHE].has(key)) {
          if (len > this[MAX]) {
            del(this, this[CACHE].get(key));
            return false
          }

          const node = this[CACHE].get(key);
          const item = node.value;

          // dispose of the old one before overwriting
          // split out into 2 ifs for better coverage tracking
          if (this[DISPOSE]) {
            if (!this[NO_DISPOSE_ON_SET])
              this[DISPOSE](key, item.value);
          }

          item.now = now;
          item.maxAge = maxAge;
          item.value = value;
          this[LENGTH] += len - item.length;
          item.length = len;
          this.get(key);
          trim(this);
          return true
        }

        const hit = new Entry(key, value, len, now, maxAge);

        // oversized objects fall out of cache automatically.
        if (hit.length > this[MAX]) {
          if (this[DISPOSE])
            this[DISPOSE](key, value);

          return false
        }

        this[LENGTH] += hit.length;
        this[LRU_LIST].unshift(hit);
        this[CACHE].set(key, this[LRU_LIST].head);
        trim(this);
        return true
      }

      has (key) {
        if (!this[CACHE].has(key)) return false
        const hit = this[CACHE].get(key).value;
        return !isStale(this, hit)
      }

      get (key) {
        return get$1(this, key, true)
      }

      peek (key) {
        return get$1(this, key, false)
      }

      pop () {
        const node = this[LRU_LIST].tail;
        if (!node)
          return null

        del(this, node);
        return node.value
      }

      del (key) {
        del(this, this[CACHE].get(key));
      }

      load (arr) {
        // reset the cache
        this.reset();

        const now = Date.now();
        // A previous serialized cache has the most recent items first
        for (let l = arr.length - 1; l >= 0; l--) {
          const hit = arr[l];
          const expiresAt = hit.e || 0;
          if (expiresAt === 0)
            // the item was created without expiration in a non aged cache
            this.set(hit.k, hit.v);
          else {
            const maxAge = expiresAt - now;
            // dont add already expired items
            if (maxAge > 0) {
              this.set(hit.k, hit.v, maxAge);
            }
          }
        }
      }

      prune () {
        this[CACHE].forEach((value, key) => get$1(this, key, false));
      }
    }

    const get$1 = (self, key, doUse) => {
      const node = self[CACHE].get(key);
      if (node) {
        const hit = node.value;
        if (isStale(self, hit)) {
          del(self, node);
          if (!self[ALLOW_STALE])
            return undefined
        } else {
          if (doUse) {
            if (self[UPDATE_AGE_ON_GET])
              node.value.now = Date.now();
            self[LRU_LIST].unshiftNode(node);
          }
        }
        return hit.value
      }
    };

    const isStale = (self, hit) => {
      if (!hit || (!hit.maxAge && !self[MAX_AGE]))
        return false

      const diff = Date.now() - hit.now;
      return hit.maxAge ? diff > hit.maxAge
        : self[MAX_AGE] && (diff > self[MAX_AGE])
    };

    const trim = self => {
      if (self[LENGTH] > self[MAX]) {
        for (let walker = self[LRU_LIST].tail;
          self[LENGTH] > self[MAX] && walker !== null;) {
          // We know that we're about to delete this one, and also
          // what the next least recently used key will be, so just
          // go ahead and set it now.
          const prev = walker.prev;
          del(self, walker);
          walker = prev;
        }
      }
    };

    const del = (self, node) => {
      if (node) {
        const hit = node.value;
        if (self[DISPOSE])
          self[DISPOSE](hit.key, hit.value);

        self[LENGTH] -= hit.length;
        self[CACHE].delete(hit.key);
        self[LRU_LIST].removeNode(node);
      }
    };

    class Entry {
      constructor (key, value, length, now, maxAge) {
        this.key = key;
        this.value = value;
        this.length = length;
        this.now = now;
        this.maxAge = maxAge || 0;
      }
    }

    const forEachStep = (self, fn, node, thisp) => {
      let hit = node.value;
      if (isStale(self, hit)) {
        del(self, node);
        if (!self[ALLOW_STALE])
          hit = undefined;
      }
      if (hit)
        fn.call(thisp, hit.value, hit.key, self);
    };

    var lruCache = LRUCache;

    async function getAppAuthentication({ appId, privateKey, timeDifference, }) {
        const appAuthentication = await o({
            id: +appId,
            privateKey,
            now: timeDifference && Math.floor(Date.now() / 1000) + timeDifference,
        });
        return {
            type: "app",
            token: appAuthentication.token,
            appId: appAuthentication.appId,
            expiresAt: new Date(appAuthentication.expiration * 1000).toISOString(),
        };
    }

    // https://github.com/isaacs/node-lru-cache#readme
    function getCache() {
        return new lruCache({
            // cache max. 15000 tokens, that will use less than 10mb memory
            max: 15000,
            // Cache for 1 minute less than GitHub expiry
            maxAge: 1000 * 60 * 59,
        });
    }
    async function get(cache, options) {
        const cacheKey = optionsToCacheKey(options);
        const result = await cache.get(cacheKey);
        if (!result) {
            return;
        }
        const [token, createdAt, expiresAt, repositorySelection, permissionsString, singleFileName,] = result.split("|");
        const permissions = options.permissions ||
            permissionsString.split(/,/).reduce((permissions, string) => {
                if (/!$/.test(string)) {
                    permissions[string.slice(0, -1)] = "write";
                }
                else {
                    permissions[string] = "read";
                }
                return permissions;
            }, {});
        return {
            token,
            createdAt,
            expiresAt,
            permissions,
            repositoryIds: options.repositoryIds,
            repositoryNames: options.repositoryNames,
            singleFileName,
            repositorySelection: repositorySelection,
        };
    }
    async function set(cache, options, data) {
        const key = optionsToCacheKey(options);
        const permissionsString = options.permissions
            ? ""
            : Object.keys(data.permissions)
                .map((name) => `${name}${data.permissions[name] === "write" ? "!" : ""}`)
                .join(",");
        const value = [
            data.token,
            data.createdAt,
            data.expiresAt,
            data.repositorySelection,
            permissionsString,
            data.singleFileName,
        ].join("|");
        await cache.set(key, value);
    }
    function optionsToCacheKey({ installationId, permissions = {}, repositoryIds = [], repositoryNames = [], }) {
        const permissionsString = Object.keys(permissions)
            .sort()
            .map((name) => (permissions[name] === "read" ? name : `${name}!`))
            .join(",");
        const repositoryIdsString = repositoryIds.sort().join(",");
        const repositoryNamesString = repositoryNames.join(",");
        return [
            installationId,
            repositoryIdsString,
            repositoryNamesString,
            permissionsString,
        ]
            .filter(Boolean)
            .join("|");
    }

    function toTokenAuthentication({ installationId, token, createdAt, expiresAt, repositorySelection, permissions, repositoryIds, repositoryNames, singleFileName, }) {
        return Object.assign({
            type: "token",
            tokenType: "installation",
            token,
            installationId,
            permissions,
            createdAt,
            expiresAt,
            repositorySelection,
        }, repositoryIds ? { repositoryIds } : null, repositoryNames ? { repositoryNames } : null, singleFileName ? { singleFileName } : null);
    }

    async function getInstallationAuthentication(state, options, customRequest) {
        const installationId = Number(options.installationId || state.installationId);
        if (!installationId) {
            throw new Error("[@octokit/auth-app] installationId option is required for installation authentication.");
        }
        if (options.factory) {
            const { type, factory, oauthApp, ...factoryAuthOptions } = {
                ...state,
                ...options,
            };
            // @ts-expect-error if `options.factory` is set, the return type for `auth()` should be `Promise<ReturnType<options.factory>>`
            return factory(factoryAuthOptions);
        }
        const optionsWithInstallationTokenFromState = Object.assign({ installationId }, options);
        if (!options.refresh) {
            const result = await get(state.cache, optionsWithInstallationTokenFromState);
            if (result) {
                const { token, createdAt, expiresAt, permissions, repositoryIds, repositoryNames, singleFileName, repositorySelection, } = result;
                return toTokenAuthentication({
                    installationId,
                    token,
                    createdAt,
                    expiresAt,
                    permissions,
                    repositorySelection,
                    repositoryIds,
                    repositoryNames,
                    singleFileName,
                });
            }
        }
        const appAuthentication = await getAppAuthentication(state);
        const request = customRequest || state.request;
        const { data: { token, expires_at: expiresAt, repositories, permissions, 
        // @ts-ignore
        repository_selection: repositorySelection, 
        // @ts-ignore
        single_file: singleFileName, }, } = await request("POST /app/installations/{installation_id}/access_tokens", {
            installation_id: installationId,
            repository_ids: options.repositoryIds,
            repositories: options.repositoryNames,
            permissions: options.permissions,
            mediaType: {
                previews: ["machine-man"],
            },
            headers: {
                authorization: `bearer ${appAuthentication.token}`,
            },
        });
        const repositoryIds = repositories
            ? repositories.map((r) => r.id)
            : void 0;
        const repositoryNames = repositories
            ? repositories.map((repo) => repo.name)
            : void 0;
        const createdAt = new Date().toISOString();
        await set(state.cache, optionsWithInstallationTokenFromState, {
            token,
            createdAt,
            expiresAt,
            repositorySelection,
            permissions,
            repositoryIds,
            repositoryNames,
            singleFileName,
        });
        return toTokenAuthentication({
            installationId,
            token,
            createdAt,
            expiresAt,
            repositorySelection,
            permissions,
            repositoryIds,
            repositoryNames,
            singleFileName,
        });
    }

    async function auth$1(state, authOptions) {
        switch (authOptions.type) {
            case "app":
                return getAppAuthentication(state);
            // @ts-expect-error "oauth" is not supperted in types
            case "oauth":
                state.log.warn(
                // @ts-expect-error `log.warn()` expects string
                new Deprecation(`[@octokit/auth-app] {type: "oauth"} is deprecated. Use {type: "oauth-app"} instead`));
            case "oauth-app":
                return state.oauthApp({ type: "oauth-app" });
            case "installation":
                return getInstallationAuthentication(state, {
                    ...authOptions,
                    type: "installation",
                });
            case "oauth-user":
                // @ts-expect-error TODO: infer correct auth options type based on type. authOptions should be typed as "WebFlowAuthOptions | OAuthAppDeviceFlowAuthOptions | GitHubAppDeviceFlowAuthOptions"
                return state.oauthApp(authOptions);
            default:
                // @ts-expect-error type is "never" at this point
                throw new Error(`Invalid auth type: ${authOptions.type}`);
        }
    }

    const PATHS = [
        "/app",
        "/app/hook/config",
        "/app/hook/deliveries",
        "/app/hook/deliveries/{delivery_id}",
        "/app/hook/deliveries/{delivery_id}/attempts",
        "/app/installations",
        "/app/installations/{installation_id}",
        "/app/installations/{installation_id}/access_tokens",
        "/app/installations/{installation_id}/suspended",
        "/marketplace_listing/accounts/{account_id}",
        "/marketplace_listing/plan",
        "/marketplace_listing/plans",
        "/marketplace_listing/plans/{plan_id}/accounts",
        "/marketplace_listing/stubbed/accounts/{account_id}",
        "/marketplace_listing/stubbed/plan",
        "/marketplace_listing/stubbed/plans",
        "/marketplace_listing/stubbed/plans/{plan_id}/accounts",
        "/orgs/{org}/installation",
        "/repos/{owner}/{repo}/installation",
        "/users/{username}/installation",
    ];
    // CREDIT: Simon Grondin (https://github.com/SGrondin)
    // https://github.com/octokit/plugin-throttling.js/blob/45c5d7f13b8af448a9dbca468d9c9150a73b3948/lib/route-matcher.js
    function routeMatcher(paths) {
        // EXAMPLE. For the following paths:
        /* [
            "/orgs/{org}/invitations",
            "/repos/{owner}/{repo}/collaborators/{username}"
        ] */
        const regexes = paths.map((p) => p
            .split("/")
            .map((c) => (c.startsWith("{") ? "(?:.+?)" : c))
            .join("/"));
        // 'regexes' would contain:
        /* [
            '/orgs/(?:.+?)/invitations',
            '/repos/(?:.+?)/(?:.+?)/collaborators/(?:.+?)'
        ] */
        const regex = `^(?:${regexes.map((r) => `(?:${r})`).join("|")})[^/]*$`;
        // 'regex' would contain:
        /*
          ^(?:(?:\/orgs\/(?:.+?)\/invitations)|(?:\/repos\/(?:.+?)\/(?:.+?)\/collaborators\/(?:.+?)))[^\/]*$
      
          It may look scary, but paste it into https://www.debuggex.com/
          and it will make a lot more sense!
        */
        return new RegExp(regex, "i");
    }
    const REGEX = routeMatcher(PATHS);
    function requiresAppAuth(url) {
        return !!url && REGEX.test(url);
    }

    const FIVE_SECONDS_IN_MS = 5 * 1000;
    function isNotTimeSkewError(error) {
        return !(error.message.match(/'Expiration time' claim \('exp'\) must be a numeric value representing the future time at which the assertion expires/) ||
            error.message.match(/'Issued at' claim \('iat'\) must be an Integer representing the time that the assertion was issued/));
    }
    async function hook$1(state, request, route, parameters) {
        const endpoint = request.endpoint.merge(route, parameters);
        const url = endpoint.url;
        // Do not intercept request to retrieve a new token
        if (/\/login\/oauth\/access_token$/.test(url)) {
            return request(endpoint);
        }
        if (requiresAppAuth(url.replace(request.endpoint.DEFAULTS.baseUrl, ""))) {
            const { token } = await getAppAuthentication(state);
            endpoint.headers.authorization = `bearer ${token}`;
            let response;
            try {
                response = await request(endpoint);
            }
            catch (error) {
                // If there's an issue with the expiration, regenerate the token and try again.
                // Otherwise rethrow the error for upstream handling.
                if (isNotTimeSkewError(error)) {
                    throw error;
                }
                // If the date header is missing, we can't correct the system time skew.
                // Throw the error to be handled upstream.
                if (typeof error.response.headers.date === "undefined") {
                    throw error;
                }
                const diff = Math.floor((Date.parse(error.response.headers.date) -
                    Date.parse(new Date().toString())) /
                    1000);
                state.log.warn(error.message);
                state.log.warn(`[@octokit/auth-app] GitHub API time and system time are different by ${diff} seconds. Retrying request with the difference accounted for.`);
                const { token } = await getAppAuthentication({
                    ...state,
                    timeDifference: diff,
                });
                endpoint.headers.authorization = `bearer ${token}`;
                return request(endpoint);
            }
            return response;
        }
        if (requiresBasicAuth(url)) {
            const authentication = await state.oauthApp({ type: "oauth-app" });
            endpoint.headers.authorization = authentication.headers.authorization;
            return request(endpoint);
        }
        const { token, createdAt } = await getInstallationAuthentication(state, 
        // @ts-expect-error TBD
        {}, request);
        endpoint.headers.authorization = `token ${token}`;
        return sendRequestWithRetries(state, request, endpoint, createdAt);
    }
    /**
     * Newly created tokens might not be accessible immediately after creation.
     * In case of a 401 response, we retry with an exponential delay until more
     * than five seconds pass since the creation of the token.
     *
     * @see https://github.com/octokit/auth-app.js/issues/65
     */
    async function sendRequestWithRetries(state, request, options, createdAt, retries = 0) {
        const timeSinceTokenCreationInMs = +new Date() - +new Date(createdAt);
        try {
            return await request(options);
        }
        catch (error) {
            if (error.status !== 401) {
                throw error;
            }
            if (timeSinceTokenCreationInMs >= FIVE_SECONDS_IN_MS) {
                if (retries > 0) {
                    error.message = `After ${retries} retries within ${timeSinceTokenCreationInMs / 1000}s of creating the installation access token, the response remains 401. At this point, the cause may be an authentication problem or a system outage. Please check https://www.githubstatus.com for status information`;
                }
                throw error;
            }
            ++retries;
            const awaitTime = retries * 1000;
            state.log.warn(`[@octokit/auth-app] Retrying after 401 response to account for token replication delay (retry: ${retries}, wait: ${awaitTime / 1000}s)`);
            await new Promise((resolve) => setTimeout(resolve, awaitTime));
            return sendRequestWithRetries(state, request, options, createdAt, retries);
        }
    }

    const VERSION$3 = "3.5.3";

    function createAppAuth(options) {
        if (!options.appId) {
            throw new Error("[@octokit/auth-app] appId option is required");
        }
        if (!options.privateKey) {
            throw new Error("[@octokit/auth-app] privateKey option is required");
        }
        if ("installationId" in options && !options.installationId) {
            throw new Error("[@octokit/auth-app] installationId is set to a falsy value");
        }
        const log = Object.assign({
            warn: console.warn.bind(console),
        }, options.log);
        const request$1$1 = options.request ||
            request$1.defaults({
                headers: {
                    "user-agent": `octokit-auth-app.js/${VERSION$3} ${getUserAgent()}`,
                },
            });
        const state = Object.assign({
            request: request$1$1,
            cache: getCache(),
        }, options, options.installationId
            ? { installationId: Number(options.installationId) }
            : {}, {
            log,
            oauthApp: createOAuthAppAuth({
                clientType: "github-app",
                clientId: options.clientId || "",
                clientSecret: options.clientSecret || "",
                request: request$1$1,
            }),
        });
        // @ts-expect-error not worth the extra code to appease TS
        return Object.assign(auth$1.bind(null, state), {
            hook: hook$1.bind(null, state),
        });
    }

    var distWeb$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        createAppAuth: createAppAuth,
        createOAuthUserAuth: createOAuthUserAuth
    });

    async function auth(reason) {
        return {
            type: "unauthenticated",
            reason,
        };
    }

    function isRateLimitError(error) {
        if (error.status !== 403) {
            return false;
        }
        /* istanbul ignore if */
        if (!error.response) {
            return false;
        }
        return error.response.headers["x-ratelimit-remaining"] === "0";
    }

    const REGEX_ABUSE_LIMIT_MESSAGE = /\babuse\b/i;
    function isAbuseLimitError(error) {
        if (error.status !== 403) {
            return false;
        }
        return REGEX_ABUSE_LIMIT_MESSAGE.test(error.message);
    }

    async function hook(reason, request, route, parameters) {
        const endpoint = request.endpoint.merge(route, parameters);
        return request(endpoint).catch((error) => {
            if (error.status === 404) {
                error.message = `Not found. May be due to lack of authentication. Reason: ${reason}`;
                throw error;
            }
            if (isRateLimitError(error)) {
                error.message = `API rate limit exceeded. This maybe caused by the lack of authentication. Reason: ${reason}`;
                throw error;
            }
            if (isAbuseLimitError(error)) {
                error.message = `You have triggered an abuse detection mechanism. This maybe caused by the lack of authentication. Reason: ${reason}`;
                throw error;
            }
            if (error.status === 401) {
                error.message = `Unauthorized. "${endpoint.method} ${endpoint.url}" failed most likely due to lack of authentication. Reason: ${reason}`;
                throw error;
            }
            if (error.status >= 400 && error.status < 500) {
                error.message = error.message.replace(/\.?$/, `. May be caused by lack of authentication (${reason}).`);
            }
            throw error;
        });
    }

    const createUnauthenticatedAuth = function createUnauthenticatedAuth(options) {
        if (!options || !options.reason) {
            throw new Error("[@octokit/auth-unauthenticated] No reason passed to createUnauthenticatedAuth");
        }
        return Object.assign(auth.bind(null, options.reason), {
            hook: hook.bind(null, options.reason),
        });
    };

    var distWeb$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        createUnauthenticatedAuth: createUnauthenticatedAuth
    });

    /*! fromentries. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
    var fromentries = function fromEntries (iterable) {
      return [...iterable].reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj
      }, {})
    };

    var OAuthAppAuth = /*@__PURE__*/getAugmentedNamespace(distWeb$3);

    var core = /*@__PURE__*/getAugmentedNamespace(distWeb$7);

    var universalUserAgent = /*@__PURE__*/getAugmentedNamespace(distWeb$a);

    var authOauthUser = /*@__PURE__*/getAugmentedNamespace(distWeb$4);

    var OAuthMethods = distNode$1;

    var authUnauthenticated = /*@__PURE__*/getAugmentedNamespace(distWeb$1);

    function _interopDefault$1 (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }







    var fromEntries = _interopDefault$1(fromentries);

    function ownKeys$1(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);

        if (enumerableOnly) {
          symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          });
        }

        keys.push.apply(keys, symbols);
      }

      return keys;
    }

    function _objectSpread2$1(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};

        if (i % 2) {
          ownKeys$1(Object(source), true).forEach(function (key) {
            _defineProperty$1(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys$1(Object(source)).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }

      return target;
    }

    function _defineProperty$1(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    const VERSION$2 = "3.3.5";

    function addEventHandler(state, eventName, eventHandler) {
      if (Array.isArray(eventName)) {
        for (const singleEventName of eventName) {
          addEventHandler(state, singleEventName, eventHandler);
        }

        return;
      }

      if (!state.eventHandlers[eventName]) {
        state.eventHandlers[eventName] = [];
      }

      state.eventHandlers[eventName].push(eventHandler);
    }

    const OAuthAppOctokit = core.Octokit.defaults({
      userAgent: `octokit-oauth-app.js/${VERSION$2} ${universalUserAgent.getUserAgent()}`
    });

    async function emitEvent(state, context) {
      const {
        name,
        action
      } = context;

      if (state.eventHandlers[`${name}.${action}`]) {
        for (const eventHandler of state.eventHandlers[`${name}.${action}`]) {
          await eventHandler(context);
        }
      }

      if (state.eventHandlers[name]) {
        for (const eventHandler of state.eventHandlers[name]) {
          await eventHandler(context);
        }
      }
    }

    async function getUserOctokitWithState(state, options) {
      return state.octokit.auth(_objectSpread2$1(_objectSpread2$1({
        type: "oauth-user"
      }, options), {}, {
        async factory(options) {
          const octokit = new state.Octokit({
            authStrategy: authOauthUser.createOAuthUserAuth,
            auth: options
          });
          const authentication = await octokit.auth({
            type: "get"
          });
          await emitEvent(state, {
            name: "token",
            action: "created",
            token: authentication.token,
            scopes: authentication.scopes,
            authentication,
            octokit
          });
          return octokit;
        }

      }));
    }

    function getWebFlowAuthorizationUrlWithState(state, options) {
      const optionsWithDefaults = _objectSpread2$1(_objectSpread2$1({
        clientId: state.clientId,
        request: state.octokit.request
      }, options), {}, {
        allowSignup: options.allowSignup || state.allowSignup,
        scopes: options.scopes || state.defaultScopes
      });

      return OAuthMethods.getWebFlowAuthorizationUrl(_objectSpread2$1({
        clientType: state.clientType
      }, optionsWithDefaults));
    }

    async function createTokenWithState(state, options) {
      const authentication = await state.octokit.auth(_objectSpread2$1({
        type: "oauth-user"
      }, options));
      await emitEvent(state, {
        name: "token",
        action: "created",
        token: authentication.token,
        scopes: authentication.scopes,
        authentication,
        octokit: new state.Octokit({
          authStrategy: OAuthAppAuth.createOAuthUserAuth,
          auth: {
            clientType: state.clientType,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            token: authentication.token,
            scopes: authentication.scopes,
            refreshToken: authentication.refreshToken,
            expiresAt: authentication.expiresAt,
            refreshTokenExpiresAt: authentication.refreshTokenExpiresAt
          }
        })
      });
      return {
        authentication
      };
    }

    async function checkTokenWithState(state, options) {
      return await OAuthMethods.checkToken(_objectSpread2$1({
        // @ts-expect-error not worth the extra code to appease TS
        clientType: state.clientType,
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request
      }, options));
    }

    async function resetTokenWithState(state, options) {
      const optionsWithDefaults = _objectSpread2$1({
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request
      }, options);

      if (state.clientType === "oauth-app") {
        const response = await OAuthMethods.resetToken(_objectSpread2$1({
          clientType: "oauth-app"
        }, optionsWithDefaults));
        await emitEvent(state, {
          name: "token",
          action: "reset",
          token: response.authentication.token,
          scopes: response.authentication.scopes || undefined,
          authentication: _objectSpread2$1({
            type: "token",
            tokenType: "oauth"
          }, response.authentication),
          octokit: new state.Octokit({
            authStrategy: authOauthUser.createOAuthUserAuth,
            auth: {
              clientType: state.clientType,
              clientId: state.clientId,
              clientSecret: state.clientSecret,
              token: response.authentication.token,
              scopes: response.authentication.scopes
            }
          })
        });
        return response;
      }

      const response = await OAuthMethods.resetToken(_objectSpread2$1({
        clientType: "github-app"
      }, optionsWithDefaults));
      await emitEvent(state, {
        name: "token",
        action: "reset",
        token: response.authentication.token,
        authentication: _objectSpread2$1({
          type: "token",
          tokenType: "oauth"
        }, response.authentication),
        octokit: new state.Octokit({
          authStrategy: authOauthUser.createOAuthUserAuth,
          auth: {
            clientType: state.clientType,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            token: response.authentication.token
          }
        })
      });
      return response;
    }

    async function refreshTokenWithState(state, options) {
      if (state.clientType === "oauth-app") {
        throw new Error("[@octokit/oauth-app] app.refreshToken() is not supported for OAuth Apps");
      }

      const response = await OAuthMethods.refreshToken({
        clientType: "github-app",
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request,
        refreshToken: options.refreshToken
      });
      await emitEvent(state, {
        name: "token",
        action: "refreshed",
        token: response.authentication.token,
        authentication: _objectSpread2$1({
          type: "token",
          tokenType: "oauth"
        }, response.authentication),
        octokit: new state.Octokit({
          authStrategy: authOauthUser.createOAuthUserAuth,
          auth: {
            clientType: state.clientType,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            token: response.authentication.token
          }
        })
      });
      return response;
    }

    async function scopeTokenWithState(state, options) {
      if (state.clientType === "oauth-app") {
        throw new Error("[@octokit/oauth-app] app.scopeToken() is not supported for OAuth Apps");
      }

      const response = await OAuthMethods.scopeToken(_objectSpread2$1({
        clientType: "github-app",
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request
      }, options));
      await emitEvent(state, {
        name: "token",
        action: "scoped",
        token: response.authentication.token,
        authentication: _objectSpread2$1({
          type: "token",
          tokenType: "oauth"
        }, response.authentication),
        octokit: new state.Octokit({
          authStrategy: authOauthUser.createOAuthUserAuth,
          auth: {
            clientType: state.clientType,
            clientId: state.clientId,
            clientSecret: state.clientSecret,
            token: response.authentication.token
          }
        })
      });
      return response;
    }

    async function deleteTokenWithState(state, options) {
      const optionsWithDefaults = _objectSpread2$1({
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request
      }, options);

      const response = state.clientType === "oauth-app" ? await OAuthMethods.deleteToken(_objectSpread2$1({
        clientType: "oauth-app"
      }, optionsWithDefaults)) : // istanbul ignore next
      await OAuthMethods.deleteToken(_objectSpread2$1({
        clientType: "github-app"
      }, optionsWithDefaults));
      await emitEvent(state, {
        name: "token",
        action: "deleted",
        token: options.token,
        octokit: new state.Octokit({
          authStrategy: authUnauthenticated.createUnauthenticatedAuth,
          auth: {
            reason: `Handling "token.deleted" event. The access for the token has been revoked.`
          }
        })
      });
      return response;
    }

    async function deleteAuthorizationWithState(state, options) {
      const optionsWithDefaults = _objectSpread2$1({
        clientId: state.clientId,
        clientSecret: state.clientSecret,
        request: state.octokit.request
      }, options);

      const response = state.clientType === "oauth-app" ? await OAuthMethods.deleteAuthorization(_objectSpread2$1({
        clientType: "oauth-app"
      }, optionsWithDefaults)) : // istanbul ignore next
      await OAuthMethods.deleteAuthorization(_objectSpread2$1({
        clientType: "github-app"
      }, optionsWithDefaults));
      await emitEvent(state, {
        name: "token",
        action: "deleted",
        token: options.token,
        octokit: new state.Octokit({
          authStrategy: authUnauthenticated.createUnauthenticatedAuth,
          auth: {
            reason: `Handling "token.deleted" event. The access for the token has been revoked.`
          }
        })
      });
      await emitEvent(state, {
        name: "authorization",
        action: "deleted",
        token: options.token,
        octokit: new state.Octokit({
          authStrategy: authUnauthenticated.createUnauthenticatedAuth,
          auth: {
            reason: `Handling "authorization.deleted" event. The access for the app has been revoked.`
          }
        })
      });
      return response;
    }

    // @ts-ignore remove once Node 10 is out maintenance. Replace with Object.fromEntries
    async function parseRequest(request) {
      const {
        searchParams
      } = new URL(request.url, "http://localhost");
      const query = fromEntries(searchParams);
      const headers = request.headers;

      if (!["POST", "PATCH"].includes(request.method)) {
        return {
          headers,
          query
        };
      }

      return new Promise((resolve, reject) => {
        let bodyChunks = [];
        request.on("error", reject).on("data", chunk => bodyChunks.push(chunk)).on("end", async () => {
          const bodyString = Buffer.concat(bodyChunks).toString();
          if (!bodyString) return resolve({
            headers,
            query
          });

          try {
            resolve({
              headers,
              query,
              body: JSON.parse(bodyString)
            });
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    async function middleware$1(app, options, request, response, next) {
      // request.url mayb include ?query parameters which we don't want for `route`
      // hence the workaround using new URL()
      const {
        pathname
      } = new URL(request.url, "http://localhost");
      const route = [request.method, pathname].join(" ");
      const routes = {
        getLogin: `GET ${options.pathPrefix}/login`,
        getCallback: `GET ${options.pathPrefix}/callback`,
        createToken: `POST ${options.pathPrefix}/token`,
        getToken: `GET ${options.pathPrefix}/token`,
        patchToken: `PATCH ${options.pathPrefix}/token`,
        patchRefreshToken: `PATCH ${options.pathPrefix}/refresh-token`,
        scopeToken: `POST ${options.pathPrefix}/token/scoped`,
        deleteToken: `DELETE ${options.pathPrefix}/token`,
        deleteGrant: `DELETE ${options.pathPrefix}/grant`
      }; // handle unknown routes

      if (!Object.values(routes).includes(route)) {
        const isExpressMiddleware = typeof next === "function";

        if (isExpressMiddleware) {
          // @ts-ignore `next` must be a function as we check two lines above
          return next();
        } else {
          return options.onUnhandledRequest(request, response);
        }
      }

      let parsedRequest;

      try {
        parsedRequest = await parseRequest(request);
      } catch (error) {
        response.writeHead(400, {
          "content-type": "application/json"
        });
        return response.end(JSON.stringify({
          error: "[@octokit/oauth-app] request error"
        }));
      }

      const {
        headers,
        query,
        body = {}
      } = parsedRequest;

      try {
        var _headers$authorizatio6;

        if (route === routes.getLogin) {
          var _query$scopes;

          const {
            url
          } = app.getWebFlowAuthorizationUrl({
            state: query.state,
            scopes: (_query$scopes = query.scopes) === null || _query$scopes === void 0 ? void 0 : _query$scopes.split(","),
            allowSignup: query.allowSignup,
            redirectUrl: query.redirectUrl
          });
          response.writeHead(302, {
            location: url
          });
          return response.end();
        }

        if (route === routes.getCallback) {
          if (query.error) {
            throw new Error(`[@octokit/oauth-app] ${query.error} ${query.error_description}`);
          }

          if (!query.state || !query.code) {
            throw new Error('[@octokit/oauth-app] Both "code" & "state" parameters are required');
          }

          const {
            authentication: {
              token
            }
          } = await app.createToken({
            state: query.state,
            code: query.code
          });
          response.writeHead(200, {
            "content-type": "text/html"
          });
          response.write(`<h1>Token created successfull</h1>
    
<p>Your token is: <strong>${token}</strong>. Copy it now as it cannot be shown again.</p>`);
          return response.end();
        }

        if (route === routes.createToken) {
          const {
            state: oauthState,
            code,
            redirectUrl
          } = body;

          if (!oauthState || !code) {
            throw new Error('[@octokit/oauth-app] Both "code" & "state" parameters are required');
          }

          const {
            authentication: {
              token,
              scopes
            }
          } = await app.createToken({
            state: oauthState,
            code,
            redirectUrl
          });
          response.writeHead(201, {
            "content-type": "application/json"
          });
          return response.end(JSON.stringify({
            token,
            scopes
          }));
        }

        if (route === routes.getToken) {
          var _headers$authorizatio;

          const token = (_headers$authorizatio = headers.authorization) === null || _headers$authorizatio === void 0 ? void 0 : _headers$authorizatio.substr("token ".length);

          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }

          const result = await app.checkToken({
            token
          });
          response.writeHead(200, {
            "content-type": "application/json"
          });
          return response.end(JSON.stringify(result));
        }

        if (route === routes.patchToken) {
          var _headers$authorizatio2;

          const token = (_headers$authorizatio2 = headers.authorization) === null || _headers$authorizatio2 === void 0 ? void 0 : _headers$authorizatio2.substr("token ".length);

          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }

          const result = await app.resetToken({
            token
          });
          response.writeHead(200, {
            "content-type": "application/json"
          });
          return response.end(JSON.stringify(result));
        }

        if (route === routes.patchRefreshToken) {
          var _headers$authorizatio3;

          const token = (_headers$authorizatio3 = headers.authorization) === null || _headers$authorizatio3 === void 0 ? void 0 : _headers$authorizatio3.substr("token ".length);

          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }

          const {
            refreshToken
          } = body;

          if (!refreshToken) {
            throw new Error("[@octokit/oauth-app] refreshToken must be sent in request body");
          }

          const result = await app.refreshToken({
            refreshToken
          });
          response.writeHead(200, {
            "content-type": "application/json"
          });
          return response.end(JSON.stringify(result));
        }

        if (route === routes.scopeToken) {
          var _headers$authorizatio4;

          const token = (_headers$authorizatio4 = headers.authorization) === null || _headers$authorizatio4 === void 0 ? void 0 : _headers$authorizatio4.substr("token ".length);

          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }

          const result = await app.scopeToken(_objectSpread2$1({
            token
          }, body));
          response.writeHead(200, {
            "content-type": "application/json"
          });
          return response.end(JSON.stringify(result));
        }

        if (route === routes.deleteToken) {
          var _headers$authorizatio5;

          const token = (_headers$authorizatio5 = headers.authorization) === null || _headers$authorizatio5 === void 0 ? void 0 : _headers$authorizatio5.substr("token ".length);

          if (!token) {
            throw new Error('[@octokit/oauth-app] "Authorization" header is required');
          }

          await app.deleteToken({
            token
          });
          response.writeHead(204);
          return response.end();
        } // route === routes.deleteGrant


        const token = (_headers$authorizatio6 = headers.authorization) === null || _headers$authorizatio6 === void 0 ? void 0 : _headers$authorizatio6.substr("token ".length);

        if (!token) {
          throw new Error('[@octokit/oauth-app] "Authorization" header is required');
        }

        await app.deleteAuthorization({
          token
        });
        response.writeHead(204);
        return response.end();
      } catch (error) {
        response.writeHead(400, {
          "content-type": "application/json"
        });
        response.end(JSON.stringify({
          error: error.message
        }));
      }
    }

    function onUnhandledRequestDefault$1(request, response) {
      response.writeHead(404, {
        "content-type": "application/json"
      });
      response.end(JSON.stringify({
        error: `Unknown route: ${request.method} ${request.url}`
      }));
    }

    function createNodeMiddleware$1(app, {
      pathPrefix = "/api/github/oauth",
      onUnhandledRequest = onUnhandledRequestDefault$1
    } = {}) {
      return middleware$1.bind(null, app, {
        pathPrefix,
        onUnhandledRequest
      });
    }

    class OAuthApp {
      constructor(options) {
        const Octokit = options.Octokit || OAuthAppOctokit;
        this.type = options.clientType || "oauth-app";
        const octokit = new Octokit({
          authStrategy: OAuthAppAuth.createOAuthAppAuth,
          auth: {
            clientType: this.type,
            clientId: options.clientId,
            clientSecret: options.clientSecret
          }
        });
        const state = {
          clientType: this.type,
          clientId: options.clientId,
          clientSecret: options.clientSecret,
          // @ts-expect-error defaultScopes not permitted for GitHub Apps
          defaultScopes: options.defaultScopes || [],
          allowSignup: options.allowSignup,
          baseUrl: options.baseUrl,
          log: options.log,
          Octokit,
          octokit,
          eventHandlers: {}
        };
        this.on = addEventHandler.bind(null, state); // @ts-expect-error TODO: figure this out

        this.octokit = octokit;
        this.getUserOctokit = getUserOctokitWithState.bind(null, state);
        this.getWebFlowAuthorizationUrl = getWebFlowAuthorizationUrlWithState.bind(null, state);
        this.createToken = createTokenWithState.bind(null, state);
        this.checkToken = checkTokenWithState.bind(null, state);
        this.resetToken = resetTokenWithState.bind(null, state);
        this.refreshToken = refreshTokenWithState.bind(null, state);
        this.scopeToken = scopeTokenWithState.bind(null, state);
        this.deleteToken = deleteTokenWithState.bind(null, state);
        this.deleteAuthorization = deleteAuthorizationWithState.bind(null, state);
      }

      static defaults(defaults) {
        const OAuthAppWithDefaults = class extends this {
          constructor(...args) {
            super(_objectSpread2$1(_objectSpread2$1({}, defaults), args[0]));
          }

        };
        return OAuthAppWithDefaults;
      }

    }
    OAuthApp.VERSION = VERSION$2;

    var OAuthApp_1 = OAuthApp;
    var createNodeMiddleware_1 = createNodeMiddleware$1;


    var distNode = /*#__PURE__*/Object.defineProperty({
    	OAuthApp: OAuthApp_1,
    	createNodeMiddleware: createNodeMiddleware_1
    }, '__esModule', {value: true});

    var indentString = (string, count = 1, options) => {
    	options = {
    		indent: ' ',
    		includeEmptyLines: false,
    		...options
    	};

    	if (typeof string !== 'string') {
    		throw new TypeError(
    			`Expected \`input\` to be a \`string\`, got \`${typeof string}\``
    		);
    	}

    	if (typeof count !== 'number') {
    		throw new TypeError(
    			`Expected \`count\` to be a \`number\`, got \`${typeof count}\``
    		);
    	}

    	if (typeof options.indent !== 'string') {
    		throw new TypeError(
    			`Expected \`options.indent\` to be a \`string\`, got \`${typeof options.indent}\``
    		);
    	}

    	if (count === 0) {
    		return string;
    	}

    	const regex = options.includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;

    	return string.replace(regex, options.indent.repeat(count));
    };

    var _nodeResolve_empty = {};

    var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': _nodeResolve_empty
    });

    var os = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

    const extractPathRegex = /\s+at.*(?:\(|\s)(.*)\)?/;
    const pathRegex = /^(?:(?:(?:node|(?:internal\/[\w/]*|.*node_modules\/(?:babel-polyfill|pirates)\/.*)?\w+)\.js:\d+:\d+)|native)/;
    const homeDir = typeof os.homedir === 'undefined' ? '' : os.homedir();

    var cleanStack = (stack, options) => {
    	options = Object.assign({pretty: false}, options);

    	return stack.replace(/\\/g, '/')
    		.split('\n')
    		.filter(line => {
    			const pathMatches = line.match(extractPathRegex);
    			if (pathMatches === null || !pathMatches[1]) {
    				return true;
    			}

    			const match = pathMatches[1];

    			// Electron
    			if (
    				match.includes('.app/Contents/Resources/electron.asar') ||
    				match.includes('.app/Contents/Resources/default_app.asar')
    			) {
    				return false;
    			}

    			return !pathRegex.test(match);
    		})
    		.filter(line => line.trim() !== '')
    		.map(line => {
    			if (options.pretty) {
    				return line.replace(extractPathRegex, (m, p1) => m.replace(p1, p1.replace(homeDir, '~')));
    			}

    			return line;
    		})
    		.join('\n');
    };

    const cleanInternalStack = stack => stack.replace(/\s+at .*aggregate-error\/index.js:\d+:\d+\)?/g, '');

    class AggregateError extends Error {
    	constructor(errors) {
    		if (!Array.isArray(errors)) {
    			throw new TypeError(`Expected input to be an Array, got ${typeof errors}`);
    		}

    		errors = [...errors].map(error => {
    			if (error instanceof Error) {
    				return error;
    			}

    			if (error !== null && typeof error === 'object') {
    				// Handle plain error objects with message property and/or possibly other metadata
    				return Object.assign(new Error(error.message), error);
    			}

    			return new Error(error);
    		});

    		let message = errors
    			.map(error => {
    				// The `stack` property is not standardized, so we can't assume it exists
    				return typeof error.stack === 'string' ? cleanInternalStack(cleanStack(error.stack)) : String(error);
    			})
    			.join('\n');
    		message = '\n' + indentString(message, 4);
    		super(message);

    		this.name = 'AggregateError';

    		Object.defineProperty(this, '_errors', {value: errors});
    	}

    	* [Symbol.iterator]() {
    		for (const error of this._errors) {
    			yield error;
    		}
    	}
    }

    var aggregateError = AggregateError;

    const enc = new TextEncoder();
    async function sign$1(secret, data) {
        const signature = await crypto.subtle.sign("HMAC", await importKey(secret), enc.encode(data));
        return UInt8ArrayToHex(signature);
    }
    async function verify$1(secret, data, signature) {
        return await crypto.subtle.verify("HMAC", await importKey(secret), hexToUInt8Array(signature), enc.encode(data));
    }
    function hexToUInt8Array(string) {
        // convert string to pairs of 2 characters
        const pairs = string.match(/[\dA-F]{2}/gi);
        // convert the octets to integers
        const integers = pairs.map(function (s) {
            return parseInt(s, 16);
        });
        return new Uint8Array(integers);
    }
    function UInt8ArrayToHex(signature) {
        return Array.prototype.map
            .call(new Uint8Array(signature), (x) => x.toString(16).padStart(2, "0"))
            .join("");
    }
    async function importKey(secret) {
        return crypto.subtle.importKey("raw", // raw format of the key - should be Uint8Array
        enc.encode(secret), {
            // algorithm details
            name: "HMAC",
            hash: { name: "SHA-256" },
        }, false, // export = false
        ["sign", "verify"] // what this key can do
        );
    }

    const createLogger = (logger) => ({
        debug: () => { },
        info: () => { },
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        ...logger,
    });

    // THIS FILE IS GENERATED - DO NOT EDIT DIRECTLY
    // make edits in scripts/generate-types.ts
    const emitterEventNames = [
        "check_run",
        "check_run.completed",
        "check_run.created",
        "check_run.requested_action",
        "check_run.rerequested",
        "check_suite",
        "check_suite.completed",
        "check_suite.requested",
        "check_suite.rerequested",
        "code_scanning_alert",
        "code_scanning_alert.appeared_in_branch",
        "code_scanning_alert.closed_by_user",
        "code_scanning_alert.created",
        "code_scanning_alert.fixed",
        "code_scanning_alert.reopened",
        "code_scanning_alert.reopened_by_user",
        "commit_comment",
        "commit_comment.created",
        "content_reference",
        "content_reference.created",
        "create",
        "delete",
        "deploy_key",
        "deploy_key.created",
        "deploy_key.deleted",
        "deployment",
        "deployment.created",
        "deployment_status",
        "deployment_status.created",
        "discussion",
        "discussion.answered",
        "discussion.category_changed",
        "discussion.created",
        "discussion.deleted",
        "discussion.edited",
        "discussion.locked",
        "discussion.pinned",
        "discussion.transferred",
        "discussion.unanswered",
        "discussion.unlocked",
        "discussion.unpinned",
        "discussion_comment",
        "discussion_comment.created",
        "discussion_comment.deleted",
        "discussion_comment.edited",
        "fork",
        "github_app_authorization",
        "github_app_authorization.revoked",
        "gollum",
        "installation",
        "installation.created",
        "installation.deleted",
        "installation.new_permissions_accepted",
        "installation.suspend",
        "installation.unsuspend",
        "installation_repositories",
        "installation_repositories.added",
        "installation_repositories.removed",
        "issue_comment",
        "issue_comment.created",
        "issue_comment.deleted",
        "issue_comment.edited",
        "issues",
        "issues.assigned",
        "issues.closed",
        "issues.deleted",
        "issues.demilestoned",
        "issues.edited",
        "issues.labeled",
        "issues.locked",
        "issues.milestoned",
        "issues.opened",
        "issues.pinned",
        "issues.reopened",
        "issues.transferred",
        "issues.unassigned",
        "issues.unlabeled",
        "issues.unlocked",
        "issues.unpinned",
        "label",
        "label.created",
        "label.deleted",
        "label.edited",
        "marketplace_purchase",
        "marketplace_purchase.cancelled",
        "marketplace_purchase.changed",
        "marketplace_purchase.pending_change",
        "marketplace_purchase.pending_change_cancelled",
        "marketplace_purchase.purchased",
        "member",
        "member.added",
        "member.edited",
        "member.removed",
        "membership",
        "membership.added",
        "membership.removed",
        "meta",
        "meta.deleted",
        "milestone",
        "milestone.closed",
        "milestone.created",
        "milestone.deleted",
        "milestone.edited",
        "milestone.opened",
        "org_block",
        "org_block.blocked",
        "org_block.unblocked",
        "organization",
        "organization.deleted",
        "organization.member_added",
        "organization.member_invited",
        "organization.member_removed",
        "organization.renamed",
        "package",
        "package.published",
        "package.updated",
        "page_build",
        "ping",
        "project",
        "project.closed",
        "project.created",
        "project.deleted",
        "project.edited",
        "project.reopened",
        "project_card",
        "project_card.converted",
        "project_card.created",
        "project_card.deleted",
        "project_card.edited",
        "project_card.moved",
        "project_column",
        "project_column.created",
        "project_column.deleted",
        "project_column.edited",
        "project_column.moved",
        "public",
        "pull_request",
        "pull_request.assigned",
        "pull_request.auto_merge_disabled",
        "pull_request.auto_merge_enabled",
        "pull_request.closed",
        "pull_request.converted_to_draft",
        "pull_request.edited",
        "pull_request.labeled",
        "pull_request.locked",
        "pull_request.opened",
        "pull_request.ready_for_review",
        "pull_request.reopened",
        "pull_request.review_request_removed",
        "pull_request.review_requested",
        "pull_request.synchronize",
        "pull_request.unassigned",
        "pull_request.unlabeled",
        "pull_request.unlocked",
        "pull_request_review",
        "pull_request_review.dismissed",
        "pull_request_review.edited",
        "pull_request_review.submitted",
        "pull_request_review_comment",
        "pull_request_review_comment.created",
        "pull_request_review_comment.deleted",
        "pull_request_review_comment.edited",
        "push",
        "release",
        "release.created",
        "release.deleted",
        "release.edited",
        "release.prereleased",
        "release.published",
        "release.released",
        "release.unpublished",
        "repository",
        "repository.archived",
        "repository.created",
        "repository.deleted",
        "repository.edited",
        "repository.privatized",
        "repository.publicized",
        "repository.renamed",
        "repository.transferred",
        "repository.unarchived",
        "repository_dispatch",
        "repository_dispatch.on-demand-test",
        "repository_import",
        "repository_vulnerability_alert",
        "repository_vulnerability_alert.create",
        "repository_vulnerability_alert.dismiss",
        "repository_vulnerability_alert.resolve",
        "secret_scanning_alert",
        "secret_scanning_alert.created",
        "secret_scanning_alert.reopened",
        "secret_scanning_alert.resolved",
        "security_advisory",
        "security_advisory.performed",
        "security_advisory.published",
        "security_advisory.updated",
        "security_advisory.withdrawn",
        "sponsorship",
        "sponsorship.cancelled",
        "sponsorship.created",
        "sponsorship.edited",
        "sponsorship.pending_cancellation",
        "sponsorship.pending_tier_change",
        "sponsorship.tier_changed",
        "star",
        "star.created",
        "star.deleted",
        "status",
        "team",
        "team.added_to_repository",
        "team.created",
        "team.deleted",
        "team.edited",
        "team.removed_from_repository",
        "team_add",
        "watch",
        "watch.started",
        "workflow_dispatch",
        "workflow_run",
        "workflow_run.completed",
        "workflow_run.requested",
    ];

    function handleEventHandlers(state, webhookName, handler) {
        if (!state.hooks[webhookName]) {
            state.hooks[webhookName] = [];
        }
        state.hooks[webhookName].push(handler);
    }
    function receiverOn(state, webhookNameOrNames, handler) {
        if (Array.isArray(webhookNameOrNames)) {
            webhookNameOrNames.forEach((webhookName) => receiverOn(state, webhookName, handler));
            return;
        }
        if (["*", "error"].includes(webhookNameOrNames)) {
            const webhookName = webhookNameOrNames === "*" ? "any" : webhookNameOrNames;
            const message = `Using the "${webhookNameOrNames}" event with the regular Webhooks.on() function is not supported. Please use the Webhooks.on${webhookName.charAt(0).toUpperCase() + webhookName.slice(1)}() method instead`;
            throw new Error(message);
        }
        if (!emitterEventNames.includes(webhookNameOrNames)) {
            state.log.warn(`"${webhookNameOrNames}" is not a known webhook name (https://developer.github.com/v3/activity/events/types/)`);
        }
        handleEventHandlers(state, webhookNameOrNames, handler);
    }
    function receiverOnAny(state, handler) {
        handleEventHandlers(state, "*", handler);
    }
    function receiverOnError(state, handler) {
        handleEventHandlers(state, "error", handler);
    }

    // Errors thrown or rejected Promises in "error" event handlers are not handled
    // as they are in the webhook event handlers. If errors occur, we log a
    // "Fatal: Error occurred" message to stdout
    function wrapErrorHandler(handler, error) {
        let returnValue;
        try {
            returnValue = handler(error);
        }
        catch (error) {
            console.log('FATAL: Error occurred in "error" event handler');
            console.log(error);
        }
        if (returnValue && returnValue.catch) {
            returnValue.catch((error) => {
                console.log('FATAL: Error occurred in "error" event handler');
                console.log(error);
            });
        }
    }

    // @ts-ignore to address #245
    function getHooks(state, eventPayloadAction, eventName) {
        const hooks = [state.hooks[eventName], state.hooks["*"]];
        if (eventPayloadAction) {
            hooks.unshift(state.hooks[`${eventName}.${eventPayloadAction}`]);
        }
        return [].concat(...hooks.filter(Boolean));
    }
    // main handler function
    function receiverHandle(state, event) {
        const errorHandlers = state.hooks.error || [];
        if (event instanceof Error) {
            const error = Object.assign(new aggregateError([event]), {
                event,
                errors: [event],
            });
            errorHandlers.forEach((handler) => wrapErrorHandler(handler, error));
            return Promise.reject(error);
        }
        if (!event || !event.name) {
            throw new aggregateError(["Event name not passed"]);
        }
        if (!event.payload) {
            throw new aggregateError(["Event payload not passed"]);
        }
        // flatten arrays of event listeners and remove undefined values
        const hooks = getHooks(state, "action" in event.payload ? event.payload.action : null, event.name);
        if (hooks.length === 0) {
            return Promise.resolve();
        }
        const errors = [];
        const promises = hooks.map((handler) => {
            let promise = Promise.resolve(event);
            if (state.transform) {
                promise = promise.then(state.transform);
            }
            return promise
                .then((event) => {
                return handler(event);
            })
                .catch((error) => errors.push(Object.assign(error, { event })));
        });
        return Promise.all(promises).then(() => {
            if (errors.length === 0) {
                return;
            }
            const error = new aggregateError(errors);
            Object.assign(error, {
                event,
                errors,
            });
            errorHandlers.forEach((handler) => wrapErrorHandler(handler, error));
            throw error;
        });
    }

    function removeListener(state, webhookNameOrNames, handler) {
        if (Array.isArray(webhookNameOrNames)) {
            webhookNameOrNames.forEach((webhookName) => removeListener(state, webhookName, handler));
            return;
        }
        if (!state.hooks[webhookNameOrNames]) {
            return;
        }
        // remove last hook that has been added, that way
        // it behaves the same as removeListener
        for (let i = state.hooks[webhookNameOrNames].length - 1; i >= 0; i--) {
            if (state.hooks[webhookNameOrNames][i] === handler) {
                state.hooks[webhookNameOrNames].splice(i, 1);
                return;
            }
        }
    }

    function createEventHandler(options) {
        const state = {
            hooks: {},
            log: createLogger(options && options.log),
        };
        if (options && options.transform) {
            state.transform = options.transform;
        }
        return {
            on: receiverOn.bind(null, state),
            onAny: receiverOnAny.bind(null, state),
            onError: receiverOnError.bind(null, state),
            removeListener: removeListener.bind(null, state),
            receive: receiverHandle.bind(null, state),
        };
    }

    /**
     * GitHub sends its JSON with an indentation of 2 spaces and a line break at the end
     */
    function toNormalizedJsonString(payload) {
        const payloadString = JSON.stringify(payload);
        return payloadString.replace(/[^\\]\\u[\da-f]{4}/g, (s) => {
            return s.substr(0, 3) + s.substr(3).toUpperCase();
        });
    }

    async function sign(secret, payload) {
        return sign$1(secret, typeof payload === "string" ? payload : toNormalizedJsonString(payload));
    }

    async function verify(secret, payload, signature) {
        return verify$1(secret, typeof payload === "string" ? payload : toNormalizedJsonString(payload), signature);
    }

    async function verifyAndReceive(state, event) {
        // verify will validate that the secret is not undefined
        const matchesSignature = await verify$1(state.secret, typeof event.payload === "object"
            ? toNormalizedJsonString(event.payload)
            : event.payload, event.signature);
        if (!matchesSignature) {
            const error = new Error("[@octokit/webhooks] signature does not match event payload and secret");
            return state.eventHandler.receive(Object.assign(error, { event, status: 400 }));
        }
        return state.eventHandler.receive({
            id: event.id,
            name: event.name,
            payload: typeof event.payload === "string"
                ? JSON.parse(event.payload)
                : event.payload,
        });
    }

    const WEBHOOK_HEADERS = [
        "x-github-event",
        "x-hub-signature-256",
        "x-github-delivery",
    ];
    // https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#delivery-headers
    function getMissingHeaders(request) {
        return WEBHOOK_HEADERS.filter((header) => !(header in request.headers));
    }

    // @ts-ignore to address #245
    function getPayload(request) {
        // If request.body already exists we can stop here
        // See https://github.com/octokit/webhooks.js/pull/23
        if (request.body)
            return Promise.resolve(request.body);
        return new Promise((resolve, reject) => {
            let data = "";
            request.setEncoding("utf8");
            // istanbul ignore next
            request.on("error", (error) => reject(new aggregateError([error])));
            request.on("data", (chunk) => (data += chunk));
            request.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (error) {
                    error.message = "Invalid JSON";
                    error.status = 400;
                    reject(new aggregateError([error]));
                }
            });
        });
    }

    async function middleware(webhooks, options, request, response, next) {
        const { pathname } = new URL(request.url, "http://localhost");
        const isUnknownRoute = request.method !== "POST" || pathname !== options.path;
        const isExpressMiddleware = typeof next === "function";
        if (isUnknownRoute) {
            if (isExpressMiddleware) {
                return next();
            }
            else {
                return options.onUnhandledRequest(request, response);
            }
        }
        const missingHeaders = getMissingHeaders(request).join(", ");
        if (missingHeaders) {
            response.writeHead(400, {
                "content-type": "application/json",
            });
            response.end(JSON.stringify({
                error: `Required headers missing: ${missingHeaders}`,
            }));
            return;
        }
        const eventName = request.headers["x-github-event"];
        const signatureSHA256 = request.headers["x-hub-signature-256"];
        const id = request.headers["x-github-delivery"];
        options.log.debug(`${eventName} event received (id: ${id})`);
        // GitHub will abort the request if it does not receive a response within 10s
        // See https://github.com/octokit/webhooks.js/issues/185
        let didTimeout = false;
        const timeout = setTimeout(() => {
            didTimeout = true;
            response.statusCode = 202;
            response.end("still processing\n");
        }, 9000).unref();
        try {
            const payload = await getPayload(request);
            await webhooks.verifyAndReceive({
                id: id,
                name: eventName,
                payload: payload,
                signature: signatureSHA256,
            });
            clearTimeout(timeout);
            if (didTimeout)
                return;
            response.end("ok\n");
        }
        catch (error) {
            clearTimeout(timeout);
            if (didTimeout)
                return;
            const statusCode = Array.from(error)[0].status;
            response.statusCode = typeof statusCode !== "undefined" ? statusCode : 500;
            response.end(error.toString());
        }
    }

    function onUnhandledRequestDefault(request, response) {
        response.writeHead(404, {
            "content-type": "application/json",
        });
        response.end(JSON.stringify({
            error: `Unknown route: ${request.method} ${request.url}`,
        }));
    }

    function createNodeMiddleware(webhooks, { path = "/api/github/webhooks", onUnhandledRequest = onUnhandledRequestDefault, log = createLogger(), } = {}) {
        return middleware.bind(null, webhooks, {
            path,
            onUnhandledRequest,
            log,
        });
    }

    // U holds the return value of `transform` function in Options
    class Webhooks {
        constructor(options) {
            if (!options || !options.secret) {
                throw new Error("[@octokit/webhooks] options.secret required");
            }
            const state = {
                eventHandler: createEventHandler(options),
                secret: options.secret,
                hooks: {},
                log: createLogger(options.log),
            };
            this.sign = sign.bind(null, options.secret);
            this.verify = verify.bind(null, options.secret);
            this.on = state.eventHandler.on;
            this.onAny = state.eventHandler.onAny;
            this.onError = state.eventHandler.onError;
            this.removeListener = state.eventHandler.removeListener;
            this.receive = state.eventHandler.receive;
            this.verifyAndReceive = verifyAndReceive.bind(null, state);
        }
    }

    var distWeb = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Webhooks: Webhooks,
        createEventHandler: createEventHandler,
        createNodeMiddleware: createNodeMiddleware
    });

    var authApp = /*@__PURE__*/getAugmentedNamespace(distWeb$2);

    var webhooks$1 = /*@__PURE__*/getAugmentedNamespace(distWeb);

    var pluginPaginateRest = /*@__PURE__*/getAugmentedNamespace(distWeb$6);

    function ownKeys(object, enumerableOnly) {
      var keys = Object.keys(object);

      if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);

        if (enumerableOnly) {
          symbols = symbols.filter(function (sym) {
            return Object.getOwnPropertyDescriptor(object, sym).enumerable;
          });
        }

        keys.push.apply(keys, symbols);
      }

      return keys;
    }

    function _objectSpread2(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i] != null ? arguments[i] : {};

        if (i % 2) {
          ownKeys(Object(source), true).forEach(function (key) {
            _defineProperty(target, key, source[key]);
          });
        } else if (Object.getOwnPropertyDescriptors) {
          Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
        } else {
          ownKeys(Object(source)).forEach(function (key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
          });
        }
      }

      return target;
    }

    function _asyncIterator(iterable) {
      var method;

      if (typeof Symbol !== "undefined") {
        if (Symbol.asyncIterator) method = iterable[Symbol.asyncIterator];
        if (method == null && Symbol.iterator) method = iterable[Symbol.iterator];
      }

      if (method == null) method = iterable["@@asyncIterator"];
      if (method == null) method = iterable["@@iterator"];
      if (method == null) throw new TypeError("Object is not async iterable");
      return method.call(iterable);
    }

    function _AwaitValue(value) {
      this.wrapped = value;
    }

    function _AsyncGenerator(gen) {
      var front, back;

      function send(key, arg) {
        return new Promise(function (resolve, reject) {
          var request = {
            key: key,
            arg: arg,
            resolve: resolve,
            reject: reject,
            next: null
          };

          if (back) {
            back = back.next = request;
          } else {
            front = back = request;
            resume(key, arg);
          }
        });
      }

      function resume(key, arg) {
        try {
          var result = gen[key](arg);
          var value = result.value;
          var wrappedAwait = value instanceof _AwaitValue;
          Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) {
            if (wrappedAwait) {
              resume(key === "return" ? "return" : "next", arg);
              return;
            }

            settle(result.done ? "return" : "normal", arg);
          }, function (err) {
            resume("throw", err);
          });
        } catch (err) {
          settle("throw", err);
        }
      }

      function settle(type, value) {
        switch (type) {
          case "return":
            front.resolve({
              value: value,
              done: true
            });
            break;

          case "throw":
            front.reject(value);
            break;

          default:
            front.resolve({
              value: value,
              done: false
            });
            break;
        }

        front = front.next;

        if (front) {
          resume(front.key, front.arg);
        } else {
          back = null;
        }
      }

      this._invoke = send;

      if (typeof gen.return !== "function") {
        this.return = undefined;
      }
    }

    _AsyncGenerator.prototype[typeof Symbol === "function" && Symbol.asyncIterator || "@@asyncIterator"] = function () {
      return this;
    };

    _AsyncGenerator.prototype.next = function (arg) {
      return this._invoke("next", arg);
    };

    _AsyncGenerator.prototype.throw = function (arg) {
      return this._invoke("throw", arg);
    };

    _AsyncGenerator.prototype.return = function (arg) {
      return this._invoke("return", arg);
    };

    function _wrapAsyncGenerator(fn) {
      return function () {
        return new _AsyncGenerator(fn.apply(this, arguments));
      };
    }

    function _awaitAsyncGenerator(value) {
      return new _AwaitValue(value);
    }

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    const VERSION$1 = "12.0.3";

    function webhooks(appOctokit, options // Explict return type for better debugability and performance,
    // see https://github.com/octokit/app.js/pull/201
    ) {
      return new webhooks$1.Webhooks({
        secret: options.secret,
        transform: async event => {
          if (!("installation" in event.payload) || typeof event.payload.installation !== "object") {
            const octokit = new appOctokit.constructor({
              authStrategy: authUnauthenticated.createUnauthenticatedAuth,
              auth: {
                reason: `"installation" key missing in webhook event payload`
              }
            });
            return _objectSpread2(_objectSpread2({}, event), {}, {
              octokit: octokit
            });
          }

          const installationId = event.payload.installation.id;
          const octokit = await appOctokit.auth({
            type: "installation",
            installationId,

            factory(auth) {
              return new auth.octokit.constructor(_objectSpread2(_objectSpread2({}, auth.octokitOptions), {}, {
                authStrategy: authApp.createAppAuth
              }, {
                auth: _objectSpread2(_objectSpread2({}, auth), {}, {
                  installationId
                })
              }));
            }

          });
          return _objectSpread2(_objectSpread2({}, event), {}, {
            octokit: octokit
          });
        }
      });
    }

    async function getInstallationOctokit(app, installationId) {
      return app.octokit.auth({
        type: "installation",
        installationId: installationId,

        factory(auth) {
          const options = _objectSpread2(_objectSpread2({}, auth.octokitOptions), {}, {
            authStrategy: authApp.createAppAuth
          }, {
            auth: _objectSpread2(_objectSpread2({}, auth), {}, {
              installationId: installationId
            })
          });

          return new auth.octokit.constructor(options);
        }

      });
    }

    function eachInstallationFactory(app) {
      return Object.assign(eachInstallation.bind(null, app), {
        iterator: eachInstallationIterator.bind(null, app)
      });
    }
    async function eachInstallation(app, callback) {
      const i = eachInstallationIterator(app)[Symbol.asyncIterator]();
      let result = await i.next();

      while (!result.done) {
        await callback(result.value);
        result = await i.next();
      }
    }
    function eachInstallationIterator(app) {
      return {
        [Symbol.asyncIterator]() {
          return _wrapAsyncGenerator(function* () {
            const iterator = pluginPaginateRest.composePaginateRest.iterator(app.octokit, "GET /app/installations");
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;

            var _iteratorError;

            try {
              for (var _iterator = _asyncIterator(iterator), _step, _value; _step = yield _awaitAsyncGenerator(_iterator.next()), _iteratorNormalCompletion = _step.done, _value = yield _awaitAsyncGenerator(_step.value), !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
                const {
                  data: installations
                } = _value;

                for (const installation of installations) {
                  const installationOctokit = yield _awaitAsyncGenerator(getInstallationOctokit(app, installation.id));
                  yield {
                    octokit: installationOctokit,
                    installation
                  };
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                  yield _awaitAsyncGenerator(_iterator.return());
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          })();
        }

      };
    }

    function eachRepositoryFactory(app) {
      return Object.assign(eachRepository.bind(null, app), {
        iterator: eachRepositoryIterator.bind(null, app)
      });
    }
    async function eachRepository(app, queryOrCallback, callback) {
      const i = eachRepositoryIterator(app, callback ? queryOrCallback : undefined)[Symbol.asyncIterator]();
      let result = await i.next();

      while (!result.done) {
        if (callback) {
          await callback(result.value);
        } else {
          await queryOrCallback(result.value);
        }

        result = await i.next();
      }
    }

    function singleInstallationIterator(app, installationId) {
      return {
        [Symbol.asyncIterator]() {
          return _wrapAsyncGenerator(function* () {
            yield {
              octokit: yield _awaitAsyncGenerator(app.getInstallationOctokit(installationId))
            };
          })();
        }

      };
    }

    function eachRepositoryIterator(app, query) {
      return {
        [Symbol.asyncIterator]() {
          return _wrapAsyncGenerator(function* () {
            const iterator = query ? singleInstallationIterator(app, query.installationId) : app.eachInstallation.iterator();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;

            var _iteratorError;

            try {
              for (var _iterator = _asyncIterator(iterator), _step, _value; _step = yield _awaitAsyncGenerator(_iterator.next()), _iteratorNormalCompletion = _step.done, _value = yield _awaitAsyncGenerator(_step.value), !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
                const {
                  octokit
                } = _value;
                const repositoriesIterator = pluginPaginateRest.composePaginateRest.iterator(octokit, "GET /installation/repositories");
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;

                var _iteratorError2;

                try {
                  for (var _iterator2 = _asyncIterator(repositoriesIterator), _step2, _value2; _step2 = yield _awaitAsyncGenerator(_iterator2.next()), _iteratorNormalCompletion2 = _step2.done, _value2 = yield _awaitAsyncGenerator(_step2.value), !_iteratorNormalCompletion2; _iteratorNormalCompletion2 = true) {
                    const {
                      data: repositories
                    } = _value2;

                    for (const repository of repositories) {
                      yield {
                        octokit: octokit,
                        repository
                      };
                    }
                  }
                } catch (err) {
                  _didIteratorError2 = true;
                  _iteratorError2 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
                      yield _awaitAsyncGenerator(_iterator2.return());
                    }
                  } finally {
                    if (_didIteratorError2) {
                      throw _iteratorError2;
                    }
                  }
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                  yield _awaitAsyncGenerator(_iterator.return());
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          })();
        }

      };
    }

    class App$1 {
      constructor(options) {
        const Octokit = options.Octokit || core.Octokit;
        const authOptions = Object.assign({
          appId: options.appId,
          privateKey: options.privateKey
        }, options.oauth ? {
          clientId: options.oauth.clientId,
          clientSecret: options.oauth.clientSecret
        } : {});
        this.octokit = new Octokit({
          authStrategy: authApp.createAppAuth,
          auth: authOptions,
          log: options.log
        });
        this.log = Object.assign({
          debug: () => {},
          info: () => {},
          warn: console.warn.bind(console),
          error: console.error.bind(console)
        }, options.log); // set app.webhooks depending on whether "webhooks" option has been passed

        if (options.webhooks) {
          // @ts-expect-error TODO: figure this out
          this.webhooks = webhooks(this.octokit, options.webhooks);
        } else {
          Object.defineProperty(this, "webhooks", {
            get() {
              throw new Error("[@octokit/app] webhooks option not set");
            }

          });
        } // set app.oauth depending on whether "oauth" option has been passed


        if (options.oauth) {
          this.oauth = new distNode.OAuthApp(_objectSpread2(_objectSpread2({}, options.oauth), {}, {
            clientType: "github-app",
            Octokit
          }));
        } else {
          Object.defineProperty(this, "oauth", {
            get() {
              throw new Error("[@octokit/app] oauth.clientId / oauth.clientSecret options are not set");
            }

          });
        }

        this.getInstallationOctokit = getInstallationOctokit.bind(null, this);
        this.eachInstallation = eachInstallationFactory(this);
        this.eachRepository = eachRepositoryFactory(this);
      }

      static defaults(defaults) {
        const AppWithDefaults = class extends this {
          constructor(...args) {
            super(_objectSpread2(_objectSpread2({}, defaults), args[0]));
          }

        };
        return AppWithDefaults;
      }

    }
    App$1.VERSION = VERSION$1;

    var App_1 = App$1;

    const VERSION = "1.1.0";

    const Octokit = Octokit$1.plugin(restEndpointMethods, paginateRest, retry
    // throttling
    ).defaults({
        userAgent: `octokit-rest.js/${VERSION}`,
        throttle: {
            onRateLimit,
            onAbuseLimit,
        },
    });
    // istanbul ignore next no need to test internals of the throttle plugin
    function onRateLimit(retryAfter, options, octokit) {
        octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
        if (options.request.retryCount === 0) {
            // only retries once
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
        }
    }
    // istanbul ignore next no need to test internals of the throttle plugin
    function onAbuseLimit(retryAfter, options, octokit) {
        octokit.log.warn(`Abuse detected for request ${options.method} ${options.url}`);
        if (options.request.retryCount === 0) {
            // only retries once
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
        }
    }

    App_1.defaults({ Octokit });
    OAuthApp_1.defaults({ Octokit });

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(claimed_nodes) {
            this.e = this.n = null;
            this.l = claimed_nodes;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                if (this.l) {
                    this.n = this.l;
                }
                else {
                    this.h(html);
                }
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\section.svelte generated by Svelte v3.38.3 */

    const file$8 = "src\\components\\section.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (18:1) {#if !stored}
    function create_if_block$4(ctx) {
    	let table;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let each_value = /*param*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "名前";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "型";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "初期値";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "説明";
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "class", "svelte-9tzbon");
    			add_location(th0, file$8, 20, 4, 411);
    			attr_dev(th1, "class", "svelte-9tzbon");
    			add_location(th1, file$8, 21, 4, 428);
    			attr_dev(th2, "class", "svelte-9tzbon");
    			add_location(th2, file$8, 22, 4, 444);
    			attr_dev(th3, "class", "svelte-9tzbon");
    			add_location(th3, file$8, 23, 4, 462);
    			add_location(tr, file$8, 19, 3, 401);
    			attr_dev(table, "class", "param svelte-9tzbon");
    			add_location(table, file$8, 18, 2, 375);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(tr, t5);
    			append_dev(tr, th3);
    			append_dev(table, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*param*/ 4) {
    				each_value = /*param*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(18:1) {#if !stored}",
    		ctx
    	});

    	return block;
    }

    // (28:5) {#each p as cell}
    function create_each_block_1(ctx) {
    	let td;
    	let t_value = /*cell*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "class", "svelte-9tzbon");
    			add_location(td, file$8, 28, 6, 548);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*param*/ 4 && t_value !== (t_value = /*cell*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(28:5) {#each p as cell}",
    		ctx
    	});

    	return block;
    }

    // (26:3) {#each param as p}
    function create_each_block$4(ctx) {
    	let tr;
    	let t;
    	let each_value_1 = /*p*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file$8, 26, 4, 512);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*param*/ 4) {
    				each_value_1 = /*p*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(26:3) {#each param as p}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div1;
    	let div0;
    	let h3;
    	let span;
    	let t0_value = (/*stored*/ ctx[3] ? "▶" : "▼") + "";
    	let t0;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;
    	let if_block = !/*stored*/ ctx[3] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(/*command*/ ctx[0]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*runDetail*/ ctx[1]);
    			t4 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "marker svelte-9tzbon");
    			add_location(span, file$8, 14, 22, 262);
    			attr_dev(h3, "class", "command");
    			add_location(h3, file$8, 14, 2, 242);
    			add_location(p, file$8, 15, 2, 328);
    			attr_dev(div0, "class", "header svelte-9tzbon");
    			add_location(div0, file$8, 13, 1, 195);
    			attr_dev(div1, "class", "section svelte-9tzbon");
    			add_location(div1, file$8, 12, 0, 171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, span);
    			append_dev(span, t0);
    			append_dev(h3, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(p, t3);
    			append_dev(div1, t4);
    			if (if_block) if_block.m(div1, null);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*handleClick*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*stored*/ 8 && t0_value !== (t0_value = (/*stored*/ ctx[3] ? "▶" : "▼") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*command*/ 1) set_data_dev(t1, /*command*/ ctx[0]);
    			if (dirty & /*runDetail*/ 2) set_data_dev(t3, /*runDetail*/ ctx[1]);

    			if (!/*stored*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Section", slots, []);
    	let { command } = $$props;
    	let { runDetail } = $$props;
    	let { param } = $$props;
    	let stored = true;

    	function handleClick(event) {
    		$$invalidate(3, stored = !stored);
    	}

    	const writable_props = ["command", "runDetail", "param"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Section> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("command" in $$props) $$invalidate(0, command = $$props.command);
    		if ("runDetail" in $$props) $$invalidate(1, runDetail = $$props.runDetail);
    		if ("param" in $$props) $$invalidate(2, param = $$props.param);
    	};

    	$$self.$capture_state = () => ({
    		command,
    		runDetail,
    		param,
    		stored,
    		handleClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("command" in $$props) $$invalidate(0, command = $$props.command);
    		if ("runDetail" in $$props) $$invalidate(1, runDetail = $$props.runDetail);
    		if ("param" in $$props) $$invalidate(2, param = $$props.param);
    		if ("stored" in $$props) $$invalidate(3, stored = $$props.stored);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [command, runDetail, param, stored, handleClick];
    }

    class Section extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { command: 0, runDetail: 1, param: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*command*/ ctx[0] === undefined && !("command" in props)) {
    			console.warn("<Section> was created without expected prop 'command'");
    		}

    		if (/*runDetail*/ ctx[1] === undefined && !("runDetail" in props)) {
    			console.warn("<Section> was created without expected prop 'runDetail'");
    		}

    		if (/*param*/ ctx[2] === undefined && !("param" in props)) {
    			console.warn("<Section> was created without expected prop 'param'");
    		}
    	}

    	get command() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set command(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get runDetail() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set runDetail(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get param() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set param(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function isOutOfViewport (elem) {
        const bounding = elem.getBoundingClientRect();
        const out = {};

        out.top = bounding.top < 0;
        out.left = bounding.left < 0;
        out.bottom =
            bounding.bottom >
            (window.innerHeight || document.documentElement.clientHeight);
        out.right =
            bounding.right >
            (window.innerWidth || document.documentElement.clientWidth);
        out.any = out.top || out.left || out.bottom || out.right;

        return out;
    }

    /* node_modules\svelte-select\src\Item.svelte generated by Svelte v3.38.3 */

    const file$7 = "node_modules\\svelte-select\\src\\Item.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let raw_value = /*getOptionLabel*/ ctx[0](/*item*/ ctx[1], /*filterText*/ ctx[2]) + "";
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "item " + /*itemClasses*/ ctx[3] + " svelte-u0t2tk");
    			add_location(div, file$7, 70, 0, 1632);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*getOptionLabel, item, filterText*/ 7 && raw_value !== (raw_value = /*getOptionLabel*/ ctx[0](/*item*/ ctx[1], /*filterText*/ ctx[2]) + "")) div.innerHTML = raw_value;
    			if (dirty & /*itemClasses*/ 8 && div_class_value !== (div_class_value = "item " + /*itemClasses*/ ctx[3] + " svelte-u0t2tk")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	let { isActive = false } = $$props;
    	let { isFirst = false } = $$props;
    	let { isHover = false } = $$props;
    	let { getOptionLabel = undefined } = $$props;
    	let { item = undefined } = $$props;
    	let { filterText = "" } = $$props;
    	let itemClasses = "";
    	const writable_props = ["isActive", "isFirst", "isHover", "getOptionLabel", "item", "filterText"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("isActive" in $$props) $$invalidate(4, isActive = $$props.isActive);
    		if ("isFirst" in $$props) $$invalidate(5, isFirst = $$props.isFirst);
    		if ("isHover" in $$props) $$invalidate(6, isHover = $$props.isHover);
    		if ("getOptionLabel" in $$props) $$invalidate(0, getOptionLabel = $$props.getOptionLabel);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    		if ("filterText" in $$props) $$invalidate(2, filterText = $$props.filterText);
    	};

    	$$self.$capture_state = () => ({
    		isActive,
    		isFirst,
    		isHover,
    		getOptionLabel,
    		item,
    		filterText,
    		itemClasses
    	});

    	$$self.$inject_state = $$props => {
    		if ("isActive" in $$props) $$invalidate(4, isActive = $$props.isActive);
    		if ("isFirst" in $$props) $$invalidate(5, isFirst = $$props.isFirst);
    		if ("isHover" in $$props) $$invalidate(6, isHover = $$props.isHover);
    		if ("getOptionLabel" in $$props) $$invalidate(0, getOptionLabel = $$props.getOptionLabel);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    		if ("filterText" in $$props) $$invalidate(2, filterText = $$props.filterText);
    		if ("itemClasses" in $$props) $$invalidate(3, itemClasses = $$props.itemClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isActive, isFirst, isHover, item*/ 114) {
    			{
    				const classes = [];

    				if (isActive) {
    					classes.push("active");
    				}

    				if (isFirst) {
    					classes.push("first");
    				}

    				if (isHover) {
    					classes.push("hover");
    				}

    				if (item.isGroupHeader) {
    					classes.push("groupHeader");
    				}

    				if (item.isGroupItem) {
    					classes.push("groupItem");
    				}

    				$$invalidate(3, itemClasses = classes.join(" "));
    			}
    		}
    	};

    	return [getOptionLabel, item, filterText, itemClasses, isActive, isFirst, isHover];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			isActive: 4,
    			isFirst: 5,
    			isHover: 6,
    			getOptionLabel: 0,
    			item: 1,
    			filterText: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get isActive() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isActive(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isFirst() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isFirst(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isHover() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isHover(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getOptionLabel() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getOptionLabel(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filterText() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filterText(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-select\src\List.svelte generated by Svelte v3.38.3 */
    const file$6 = "node_modules\\svelte-select\\src\\List.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	child_ctx[42] = i;
    	return child_ctx;
    }

    // (274:0) {#if isVirtualList}
    function create_if_block_3$1(ctx) {
    	let div;
    	let switch_instance;
    	let current;
    	var switch_value = /*VirtualList*/ ctx[2];

    	function switch_props(ctx) {
    		return {
    			props: {
    				items: /*items*/ ctx[5],
    				itemHeight: /*itemHeight*/ ctx[8],
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ item, i }) => ({ 40: item, 42: i }),
    						({ item, i }) => [0, (item ? 512 : 0) | (i ? 2048 : 0)]
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "listContainer virtualList svelte-1uyqfml");
    			attr_dev(div, "style", /*listStyle*/ ctx[14]);
    			add_location(div, file$6, 274, 4, 8036);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			/*div_binding*/ ctx[28](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty[0] & /*items*/ 32) switch_instance_changes.items = /*items*/ ctx[5];
    			if (dirty[0] & /*itemHeight*/ 256) switch_instance_changes.itemHeight = /*itemHeight*/ ctx[8];

    			if (dirty[0] & /*Item, filterText, getOptionLabel, value, optionIdentifier, hoverItemIndex, items*/ 9834 | dirty[1] & /*$$scope, item, i*/ 6656) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*VirtualList*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}

    			if (!current || dirty[0] & /*listStyle*/ 16384) {
    				attr_dev(div, "style", /*listStyle*/ ctx[14]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			/*div_binding*/ ctx[28](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(274:0) {#if isVirtualList}",
    		ctx
    	});

    	return block;
    }

    // (279:8) <svelte:component             this={VirtualList}             {items}             {itemHeight}             let:item             let:i>
    function create_default_slot(ctx) {
    	let div;
    	let switch_instance;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*Item*/ ctx[3];

    	function switch_props(ctx) {
    		return {
    			props: {
    				item: /*item*/ ctx[40],
    				filterText: /*filterText*/ ctx[13],
    				getOptionLabel: /*getOptionLabel*/ ctx[6],
    				isFirst: isItemFirst(/*i*/ ctx[42]),
    				isActive: isItemActive(/*item*/ ctx[40], /*value*/ ctx[9], /*optionIdentifier*/ ctx[10]),
    				isHover: isItemHover(/*hoverItemIndex*/ ctx[1], /*item*/ ctx[40], /*i*/ ctx[42], /*items*/ ctx[5])
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	function mouseover_handler() {
    		return /*mouseover_handler*/ ctx[26](/*i*/ ctx[42]);
    	}

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[27](/*item*/ ctx[40], /*i*/ ctx[42], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "listItem");
    			add_location(div, file$6, 284, 12, 8294);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseover", mouseover_handler, false, false, false),
    					listen_dev(div, "click", click_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const switch_instance_changes = {};
    			if (dirty[1] & /*item*/ 512) switch_instance_changes.item = /*item*/ ctx[40];
    			if (dirty[0] & /*filterText*/ 8192) switch_instance_changes.filterText = /*filterText*/ ctx[13];
    			if (dirty[0] & /*getOptionLabel*/ 64) switch_instance_changes.getOptionLabel = /*getOptionLabel*/ ctx[6];
    			if (dirty[1] & /*i*/ 2048) switch_instance_changes.isFirst = isItemFirst(/*i*/ ctx[42]);
    			if (dirty[0] & /*value, optionIdentifier*/ 1536 | dirty[1] & /*item*/ 512) switch_instance_changes.isActive = isItemActive(/*item*/ ctx[40], /*value*/ ctx[9], /*optionIdentifier*/ ctx[10]);
    			if (dirty[0] & /*hoverItemIndex, items*/ 34 | dirty[1] & /*item, i*/ 2560) switch_instance_changes.isHover = isItemHover(/*hoverItemIndex*/ ctx[1], /*item*/ ctx[40], /*i*/ ctx[42], /*items*/ ctx[5]);

    			if (switch_value !== (switch_value = /*Item*/ ctx[3])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(279:8) <svelte:component             this={VirtualList}             {items}             {itemHeight}             let:item             let:i>",
    		ctx
    	});

    	return block;
    }

    // (302:0) {#if !isVirtualList}
    function create_if_block$3(ctx) {
    	let div;
    	let current;
    	let each_value = /*items*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block_1(ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(div, "class", "listContainer svelte-1uyqfml");
    			attr_dev(div, "style", /*listStyle*/ ctx[14]);
    			add_location(div, file$6, 302, 4, 8905);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(div, null);
    			}

    			/*div_binding_1*/ ctx[31](div);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*getGroupHeaderLabel, items, handleHover, handleClick, Item, filterText, getOptionLabel, value, optionIdentifier, hoverItemIndex, noOptionsMessage, hideEmptyState*/ 114410) {
    				each_value = /*items*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block_1(ctx);
    					each_1_else.c();
    					each_1_else.m(div, null);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}

    			if (!current || dirty[0] & /*listStyle*/ 16384) {
    				attr_dev(div, "style", /*listStyle*/ ctx[14]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    			/*div_binding_1*/ ctx[31](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(302:0) {#if !isVirtualList}",
    		ctx
    	});

    	return block;
    }

    // (322:8) {:else}
    function create_else_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = !/*hideEmptyState*/ ctx[11] && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*hideEmptyState*/ ctx[11]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(322:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (323:12) {#if !hideEmptyState}
    function create_if_block_2$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*noOptionsMessage*/ ctx[12]);
    			attr_dev(div, "class", "empty svelte-1uyqfml");
    			add_location(div, file$6, 323, 16, 9851);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*noOptionsMessage*/ 4096) set_data_dev(t, /*noOptionsMessage*/ ctx[12]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(323:12) {#if !hideEmptyState}",
    		ctx
    	});

    	return block;
    }

    // (307:12) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let switch_instance;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*Item*/ ctx[3];

    	function switch_props(ctx) {
    		return {
    			props: {
    				item: /*item*/ ctx[40],
    				filterText: /*filterText*/ ctx[13],
    				getOptionLabel: /*getOptionLabel*/ ctx[6],
    				isFirst: isItemFirst(/*i*/ ctx[42]),
    				isActive: isItemActive(/*item*/ ctx[40], /*value*/ ctx[9], /*optionIdentifier*/ ctx[10]),
    				isHover: isItemHover(/*hoverItemIndex*/ ctx[1], /*item*/ ctx[40], /*i*/ ctx[42], /*items*/ ctx[5])
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	function mouseover_handler_1() {
    		return /*mouseover_handler_1*/ ctx[29](/*i*/ ctx[42]);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[30](/*item*/ ctx[40], /*i*/ ctx[42], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "listItem");
    			add_location(div, file$6, 307, 16, 9179);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			append_dev(div, t);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseover", mouseover_handler_1, false, false, false),
    					listen_dev(div, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const switch_instance_changes = {};
    			if (dirty[0] & /*items*/ 32) switch_instance_changes.item = /*item*/ ctx[40];
    			if (dirty[0] & /*filterText*/ 8192) switch_instance_changes.filterText = /*filterText*/ ctx[13];
    			if (dirty[0] & /*getOptionLabel*/ 64) switch_instance_changes.getOptionLabel = /*getOptionLabel*/ ctx[6];
    			if (dirty[0] & /*items, value, optionIdentifier*/ 1568) switch_instance_changes.isActive = isItemActive(/*item*/ ctx[40], /*value*/ ctx[9], /*optionIdentifier*/ ctx[10]);
    			if (dirty[0] & /*hoverItemIndex, items*/ 34) switch_instance_changes.isHover = isItemHover(/*hoverItemIndex*/ ctx[1], /*item*/ ctx[40], /*i*/ ctx[42], /*items*/ ctx[5]);

    			if (switch_value !== (switch_value = /*Item*/ ctx[3])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, t);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(307:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (305:12) {#if item.isGroupHeader && !item.isSelectable}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t_value = /*getGroupHeaderLabel*/ ctx[7](/*item*/ ctx[40]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "listGroupTitle svelte-1uyqfml");
    			add_location(div, file$6, 305, 16, 9081);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*getGroupHeaderLabel, items*/ 160 && t_value !== (t_value = /*getGroupHeaderLabel*/ ctx[7](/*item*/ ctx[40]) + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(305:12) {#if item.isGroupHeader && !item.isSelectable}",
    		ctx
    	});

    	return block;
    }

    // (304:8) {#each items as item, i}
    function create_each_block$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[40].isGroupHeader && !/*item*/ ctx[40].isSelectable) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(304:8) {#each items as item, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*isVirtualList*/ ctx[4] && create_if_block_3$1(ctx);
    	let if_block1 = !/*isVirtualList*/ ctx[4] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keydown", /*handleKeyDown*/ ctx[17], false, false, false),
    					listen_dev(window, "resize", /*computePlacement*/ ctx[18], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*isVirtualList*/ ctx[4]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*isVirtualList*/ 16) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*isVirtualList*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*isVirtualList*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isItemActive(item, value, optionIdentifier) {
    	return value && value[optionIdentifier] === item[optionIdentifier];
    }

    function isItemFirst(itemIndex) {
    	return itemIndex === 0;
    }

    function isItemHover(hoverItemIndex, item, itemIndex, items) {
    	return hoverItemIndex === itemIndex || items.length === 1;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("List", slots, []);
    	const dispatch = createEventDispatcher();
    	let { container = undefined } = $$props;
    	let { VirtualList = null } = $$props;
    	let { Item: Item$1 = Item } = $$props;
    	let { isVirtualList = false } = $$props;
    	let { items = [] } = $$props;
    	let { labelIdentifier = "label" } = $$props;

    	let { getOptionLabel = (option, filterText) => {
    		if (option) return option.isCreator
    		? `Create \"${filterText}\"`
    		: option[labelIdentifier];
    	} } = $$props;

    	let { getGroupHeaderLabel = option => {
    		return option[labelIdentifier];
    	} } = $$props;

    	let { itemHeight = 40 } = $$props;
    	let { hoverItemIndex = 0 } = $$props;
    	let { value = undefined } = $$props;
    	let { optionIdentifier = "value" } = $$props;
    	let { hideEmptyState = false } = $$props;
    	let { noOptionsMessage = "No options" } = $$props;
    	let { isMulti = false } = $$props;
    	let { activeItemIndex = 0 } = $$props;
    	let { filterText = "" } = $$props;
    	let { parent = null } = $$props;
    	let { listPlacement = null } = $$props;
    	let { listAutoWidth = null } = $$props;
    	let { listOffset = 5 } = $$props;
    	let isScrollingTimer = 0;
    	let isScrolling = false;
    	let prev_items;

    	onMount(() => {
    		if (items.length > 0 && !isMulti && value) {
    			const _hoverItemIndex = items.findIndex(item => item[optionIdentifier] === value[optionIdentifier]);

    			if (_hoverItemIndex) {
    				$$invalidate(1, hoverItemIndex = _hoverItemIndex);
    			}
    		}

    		scrollToActiveItem("active");

    		container.addEventListener(
    			"scroll",
    			() => {
    				clearTimeout(isScrollingTimer);

    				isScrollingTimer = setTimeout(
    					() => {
    						isScrolling = false;
    					},
    					100
    				);
    			},
    			false
    		);
    	});

    	beforeUpdate(() => {
    		if (items !== prev_items && items.length > 0) {
    			$$invalidate(1, hoverItemIndex = 0);
    		}

    		prev_items = items;
    	});

    	function handleSelect(item) {
    		if (item.isCreator) return;
    		dispatch("itemSelected", item);
    	}

    	function handleHover(i) {
    		if (isScrolling) return;
    		$$invalidate(1, hoverItemIndex = i);
    	}

    	function handleClick(args) {
    		const { item, i, event } = args;
    		event.stopPropagation();
    		if (value && !isMulti && value[optionIdentifier] === item[optionIdentifier]) return closeList();

    		if (item.isCreator) {
    			dispatch("itemCreated", filterText);
    		} else {
    			$$invalidate(19, activeItemIndex = i);
    			$$invalidate(1, hoverItemIndex = i);
    			handleSelect(item);
    		}
    	}

    	function closeList() {
    		dispatch("closeList");
    	}

    	async function updateHoverItem(increment) {
    		if (isVirtualList) return;
    		let isNonSelectableItem = true;

    		while (isNonSelectableItem) {
    			if (increment > 0 && hoverItemIndex === items.length - 1) {
    				$$invalidate(1, hoverItemIndex = 0);
    			} else if (increment < 0 && hoverItemIndex === 0) {
    				$$invalidate(1, hoverItemIndex = items.length - 1);
    			} else {
    				$$invalidate(1, hoverItemIndex = hoverItemIndex + increment);
    			}

    			isNonSelectableItem = items[hoverItemIndex].isGroupHeader && !items[hoverItemIndex].isSelectable;
    		}

    		await tick();
    		scrollToActiveItem("hover");
    	}

    	function handleKeyDown(e) {
    		switch (e.key) {
    			case "Escape":
    				e.preventDefault();
    				closeList();
    				break;
    			case "ArrowDown":
    				e.preventDefault();
    				items.length && updateHoverItem(1);
    				break;
    			case "ArrowUp":
    				e.preventDefault();
    				items.length && updateHoverItem(-1);
    				break;
    			case "Enter":
    				e.preventDefault();
    				if (items.length === 0) break;
    				const hoverItem = items[hoverItemIndex];
    				if (value && !isMulti && value[optionIdentifier] === hoverItem[optionIdentifier]) {
    					closeList();
    					break;
    				}
    				if (hoverItem.isCreator) {
    					dispatch("itemCreated", filterText);
    				} else {
    					$$invalidate(19, activeItemIndex = hoverItemIndex);
    					handleSelect(items[hoverItemIndex]);
    				}
    				break;
    			case "Tab":
    				e.preventDefault();
    				if (items.length === 0) break;
    				if (value && value[optionIdentifier] === items[hoverItemIndex][optionIdentifier]) return closeList();
    				$$invalidate(19, activeItemIndex = hoverItemIndex);
    				handleSelect(items[hoverItemIndex]);
    				break;
    		}
    	}

    	function scrollToActiveItem(className) {
    		if (isVirtualList || !container) return;
    		let offsetBounding;
    		const focusedElemBounding = container.querySelector(`.listItem .${className}`);

    		if (focusedElemBounding) {
    			offsetBounding = container.getBoundingClientRect().bottom - focusedElemBounding.getBoundingClientRect().bottom;
    		}

    		$$invalidate(0, container.scrollTop -= offsetBounding, container);
    	}

    	let listStyle;

    	function computePlacement() {
    		const { top, height, width } = parent.getBoundingClientRect();
    		$$invalidate(14, listStyle = "");
    		$$invalidate(14, listStyle += `min-width:${width}px;width:${listAutoWidth ? "auto" : "100%"};`);

    		if (listPlacement === "top" || listPlacement === "auto" && isOutOfViewport(parent).bottom) {
    			$$invalidate(14, listStyle += `bottom:${height + listOffset}px;`);
    		} else {
    			$$invalidate(14, listStyle += `top:${height + listOffset}px;`);
    		}
    	}

    	const writable_props = [
    		"container",
    		"VirtualList",
    		"Item",
    		"isVirtualList",
    		"items",
    		"labelIdentifier",
    		"getOptionLabel",
    		"getGroupHeaderLabel",
    		"itemHeight",
    		"hoverItemIndex",
    		"value",
    		"optionIdentifier",
    		"hideEmptyState",
    		"noOptionsMessage",
    		"isMulti",
    		"activeItemIndex",
    		"filterText",
    		"parent",
    		"listPlacement",
    		"listAutoWidth",
    		"listOffset"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	const mouseover_handler = i => handleHover(i);
    	const click_handler = (item, i, event) => handleClick({ item, i, event });

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	const mouseover_handler_1 = i => handleHover(i);
    	const click_handler_1 = (item, i, event) => handleClick({ item, i, event });

    	function div_binding_1($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    		if ("VirtualList" in $$props) $$invalidate(2, VirtualList = $$props.VirtualList);
    		if ("Item" in $$props) $$invalidate(3, Item$1 = $$props.Item);
    		if ("isVirtualList" in $$props) $$invalidate(4, isVirtualList = $$props.isVirtualList);
    		if ("items" in $$props) $$invalidate(5, items = $$props.items);
    		if ("labelIdentifier" in $$props) $$invalidate(20, labelIdentifier = $$props.labelIdentifier);
    		if ("getOptionLabel" in $$props) $$invalidate(6, getOptionLabel = $$props.getOptionLabel);
    		if ("getGroupHeaderLabel" in $$props) $$invalidate(7, getGroupHeaderLabel = $$props.getGroupHeaderLabel);
    		if ("itemHeight" in $$props) $$invalidate(8, itemHeight = $$props.itemHeight);
    		if ("hoverItemIndex" in $$props) $$invalidate(1, hoverItemIndex = $$props.hoverItemIndex);
    		if ("value" in $$props) $$invalidate(9, value = $$props.value);
    		if ("optionIdentifier" in $$props) $$invalidate(10, optionIdentifier = $$props.optionIdentifier);
    		if ("hideEmptyState" in $$props) $$invalidate(11, hideEmptyState = $$props.hideEmptyState);
    		if ("noOptionsMessage" in $$props) $$invalidate(12, noOptionsMessage = $$props.noOptionsMessage);
    		if ("isMulti" in $$props) $$invalidate(21, isMulti = $$props.isMulti);
    		if ("activeItemIndex" in $$props) $$invalidate(19, activeItemIndex = $$props.activeItemIndex);
    		if ("filterText" in $$props) $$invalidate(13, filterText = $$props.filterText);
    		if ("parent" in $$props) $$invalidate(22, parent = $$props.parent);
    		if ("listPlacement" in $$props) $$invalidate(23, listPlacement = $$props.listPlacement);
    		if ("listAutoWidth" in $$props) $$invalidate(24, listAutoWidth = $$props.listAutoWidth);
    		if ("listOffset" in $$props) $$invalidate(25, listOffset = $$props.listOffset);
    	};

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		createEventDispatcher,
    		onMount,
    		tick,
    		isOutOfViewport,
    		ItemComponent: Item,
    		dispatch,
    		container,
    		VirtualList,
    		Item: Item$1,
    		isVirtualList,
    		items,
    		labelIdentifier,
    		getOptionLabel,
    		getGroupHeaderLabel,
    		itemHeight,
    		hoverItemIndex,
    		value,
    		optionIdentifier,
    		hideEmptyState,
    		noOptionsMessage,
    		isMulti,
    		activeItemIndex,
    		filterText,
    		parent,
    		listPlacement,
    		listAutoWidth,
    		listOffset,
    		isScrollingTimer,
    		isScrolling,
    		prev_items,
    		handleSelect,
    		handleHover,
    		handleClick,
    		closeList,
    		updateHoverItem,
    		handleKeyDown,
    		scrollToActiveItem,
    		isItemActive,
    		isItemFirst,
    		isItemHover,
    		listStyle,
    		computePlacement
    	});

    	$$self.$inject_state = $$props => {
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    		if ("VirtualList" in $$props) $$invalidate(2, VirtualList = $$props.VirtualList);
    		if ("Item" in $$props) $$invalidate(3, Item$1 = $$props.Item);
    		if ("isVirtualList" in $$props) $$invalidate(4, isVirtualList = $$props.isVirtualList);
    		if ("items" in $$props) $$invalidate(5, items = $$props.items);
    		if ("labelIdentifier" in $$props) $$invalidate(20, labelIdentifier = $$props.labelIdentifier);
    		if ("getOptionLabel" in $$props) $$invalidate(6, getOptionLabel = $$props.getOptionLabel);
    		if ("getGroupHeaderLabel" in $$props) $$invalidate(7, getGroupHeaderLabel = $$props.getGroupHeaderLabel);
    		if ("itemHeight" in $$props) $$invalidate(8, itemHeight = $$props.itemHeight);
    		if ("hoverItemIndex" in $$props) $$invalidate(1, hoverItemIndex = $$props.hoverItemIndex);
    		if ("value" in $$props) $$invalidate(9, value = $$props.value);
    		if ("optionIdentifier" in $$props) $$invalidate(10, optionIdentifier = $$props.optionIdentifier);
    		if ("hideEmptyState" in $$props) $$invalidate(11, hideEmptyState = $$props.hideEmptyState);
    		if ("noOptionsMessage" in $$props) $$invalidate(12, noOptionsMessage = $$props.noOptionsMessage);
    		if ("isMulti" in $$props) $$invalidate(21, isMulti = $$props.isMulti);
    		if ("activeItemIndex" in $$props) $$invalidate(19, activeItemIndex = $$props.activeItemIndex);
    		if ("filterText" in $$props) $$invalidate(13, filterText = $$props.filterText);
    		if ("parent" in $$props) $$invalidate(22, parent = $$props.parent);
    		if ("listPlacement" in $$props) $$invalidate(23, listPlacement = $$props.listPlacement);
    		if ("listAutoWidth" in $$props) $$invalidate(24, listAutoWidth = $$props.listAutoWidth);
    		if ("listOffset" in $$props) $$invalidate(25, listOffset = $$props.listOffset);
    		if ("isScrollingTimer" in $$props) isScrollingTimer = $$props.isScrollingTimer;
    		if ("isScrolling" in $$props) isScrolling = $$props.isScrolling;
    		if ("prev_items" in $$props) prev_items = $$props.prev_items;
    		if ("listStyle" in $$props) $$invalidate(14, listStyle = $$props.listStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*parent, container*/ 4194305) {
    			{
    				if (parent && container) computePlacement();
    			}
    		}
    	};

    	return [
    		container,
    		hoverItemIndex,
    		VirtualList,
    		Item$1,
    		isVirtualList,
    		items,
    		getOptionLabel,
    		getGroupHeaderLabel,
    		itemHeight,
    		value,
    		optionIdentifier,
    		hideEmptyState,
    		noOptionsMessage,
    		filterText,
    		listStyle,
    		handleHover,
    		handleClick,
    		handleKeyDown,
    		computePlacement,
    		activeItemIndex,
    		labelIdentifier,
    		isMulti,
    		parent,
    		listPlacement,
    		listAutoWidth,
    		listOffset,
    		mouseover_handler,
    		click_handler,
    		div_binding,
    		mouseover_handler_1,
    		click_handler_1,
    		div_binding_1
    	];
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$6,
    			create_fragment$6,
    			safe_not_equal,
    			{
    				container: 0,
    				VirtualList: 2,
    				Item: 3,
    				isVirtualList: 4,
    				items: 5,
    				labelIdentifier: 20,
    				getOptionLabel: 6,
    				getGroupHeaderLabel: 7,
    				itemHeight: 8,
    				hoverItemIndex: 1,
    				value: 9,
    				optionIdentifier: 10,
    				hideEmptyState: 11,
    				noOptionsMessage: 12,
    				isMulti: 21,
    				activeItemIndex: 19,
    				filterText: 13,
    				parent: 22,
    				listPlacement: 23,
    				listAutoWidth: 24,
    				listOffset: 25
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "List",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get container() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set container(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get VirtualList() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set VirtualList(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Item() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Item(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isVirtualList() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isVirtualList(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get items() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelIdentifier() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelIdentifier(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getOptionLabel() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getOptionLabel(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getGroupHeaderLabel() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getGroupHeaderLabel(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get itemHeight() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemHeight(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hoverItemIndex() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hoverItemIndex(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get optionIdentifier() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set optionIdentifier(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideEmptyState() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideEmptyState(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noOptionsMessage() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noOptionsMessage(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isMulti() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isMulti(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeItemIndex() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeItemIndex(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filterText() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filterText(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get parent() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set parent(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listPlacement() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listPlacement(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listAutoWidth() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listAutoWidth(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listOffset() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listOffset(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-select\src\Selection.svelte generated by Svelte v3.38.3 */

    const file$5 = "node_modules\\svelte-select\\src\\Selection.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let raw_value = /*getSelectionLabel*/ ctx[0](/*item*/ ctx[1]) + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "selection svelte-pu1q1n");
    			add_location(div, file$5, 13, 0, 230);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*getSelectionLabel, item*/ 3 && raw_value !== (raw_value = /*getSelectionLabel*/ ctx[0](/*item*/ ctx[1]) + "")) div.innerHTML = raw_value;		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Selection", slots, []);
    	let { getSelectionLabel = undefined } = $$props;
    	let { item = undefined } = $$props;
    	const writable_props = ["getSelectionLabel", "item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Selection> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("getSelectionLabel" in $$props) $$invalidate(0, getSelectionLabel = $$props.getSelectionLabel);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ getSelectionLabel, item });

    	$$self.$inject_state = $$props => {
    		if ("getSelectionLabel" in $$props) $$invalidate(0, getSelectionLabel = $$props.getSelectionLabel);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [getSelectionLabel, item];
    }

    class Selection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { getSelectionLabel: 0, item: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Selection",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get getSelectionLabel() {
    		throw new Error("<Selection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getSelectionLabel(value) {
    		throw new Error("<Selection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get item() {
    		throw new Error("<Selection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Selection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-select\src\MultiSelection.svelte generated by Svelte v3.38.3 */
    const file$4 = "node_modules\\svelte-select\\src\\MultiSelection.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (88:8) {#if !isDisabled && !multiFullItemClearable}
    function create_if_block$2(ctx) {
    	let div;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*i*/ ctx[10], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124 l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z");
    			add_location(path, file$4, 99, 20, 3025);
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "viewBox", "-2 -2 50 50");
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "role", "presentation");
    			attr_dev(svg, "class", "svelte-liu9pa");
    			add_location(svg, file$4, 92, 16, 2795);
    			attr_dev(div, "class", "multiSelectItem_clear svelte-liu9pa");
    			add_location(div, file$4, 88, 12, 2654);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(88:8) {#if !isDisabled && !multiFullItemClearable}",
    		ctx
    	});

    	return block;
    }

    // (77:0) {#each value as value, i}
    function create_each_block$2(ctx) {
    	let div1;
    	let div0;
    	let raw_value = /*getSelectionLabel*/ ctx[3](/*value*/ ctx[4]) + "";
    	let t0;
    	let t1;
    	let div1_class_value;
    	let mounted;
    	let dispose;
    	let if_block = !/*isDisabled*/ ctx[1] && !/*multiFullItemClearable*/ ctx[2] && create_if_block$2(ctx);

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[7](/*i*/ ctx[10], ...args);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			attr_dev(div0, "class", "multiSelectItem_label svelte-liu9pa");
    			add_location(div0, file$4, 84, 8, 2493);
    			attr_dev(div1, "class", div1_class_value = "multiSelectItem " + (/*activeValue*/ ctx[0] === /*i*/ ctx[10] ? "active" : "") + " " + (/*isDisabled*/ ctx[1] ? "disabled" : "") + " svelte-liu9pa");
    			add_location(div1, file$4, 77, 4, 2257);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			div0.innerHTML = raw_value;
    			append_dev(div1, t0);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t1);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*getSelectionLabel, value*/ 24 && raw_value !== (raw_value = /*getSelectionLabel*/ ctx[3](/*value*/ ctx[4]) + "")) div0.innerHTML = raw_value;
    			if (!/*isDisabled*/ ctx[1] && !/*multiFullItemClearable*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*activeValue, isDisabled*/ 3 && div1_class_value !== (div1_class_value = "multiSelectItem " + (/*activeValue*/ ctx[0] === /*i*/ ctx[10] ? "active" : "") + " " + (/*isDisabled*/ ctx[1] ? "disabled" : "") + " svelte-liu9pa")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(77:0) {#each value as value, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let each_1_anchor;
    	let each_value = /*value*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeValue, isDisabled, multiFullItemClearable, handleClear, getSelectionLabel, value*/ 63) {
    				each_value = /*value*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MultiSelection", slots, []);
    	const dispatch = createEventDispatcher();
    	let { value = [] } = $$props;
    	let { activeValue = undefined } = $$props;
    	let { isDisabled = false } = $$props;
    	let { multiFullItemClearable = false } = $$props;
    	let { getSelectionLabel = undefined } = $$props;

    	function handleClear(i, event) {
    		event.stopPropagation();
    		dispatch("multiItemClear", { i });
    	}

    	const writable_props = [
    		"value",
    		"activeValue",
    		"isDisabled",
    		"multiFullItemClearable",
    		"getSelectionLabel"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MultiSelection> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (i, event) => handleClear(i, event);
    	const click_handler_1 = (i, event) => multiFullItemClearable ? handleClear(i, event) : {};

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(4, value = $$props.value);
    		if ("activeValue" in $$props) $$invalidate(0, activeValue = $$props.activeValue);
    		if ("isDisabled" in $$props) $$invalidate(1, isDisabled = $$props.isDisabled);
    		if ("multiFullItemClearable" in $$props) $$invalidate(2, multiFullItemClearable = $$props.multiFullItemClearable);
    		if ("getSelectionLabel" in $$props) $$invalidate(3, getSelectionLabel = $$props.getSelectionLabel);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		value,
    		activeValue,
    		isDisabled,
    		multiFullItemClearable,
    		getSelectionLabel,
    		handleClear
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(4, value = $$props.value);
    		if ("activeValue" in $$props) $$invalidate(0, activeValue = $$props.activeValue);
    		if ("isDisabled" in $$props) $$invalidate(1, isDisabled = $$props.isDisabled);
    		if ("multiFullItemClearable" in $$props) $$invalidate(2, multiFullItemClearable = $$props.multiFullItemClearable);
    		if ("getSelectionLabel" in $$props) $$invalidate(3, getSelectionLabel = $$props.getSelectionLabel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		activeValue,
    		isDisabled,
    		multiFullItemClearable,
    		getSelectionLabel,
    		value,
    		handleClear,
    		click_handler,
    		click_handler_1
    	];
    }

    class MultiSelection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			value: 4,
    			activeValue: 0,
    			isDisabled: 1,
    			multiFullItemClearable: 2,
    			getSelectionLabel: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MultiSelection",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get value() {
    		throw new Error("<MultiSelection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<MultiSelection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeValue() {
    		throw new Error("<MultiSelection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeValue(value) {
    		throw new Error("<MultiSelection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isDisabled() {
    		throw new Error("<MultiSelection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isDisabled(value) {
    		throw new Error("<MultiSelection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiFullItemClearable() {
    		throw new Error("<MultiSelection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiFullItemClearable(value) {
    		throw new Error("<MultiSelection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getSelectionLabel() {
    		throw new Error("<MultiSelection>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getSelectionLabel(value) {
    		throw new Error("<MultiSelection>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-select\src\VirtualList.svelte generated by Svelte v3.38.3 */
    const file$3 = "node_modules\\svelte-select\\src\\VirtualList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    const get_default_slot_changes = dirty => ({
    	item: dirty & /*visible*/ 32,
    	i: dirty & /*visible*/ 32,
    	hoverItemIndex: dirty & /*hoverItemIndex*/ 2
    });

    const get_default_slot_context = ctx => ({
    	item: /*row*/ ctx[23].data,
    	i: /*row*/ ctx[23].index,
    	hoverItemIndex: /*hoverItemIndex*/ ctx[1]
    });

    // (154:69) Missing template
    function fallback_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Missing template");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(154:69) Missing template",
    		ctx
    	});

    	return block;
    }

    // (152:8) {#each visible as row (row.index)}
    function create_each_block$1(key_1, ctx) {
    	let svelte_virtual_list_row;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			svelte_virtual_list_row = element("svelte-virtual-list-row");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			t = space();
    			set_custom_element_data(svelte_virtual_list_row, "class", "svelte-g2cagw");
    			add_location(svelte_virtual_list_row, file$3, 152, 12, 3778);
    			this.first = svelte_virtual_list_row;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svelte_virtual_list_row, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svelte_virtual_list_row, null);
    			}

    			append_dev(svelte_virtual_list_row, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, visible, hoverItemIndex*/ 16418)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], !current ? -1 : dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svelte_virtual_list_row);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(152:8) {#each visible as row (row.index)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let svelte_virtual_list_viewport;
    	let svelte_virtual_list_contents;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let svelte_virtual_list_viewport_resize_listener;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*visible*/ ctx[5];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*row*/ ctx[23].index;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			svelte_virtual_list_viewport = element("svelte-virtual-list-viewport");
    			svelte_virtual_list_contents = element("svelte-virtual-list-contents");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(svelte_virtual_list_contents, "padding-top", /*top*/ ctx[6] + "px");
    			set_style(svelte_virtual_list_contents, "padding-bottom", /*bottom*/ ctx[7] + "px");
    			set_custom_element_data(svelte_virtual_list_contents, "class", "svelte-g2cagw");
    			add_location(svelte_virtual_list_contents, file$3, 148, 4, 3597);
    			set_style(svelte_virtual_list_viewport, "height", /*height*/ ctx[0]);
    			set_custom_element_data(svelte_virtual_list_viewport, "class", "svelte-g2cagw");
    			add_render_callback(() => /*svelte_virtual_list_viewport_elementresize_handler*/ ctx[18].call(svelte_virtual_list_viewport));
    			add_location(svelte_virtual_list_viewport, file$3, 143, 0, 3437);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svelte_virtual_list_viewport, anchor);
    			append_dev(svelte_virtual_list_viewport, svelte_virtual_list_contents);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svelte_virtual_list_contents, null);
    			}

    			/*svelte_virtual_list_contents_binding*/ ctx[16](svelte_virtual_list_contents);
    			/*svelte_virtual_list_viewport_binding*/ ctx[17](svelte_virtual_list_viewport);
    			svelte_virtual_list_viewport_resize_listener = add_resize_listener(svelte_virtual_list_viewport, /*svelte_virtual_list_viewport_elementresize_handler*/ ctx[18].bind(svelte_virtual_list_viewport));
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(svelte_virtual_list_viewport, "scroll", /*handle_scroll*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$$scope, visible, hoverItemIndex*/ 16418) {
    				each_value = /*visible*/ ctx[5];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, svelte_virtual_list_contents, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}

    			if (!current || dirty & /*top*/ 64) {
    				set_style(svelte_virtual_list_contents, "padding-top", /*top*/ ctx[6] + "px");
    			}

    			if (!current || dirty & /*bottom*/ 128) {
    				set_style(svelte_virtual_list_contents, "padding-bottom", /*bottom*/ ctx[7] + "px");
    			}

    			if (!current || dirty & /*height*/ 1) {
    				set_style(svelte_virtual_list_viewport, "height", /*height*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svelte_virtual_list_viewport);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*svelte_virtual_list_contents_binding*/ ctx[16](null);
    			/*svelte_virtual_list_viewport_binding*/ ctx[17](null);
    			svelte_virtual_list_viewport_resize_listener();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("VirtualList", slots, ['default']);
    	let { items = undefined } = $$props;
    	let { height = "100%" } = $$props;
    	let { itemHeight = 40 } = $$props;
    	let { hoverItemIndex = 0 } = $$props;
    	let { start = 0 } = $$props;
    	let { end = 0 } = $$props;
    	let height_map = [];
    	let rows;
    	let viewport;
    	let contents;
    	let viewport_height = 0;
    	let visible;
    	let mounted;
    	let top = 0;
    	let bottom = 0;
    	let average_height;

    	async function refresh(items, viewport_height, itemHeight) {
    		const { scrollTop } = viewport;
    		await tick();
    		let content_height = top - scrollTop;
    		let i = start;

    		while (content_height < viewport_height && i < items.length) {
    			let row = rows[i - start];

    			if (!row) {
    				$$invalidate(10, end = i + 1);
    				await tick();
    				row = rows[i - start];
    			}

    			const row_height = height_map[i] = itemHeight || row.offsetHeight;
    			content_height += row_height;
    			i += 1;
    		}

    		$$invalidate(10, end = i);
    		const remaining = items.length - end;
    		average_height = (top + content_height) / end;
    		$$invalidate(7, bottom = remaining * average_height);
    		height_map.length = items.length;
    		if (viewport) $$invalidate(3, viewport.scrollTop = 0, viewport);
    	}

    	async function handle_scroll() {
    		const { scrollTop } = viewport;
    		const old_start = start;

    		for (let v = 0; v < rows.length; v += 1) {
    			height_map[start + v] = itemHeight || rows[v].offsetHeight;
    		}

    		let i = 0;
    		let y = 0;

    		while (i < items.length) {
    			const row_height = height_map[i] || average_height;

    			if (y + row_height > scrollTop) {
    				$$invalidate(9, start = i);
    				$$invalidate(6, top = y);
    				break;
    			}

    			y += row_height;
    			i += 1;
    		}

    		while (i < items.length) {
    			y += height_map[i] || average_height;
    			i += 1;
    			if (y > scrollTop + viewport_height) break;
    		}

    		$$invalidate(10, end = i);
    		const remaining = items.length - end;
    		average_height = y / end;
    		while (i < items.length) height_map[i++] = average_height;
    		$$invalidate(7, bottom = remaining * average_height);

    		if (start < old_start) {
    			await tick();
    			let expected_height = 0;
    			let actual_height = 0;

    			for (let i = start; i < old_start; i += 1) {
    				if (rows[i - start]) {
    					expected_height += height_map[i];
    					actual_height += itemHeight || rows[i - start].offsetHeight;
    				}
    			}

    			const d = actual_height - expected_height;
    			viewport.scrollTo(0, scrollTop + d);
    		}
    	}

    	onMount(() => {
    		rows = contents.getElementsByTagName("svelte-virtual-list-row");
    		$$invalidate(13, mounted = true);
    	});

    	const writable_props = ["items", "height", "itemHeight", "hoverItemIndex", "start", "end"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VirtualList> was created with unknown prop '${key}'`);
    	});

    	function svelte_virtual_list_contents_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			contents = $$value;
    			$$invalidate(4, contents);
    		});
    	}

    	function svelte_virtual_list_viewport_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			viewport = $$value;
    			$$invalidate(3, viewport);
    		});
    	}

    	function svelte_virtual_list_viewport_elementresize_handler() {
    		viewport_height = this.offsetHeight;
    		$$invalidate(2, viewport_height);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(11, items = $$props.items);
    		if ("height" in $$props) $$invalidate(0, height = $$props.height);
    		if ("itemHeight" in $$props) $$invalidate(12, itemHeight = $$props.itemHeight);
    		if ("hoverItemIndex" in $$props) $$invalidate(1, hoverItemIndex = $$props.hoverItemIndex);
    		if ("start" in $$props) $$invalidate(9, start = $$props.start);
    		if ("end" in $$props) $$invalidate(10, end = $$props.end);
    		if ("$$scope" in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		tick,
    		items,
    		height,
    		itemHeight,
    		hoverItemIndex,
    		start,
    		end,
    		height_map,
    		rows,
    		viewport,
    		contents,
    		viewport_height,
    		visible,
    		mounted,
    		top,
    		bottom,
    		average_height,
    		refresh,
    		handle_scroll
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(11, items = $$props.items);
    		if ("height" in $$props) $$invalidate(0, height = $$props.height);
    		if ("itemHeight" in $$props) $$invalidate(12, itemHeight = $$props.itemHeight);
    		if ("hoverItemIndex" in $$props) $$invalidate(1, hoverItemIndex = $$props.hoverItemIndex);
    		if ("start" in $$props) $$invalidate(9, start = $$props.start);
    		if ("end" in $$props) $$invalidate(10, end = $$props.end);
    		if ("height_map" in $$props) height_map = $$props.height_map;
    		if ("rows" in $$props) rows = $$props.rows;
    		if ("viewport" in $$props) $$invalidate(3, viewport = $$props.viewport);
    		if ("contents" in $$props) $$invalidate(4, contents = $$props.contents);
    		if ("viewport_height" in $$props) $$invalidate(2, viewport_height = $$props.viewport_height);
    		if ("visible" in $$props) $$invalidate(5, visible = $$props.visible);
    		if ("mounted" in $$props) $$invalidate(13, mounted = $$props.mounted);
    		if ("top" in $$props) $$invalidate(6, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(7, bottom = $$props.bottom);
    		if ("average_height" in $$props) average_height = $$props.average_height;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*items, start, end*/ 3584) {
    			$$invalidate(5, visible = items.slice(start, end).map((data, i) => {
    				return { index: i + start, data };
    			}));
    		}

    		if ($$self.$$.dirty & /*mounted, items, viewport_height, itemHeight*/ 14340) {
    			if (mounted) refresh(items, viewport_height, itemHeight);
    		}
    	};

    	return [
    		height,
    		hoverItemIndex,
    		viewport_height,
    		viewport,
    		contents,
    		visible,
    		top,
    		bottom,
    		handle_scroll,
    		start,
    		end,
    		items,
    		itemHeight,
    		mounted,
    		$$scope,
    		slots,
    		svelte_virtual_list_contents_binding,
    		svelte_virtual_list_viewport_binding,
    		svelte_virtual_list_viewport_elementresize_handler
    	];
    }

    class VirtualList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			items: 11,
    			height: 0,
    			itemHeight: 12,
    			hoverItemIndex: 1,
    			start: 9,
    			end: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VirtualList",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get items() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get itemHeight() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemHeight(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hoverItemIndex() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hoverItemIndex(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get start() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set start(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get end() {
    		throw new Error("<VirtualList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set end(value) {
    		throw new Error("<VirtualList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\svelte-select\src\ClearIcon.svelte generated by Svelte v3.38.3 */

    const file$2 = "node_modules\\svelte-select\\src\\ClearIcon.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill", "currentColor");
    			attr_dev(path, "d", "M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124\n    l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z");
    			add_location(path, file$2, 7, 4, 118);
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "viewBox", "-2 -2 50 50");
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "role", "presentation");
    			add_location(svg, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ClearIcon", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ClearIcon> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ClearIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClearIcon",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    function debounce(func, wait, immediate) {
        let timeout;

        return function executedFunction() {
            let context = this;
            let args = arguments;

            let later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };

            let callNow = immediate && !timeout;

            clearTimeout(timeout);

            timeout = setTimeout(later, wait);

            if (callNow) func.apply(context, args);
        };
    }

    /* node_modules\svelte-select\src\Select.svelte generated by Svelte v3.38.3 */

    const { Object: Object_1, console: console_1 } = globals;
    const file$1 = "node_modules\\svelte-select\\src\\Select.svelte";

    // (833:4) {#if Icon}
    function create_if_block_7(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*iconProps*/ ctx[17]];
    	var switch_value = /*Icon*/ ctx[16];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty[0] & /*iconProps*/ 131072)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*iconProps*/ ctx[17])])
    			: {};

    			if (switch_value !== (switch_value = /*Icon*/ ctx[16])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(833:4) {#if Icon}",
    		ctx
    	});

    	return block;
    }

    // (837:4) {#if isMulti && value && value.length > 0}
    function create_if_block_6(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*MultiSelection*/ ctx[25];

    	function switch_props(ctx) {
    		return {
    			props: {
    				value: /*value*/ ctx[2],
    				getSelectionLabel: /*getSelectionLabel*/ ctx[12],
    				activeValue: /*activeValue*/ ctx[28],
    				isDisabled: /*isDisabled*/ ctx[9],
    				multiFullItemClearable: /*multiFullItemClearable*/ ctx[8]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("multiItemClear", /*handleMultiItemClear*/ ctx[33]);
    		switch_instance.$on("focus", /*handleFocus*/ ctx[35]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty[0] & /*value*/ 4) switch_instance_changes.value = /*value*/ ctx[2];
    			if (dirty[0] & /*getSelectionLabel*/ 4096) switch_instance_changes.getSelectionLabel = /*getSelectionLabel*/ ctx[12];
    			if (dirty[0] & /*activeValue*/ 268435456) switch_instance_changes.activeValue = /*activeValue*/ ctx[28];
    			if (dirty[0] & /*isDisabled*/ 512) switch_instance_changes.isDisabled = /*isDisabled*/ ctx[9];
    			if (dirty[0] & /*multiFullItemClearable*/ 256) switch_instance_changes.multiFullItemClearable = /*multiFullItemClearable*/ ctx[8];

    			if (switch_value !== (switch_value = /*MultiSelection*/ ctx[25])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("multiItemClear", /*handleMultiItemClear*/ ctx[33]);
    					switch_instance.$on("focus", /*handleFocus*/ ctx[35]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(837:4) {#if isMulti && value && value.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (859:4) {#if !isMulti && showSelectedItem}
    function create_if_block_5(ctx) {
    	let div;
    	let switch_instance;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*Selection*/ ctx[24];

    	function switch_props(ctx) {
    		return {
    			props: {
    				item: /*value*/ ctx[2],
    				getSelectionLabel: /*getSelectionLabel*/ ctx[12]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "selectedItem svelte-n764g3");
    			add_location(div, file$1, 859, 8, 23348);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "focus", /*handleFocus*/ ctx[35], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty[0] & /*value*/ 4) switch_instance_changes.item = /*value*/ ctx[2];
    			if (dirty[0] & /*getSelectionLabel*/ 4096) switch_instance_changes.getSelectionLabel = /*getSelectionLabel*/ ctx[12];

    			if (switch_value !== (switch_value = /*Selection*/ ctx[24])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(859:4) {#if !isMulti && showSelectedItem}",
    		ctx
    	});

    	return block;
    }

    // (868:4) {#if showClearIcon}
    function create_if_block_4(ctx) {
    	let div;
    	let switch_instance;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*ClearIcon*/ ctx[22];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "clearSelect svelte-n764g3");
    			add_location(div, file$1, 868, 8, 23587);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", prevent_default(/*handleClear*/ ctx[26]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*ClearIcon*/ ctx[22])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(868:4) {#if showClearIcon}",
    		ctx
    	});

    	return block;
    }

    // (874:4) {#if !showClearIcon && (showIndicator || (showChevron && !value) || (!isSearchable && !isDisabled && !isWaiting && ((showSelectedItem && !isClearable) || !showSelectedItem)))}
    function create_if_block_2(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*indicatorSvg*/ ctx[21]) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "indicator svelte-n764g3");
    			add_location(div, file$1, 874, 8, 23915);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(874:4) {#if !showClearIcon && (showIndicator || (showChevron && !value) || (!isSearchable && !isDisabled && !isWaiting && ((showSelectedItem && !isClearable) || !showSelectedItem)))}",
    		ctx
    	});

    	return block;
    }

    // (878:12) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747\n          3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0\n          1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502\n          0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0\n          0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z");
    			add_location(path, file$1, 883, 20, 24214);
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svelte-n764g3");
    			add_location(svg, file$1, 878, 16, 24043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(878:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (876:12) {#if indicatorSvg}
    function create_if_block_3(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_tag = new HtmlTag();
    			html_anchor = empty();
    			html_tag.a = html_anchor;
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(/*indicatorSvg*/ ctx[21], target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*indicatorSvg*/ 2097152) html_tag.p(/*indicatorSvg*/ ctx[21]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(876:12) {#if indicatorSvg}",
    		ctx
    	});

    	return block;
    }

    // (895:4) {#if isWaiting}
    function create_if_block_1(ctx) {
    	let div;
    	let svg;
    	let circle;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr_dev(circle, "class", "spinner_path svelte-n764g3");
    			attr_dev(circle, "cx", "50");
    			attr_dev(circle, "cy", "50");
    			attr_dev(circle, "r", "20");
    			attr_dev(circle, "fill", "none");
    			attr_dev(circle, "stroke", "currentColor");
    			attr_dev(circle, "stroke-width", "5");
    			attr_dev(circle, "stroke-miterlimit", "10");
    			add_location(circle, file$1, 897, 16, 24763);
    			attr_dev(svg, "class", "spinner_icon svelte-n764g3");
    			attr_dev(svg, "viewBox", "25 25 50 50");
    			add_location(svg, file$1, 896, 12, 24698);
    			attr_dev(div, "class", "spinner svelte-n764g3");
    			add_location(div, file$1, 895, 8, 24664);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, circle);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(895:4) {#if isWaiting}",
    		ctx
    	});

    	return block;
    }

    // (911:4) {#if listOpen}
    function create_if_block$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*listProps*/ ctx[32]];
    	var switch_value = /*List*/ ctx[23];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("itemSelected", /*itemSelected*/ ctx[38]);
    		switch_instance.$on("itemCreated", /*itemCreated*/ ctx[39]);
    		switch_instance.$on("closeList", /*closeList*/ ctx[40]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty[1] & /*listProps*/ 2)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*listProps*/ ctx[32])])
    			: {};

    			if (switch_value !== (switch_value = /*List*/ ctx[23])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("itemSelected", /*itemSelected*/ ctx[38]);
    					switch_instance.$on("itemCreated", /*itemCreated*/ ctx[39]);
    					switch_instance.$on("closeList", /*closeList*/ ctx[40]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(911:4) {#if listOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let input_1;
    	let input_1_readonly_value;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*Icon*/ ctx[16] && create_if_block_7(ctx);
    	let if_block1 = /*isMulti*/ ctx[7] && /*value*/ ctx[2] && /*value*/ ctx[2].length > 0 && create_if_block_6(ctx);

    	let input_1_levels = [
    		{
    			readOnly: input_1_readonly_value = !/*isSearchable*/ ctx[13]
    		},
    		/*_inputAttributes*/ ctx[29],
    		{ placeholder: /*placeholderText*/ ctx[31] },
    		{ style: /*inputStyles*/ ctx[14] },
    		{ disabled: /*isDisabled*/ ctx[9] }
    	];

    	let input_1_data = {};

    	for (let i = 0; i < input_1_levels.length; i += 1) {
    		input_1_data = assign(input_1_data, input_1_levels[i]);
    	}

    	let if_block2 = !/*isMulti*/ ctx[7] && /*showSelectedItem*/ ctx[27] && create_if_block_5(ctx);
    	let if_block3 = /*showClearIcon*/ ctx[30] && create_if_block_4(ctx);
    	let if_block4 = !/*showClearIcon*/ ctx[30] && (/*showIndicator*/ ctx[19] || /*showChevron*/ ctx[18] && !/*value*/ ctx[2] || !/*isSearchable*/ ctx[13] && !/*isDisabled*/ ctx[9] && !/*isWaiting*/ ctx[4] && (/*showSelectedItem*/ ctx[27] && !/*isClearable*/ ctx[15] || !/*showSelectedItem*/ ctx[27])) && create_if_block_2(ctx);
    	let if_block5 = /*isWaiting*/ ctx[4] && create_if_block_1(ctx);
    	let if_block6 = /*listOpen*/ ctx[6] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			input_1 = element("input");
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			if (if_block3) if_block3.c();
    			t4 = space();
    			if (if_block4) if_block4.c();
    			t5 = space();
    			if (if_block5) if_block5.c();
    			t6 = space();
    			if (if_block6) if_block6.c();
    			set_attributes(input_1, input_1_data);
    			toggle_class(input_1, "svelte-n764g3", true);
    			add_location(input_1, file$1, 848, 4, 23042);
    			attr_dev(div, "class", div_class_value = "selectContainer " + /*containerClasses*/ ctx[20] + " svelte-n764g3");
    			attr_dev(div, "style", /*containerStyles*/ ctx[11]);
    			toggle_class(div, "hasError", /*hasError*/ ctx[10]);
    			toggle_class(div, "multiSelect", /*isMulti*/ ctx[7]);
    			toggle_class(div, "disabled", /*isDisabled*/ ctx[9]);
    			toggle_class(div, "focused", /*isFocused*/ ctx[1]);
    			add_location(div, file$1, 823, 0, 22360);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			append_dev(div, input_1);
    			/*input_1_binding*/ ctx[72](input_1);
    			set_input_value(input_1, /*filterText*/ ctx[3]);
    			append_dev(div, t2);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t3);
    			if (if_block3) if_block3.m(div, null);
    			append_dev(div, t4);
    			if (if_block4) if_block4.m(div, null);
    			append_dev(div, t5);
    			if (if_block5) if_block5.m(div, null);
    			append_dev(div, t6);
    			if (if_block6) if_block6.m(div, null);
    			/*div_binding*/ ctx[74](div);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "click", /*handleWindowClick*/ ctx[36], false, false, false),
    					listen_dev(window, "keydown", /*handleKeyDown*/ ctx[34], false, false, false),
    					listen_dev(input_1, "focus", /*handleFocus*/ ctx[35], false, false, false),
    					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[73]),
    					listen_dev(div, "click", /*handleClick*/ ctx[37], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*Icon*/ ctx[16]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*Icon*/ 65536) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*isMulti*/ ctx[7] && /*value*/ ctx[2] && /*value*/ ctx[2].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*isMulti, value*/ 132) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_6(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(input_1, input_1_data = get_spread_update(input_1_levels, [
    				(!current || dirty[0] & /*isSearchable*/ 8192 && input_1_readonly_value !== (input_1_readonly_value = !/*isSearchable*/ ctx[13])) && { readOnly: input_1_readonly_value },
    				dirty[0] & /*_inputAttributes*/ 536870912 && /*_inputAttributes*/ ctx[29],
    				(!current || dirty[1] & /*placeholderText*/ 1) && { placeholder: /*placeholderText*/ ctx[31] },
    				(!current || dirty[0] & /*inputStyles*/ 16384) && { style: /*inputStyles*/ ctx[14] },
    				(!current || dirty[0] & /*isDisabled*/ 512) && { disabled: /*isDisabled*/ ctx[9] }
    			]));

    			if (dirty[0] & /*filterText*/ 8 && input_1.value !== /*filterText*/ ctx[3]) {
    				set_input_value(input_1, /*filterText*/ ctx[3]);
    			}

    			toggle_class(input_1, "svelte-n764g3", true);

    			if (!/*isMulti*/ ctx[7] && /*showSelectedItem*/ ctx[27]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*isMulti, showSelectedItem*/ 134217856) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_5(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, t3);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*showClearIcon*/ ctx[30]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*showClearIcon*/ 1073741824) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_4(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div, t4);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (!/*showClearIcon*/ ctx[30] && (/*showIndicator*/ ctx[19] || /*showChevron*/ ctx[18] && !/*value*/ ctx[2] || !/*isSearchable*/ ctx[13] && !/*isDisabled*/ ctx[9] && !/*isWaiting*/ ctx[4] && (/*showSelectedItem*/ ctx[27] && !/*isClearable*/ ctx[15] || !/*showSelectedItem*/ ctx[27]))) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_2(ctx);
    					if_block4.c();
    					if_block4.m(div, t5);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*isWaiting*/ ctx[4]) {
    				if (if_block5) ; else {
    					if_block5 = create_if_block_1(ctx);
    					if_block5.c();
    					if_block5.m(div, t6);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*listOpen*/ ctx[6]) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);

    					if (dirty[0] & /*listOpen*/ 64) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block$1(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(div, null);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*containerClasses*/ 1048576 && div_class_value !== (div_class_value = "selectContainer " + /*containerClasses*/ ctx[20] + " svelte-n764g3")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty[0] & /*containerStyles*/ 2048) {
    				attr_dev(div, "style", /*containerStyles*/ ctx[11]);
    			}

    			if (dirty[0] & /*containerClasses, hasError*/ 1049600) {
    				toggle_class(div, "hasError", /*hasError*/ ctx[10]);
    			}

    			if (dirty[0] & /*containerClasses, isMulti*/ 1048704) {
    				toggle_class(div, "multiSelect", /*isMulti*/ ctx[7]);
    			}

    			if (dirty[0] & /*containerClasses, isDisabled*/ 1049088) {
    				toggle_class(div, "disabled", /*isDisabled*/ ctx[9]);
    			}

    			if (dirty[0] & /*containerClasses, isFocused*/ 1048578) {
    				toggle_class(div, "focused", /*isFocused*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block6);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block6);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			/*input_1_binding*/ ctx[72](null);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			/*div_binding*/ ctx[74](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let showSelectedItem;
    	let showClearIcon;
    	let placeholderText;
    	let listProps;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Select", slots, []);
    	const dispatch = createEventDispatcher();
    	let { container = undefined } = $$props;
    	let { input = undefined } = $$props;
    	let { isMulti = false } = $$props;
    	let { multiFullItemClearable = false } = $$props;
    	let { isDisabled = false } = $$props;
    	let { isCreatable = false } = $$props;
    	let { isFocused = false } = $$props;
    	let { value = undefined } = $$props;
    	let { filterText = "" } = $$props;
    	let { placeholder = "Select..." } = $$props;
    	let { placeholderAlwaysShow = false } = $$props;
    	let { items = [] } = $$props;
    	let { itemFilter = (label, filterText, option) => label.toLowerCase().includes(filterText.toLowerCase()) } = $$props;
    	let { groupBy = undefined } = $$props;
    	let { groupFilter = groups => groups } = $$props;
    	let { isGroupHeaderSelectable = false } = $$props;

    	let { getGroupHeaderLabel = option => {
    		return option[labelIdentifier];
    	} } = $$props;

    	let { labelIdentifier = "label" } = $$props;

    	let { getOptionLabel = (option, filterText) => {
    		return option.isCreator
    		? `Create \"${filterText}\"`
    		: option[labelIdentifier];
    	} } = $$props;

    	let { optionIdentifier = "value" } = $$props;
    	let { loadOptions = undefined } = $$props;
    	let { hasError = false } = $$props;
    	let { containerStyles = "" } = $$props;

    	let { getSelectionLabel = option => {
    		if (option) return option[labelIdentifier];
    	} } = $$props;

    	let { createGroupHeaderItem = groupValue => {
    		return { value: groupValue, label: groupValue };
    	} } = $$props;

    	let { createItem = filterText => {
    		return { value: filterText, label: filterText };
    	} } = $$props;

    	let { isSearchable = true } = $$props;
    	let { inputStyles = "" } = $$props;
    	let { isClearable = true } = $$props;
    	let { isWaiting = false } = $$props;
    	let { listPlacement = "auto" } = $$props;
    	let { listOpen = false } = $$props;
    	let { isVirtualList = false } = $$props;
    	let { loadOptionsInterval = 300 } = $$props;
    	let { noOptionsMessage = "No options" } = $$props;
    	let { hideEmptyState = false } = $$props;
    	let { inputAttributes = {} } = $$props;
    	let { listAutoWidth = true } = $$props;
    	let { itemHeight = 40 } = $$props;
    	let { Icon = undefined } = $$props;
    	let { iconProps = {} } = $$props;
    	let { showChevron = false } = $$props;
    	let { showIndicator = false } = $$props;
    	let { containerClasses = "" } = $$props;
    	let { indicatorSvg = undefined } = $$props;
    	let { listOffset = 5 } = $$props;
    	let { ClearIcon: ClearIcon$1 = ClearIcon } = $$props;
    	let { Item: Item$1 = Item } = $$props;
    	let { List: List$1 = List } = $$props;
    	let { Selection: Selection$1 = Selection } = $$props;
    	let { MultiSelection: MultiSelection$1 = MultiSelection } = $$props;
    	let { VirtualList: VirtualList$1 = VirtualList } = $$props;
    	let { selectedValue = null } = $$props;

    	const originalItemsClone = (() => {
    		let _items = JSON.parse(JSON.stringify(items ? items : []));

    		if (_items && _items.length > 0 && typeof _items[0] !== "object") {
    			_items = convertStringItemsToObjects();
    		}

    		return _items;
    	})();

    	let activeValue;
    	let prev_value;
    	let prev_filterText;
    	let prev_isFocused;
    	let prev_items;
    	let prev_isMulti;

    	const getItems = debounce(
    		async () => {
    			$$invalidate(4, isWaiting = true);

    			let res = await loadOptions(filterText).catch(err => {
    				console.warn("svelte-select loadOptions error :>> ", err);
    				dispatch("error", { type: "loadOptions", details: err });
    			});

    			if (res && !res.cancelled) {
    				if (res) {
    					$$invalidate(41, items = [...res]);
    					dispatch("loaded", { items });
    				} else {
    					$$invalidate(41, items = []);
    				}

    				$$invalidate(4, isWaiting = false);
    				$$invalidate(1, isFocused = true);
    				$$invalidate(6, listOpen = true);
    			}
    		},
    		loadOptionsInterval
    	);

    	function setValue() {
    		if (typeof value === "string") {
    			$$invalidate(2, value = { [optionIdentifier]: value, label: value });
    		} else if (isMulti && Array.isArray(value) && value.length > 0) {
    			$$invalidate(2, value = value.map(item => typeof item === "string"
    			? { value: item, label: item }
    			: item));
    		}

    		if (prev_filterText && !loadOptions) {
    			$$invalidate(3, filterText = "");
    		}
    	}

    	let _inputAttributes;

    	function assignInputAttributes() {
    		$$invalidate(29, _inputAttributes = Object.assign(
    			{
    				autocomplete: "off",
    				autocorrect: "off",
    				spellcheck: false
    			},
    			inputAttributes
    		));

    		if (!isSearchable) {
    			$$invalidate(29, _inputAttributes.readonly = true, _inputAttributes);
    		}
    	}

    	function convertStringItemsToObjects() {
    		return items.map((item, index) => {
    			return { index, value: item, label: item };
    		});
    	}

    	function resetFilteredItems() {
    		if (loadOptions) return;
    		$$invalidate(41, items = originalItemsClone);
    		if (groupBy) filterItems();
    	}

    	function filterItem(item) {
    		let keepItem = true;

    		if (isMulti && value) {
    			keepItem = !value.some(x => {
    				return x[optionIdentifier] === item[optionIdentifier];
    			});
    		}

    		if (!keepItem) return false;
    		if (filterText.length < 1) return true;
    		return itemFilter(getOptionLabel(item, filterText), filterText, item);
    	}

    	function filterItems() {
    		if (loadOptions) return;
    		let _items = originalItemsClone;
    		$$invalidate(41, items = _items.filter(item => filterItem(item)));
    		if (groupBy) filterGroupedItems();
    	}

    	function filterGroupedItems() {
    		const groupValues = [];
    		const groups = {};

    		items.forEach(item => {
    			const groupValue = groupBy(item);

    			if (!groupValues.includes(groupValue)) {
    				groupValues.push(groupValue);
    				groups[groupValue] = [];

    				if (groupValue) {
    					groups[groupValue].push(Object.assign(createGroupHeaderItem(groupValue, item), {
    						id: groupValue,
    						isGroupHeader: true,
    						isSelectable: isGroupHeaderSelectable
    					}));
    				}
    			}

    			groups[groupValue].push(Object.assign({ isGroupItem: !!groupValue }, item));
    		});

    		const sortedGroupedItems = [];

    		groupFilter(groupValues).forEach(groupValue => {
    			sortedGroupedItems.push(...groups[groupValue]);
    		});

    		$$invalidate(41, items = sortedGroupedItems);
    	}

    	function dispatchSelectedItem() {
    		if (isMulti) {
    			if (JSON.stringify(value) !== JSON.stringify(prev_value)) {
    				if (checkValueForDuplicates()) {
    					dispatch("select", value);
    				}
    			}

    			return;
    		}

    		if (!prev_value || JSON.stringify(value[optionIdentifier]) !== JSON.stringify(prev_value[optionIdentifier])) {
    			dispatch("select", value);
    		}
    	}

    	function setupFocus() {
    		if (isFocused || listOpen) {
    			handleFocus();
    		} else {
    			if (input) input.blur();
    		}
    	}

    	function setupMulti() {
    		if (value) {
    			if (Array.isArray(value)) {
    				$$invalidate(2, value = [...value]);
    			} else {
    				$$invalidate(2, value = [value]);
    			}
    		}
    	}

    	function setupSingle() {
    		if (value) $$invalidate(2, value = null);
    	}

    	function setupFilterText() {
    		if (filterText.length > 0) {
    			$$invalidate(1, isFocused = true);
    			$$invalidate(6, listOpen = true);

    			if (loadOptions) {
    				getItems();
    			} else {
    				$$invalidate(6, listOpen = true);

    				if (isMulti) {
    					$$invalidate(28, activeValue = undefined);
    				}
    			}
    		} else {
    			resetFilteredItems();
    		}
    	}

    	function setupFilteredItem() {
    		if (loadOptions) return;
    		let _filteredItems = [...items];

    		if (isCreatable && filterText) {
    			const itemToCreate = createItem(filterText);
    			itemToCreate.isCreator = true;

    			const existingItemWithFilterValue = _filteredItems.find(item => {
    				return item[optionIdentifier] === itemToCreate[optionIdentifier];
    			});

    			let existingSelectionWithFilterValue;

    			if (value) {
    				if (isMulti) {
    					existingSelectionWithFilterValue = value.find(selection => {
    						return selection[optionIdentifier] === itemToCreate[optionIdentifier];
    					});
    				} else if (value[optionIdentifier] === itemToCreate[optionIdentifier]) {
    					existingSelectionWithFilterValue = value;
    				}
    			}

    			if (!existingItemWithFilterValue && !existingSelectionWithFilterValue) {
    				_filteredItems = [..._filteredItems, itemToCreate];
    			}
    		} else if (isMulti && value && value.length > 0) {
    			filterItems();
    		}

    		$$invalidate(41, items = _filteredItems);
    	}

    	beforeUpdate(async () => {
    		prev_value = value;
    		$$invalidate(68, prev_filterText = filterText);
    		$$invalidate(69, prev_isFocused = isFocused);
    		$$invalidate(70, prev_items = items);
    		$$invalidate(71, prev_isMulti = isMulti);
    	});

    	function checkValueForDuplicates() {
    		let noDuplicates = true;

    		if (value) {
    			const ids = [];
    			const uniqueValues = [];

    			value.forEach(val => {
    				if (!ids.includes(val[optionIdentifier])) {
    					ids.push(val[optionIdentifier]);
    					uniqueValues.push(val);
    				} else {
    					noDuplicates = false;
    				}
    			});

    			if (!noDuplicates) $$invalidate(2, value = uniqueValues);
    		}

    		return noDuplicates;
    	}

    	function findItem(selection) {
    		let matchTo = selection
    		? selection[optionIdentifier]
    		: value[optionIdentifier];

    		return items.find(item => item[optionIdentifier] === matchTo);
    	}

    	function updateValueDisplay(items) {
    		if (!items || items.length === 0 || items.some(item => typeof item !== "object")) return;

    		if (!value || (isMulti
    		? value.some(selection => !selection || !selection[optionIdentifier])
    		: !value[optionIdentifier])) return;

    		if (Array.isArray(value)) {
    			$$invalidate(2, value = value.map(selection => findItem(selection) || selection));
    		} else {
    			$$invalidate(2, value = findItem() || value);
    		}
    	}

    	function handleMultiItemClear(event) {
    		const { detail } = event;
    		const itemToRemove = value[detail ? detail.i : value.length - 1];

    		if (value.length === 1) {
    			$$invalidate(2, value = undefined);
    		} else {
    			$$invalidate(2, value = value.filter(item => {
    				return item !== itemToRemove;
    			}));
    		}

    		filterItems();
    		dispatch("clear", itemToRemove);
    	}

    	function handleKeyDown(e) {
    		if (!isFocused) return;

    		switch (e.key) {
    			case "ArrowDown":
    				e.preventDefault();
    				$$invalidate(6, listOpen = true);
    				$$invalidate(28, activeValue = undefined);
    				break;
    			case "ArrowUp":
    				e.preventDefault();
    				$$invalidate(6, listOpen = true);
    				$$invalidate(28, activeValue = undefined);
    				break;
    			case "Tab":
    				if (!listOpen) $$invalidate(1, isFocused = false);
    				break;
    			case "Backspace":
    				if (!isMulti || filterText.length > 0) return;
    				if (isMulti && value && value.length > 0) {
    					handleMultiItemClear(activeValue !== undefined
    					? activeValue
    					: value.length - 1);

    					if (activeValue === 0 || activeValue === undefined) break;
    					$$invalidate(28, activeValue = value.length > activeValue ? activeValue - 1 : undefined);
    				}
    				break;
    			case "ArrowLeft":
    				if (!isMulti || filterText.length > 0) return;
    				if (activeValue === undefined) {
    					$$invalidate(28, activeValue = value.length - 1);
    				} else if (value.length > activeValue && activeValue !== 0) {
    					$$invalidate(28, activeValue -= 1);
    				}
    				break;
    			case "ArrowRight":
    				if (!isMulti || filterText.length > 0 || activeValue === undefined) return;
    				if (activeValue === value.length - 1) {
    					$$invalidate(28, activeValue = undefined);
    				} else if (activeValue < value.length - 1) {
    					$$invalidate(28, activeValue += 1);
    				}
    				break;
    		}
    	}

    	function handleFocus() {
    		$$invalidate(1, isFocused = true);
    		if (input) input.focus();
    	}

    	function handleWindowClick(event) {
    		if (!container) return;

    		const eventTarget = event.path && event.path.length > 0
    		? event.path[0]
    		: event.target;

    		if (container.contains(eventTarget)) return;
    		$$invalidate(1, isFocused = false);
    		$$invalidate(6, listOpen = false);
    		$$invalidate(28, activeValue = undefined);
    		if (input) input.blur();
    	}

    	function handleClick() {
    		if (isDisabled) return;
    		$$invalidate(1, isFocused = true);
    		$$invalidate(6, listOpen = !listOpen);
    	}

    	function handleClear() {
    		$$invalidate(2, value = undefined);
    		$$invalidate(6, listOpen = false);
    		dispatch("clear", value);
    		if (isMulti) filterItems();
    		handleFocus();
    	}

    	onMount(() => {
    		if (isFocused && input) input.focus();
    		if (loadOptions && items) $$invalidate(41, items = [...items]);
    		if (isMulti && value) filterItems();
    	});

    	function itemSelected(event) {
    		const { detail } = event;

    		if (detail) {
    			const item = Object.assign({}, detail);

    			if (!item.isGroupHeader || item.isSelectable) {
    				if (isMulti) {
    					$$invalidate(2, value = value ? value.concat([item]) : [item]);
    					filterItems();
    				} else {
    					$$invalidate(2, value = item);
    				}

    				$$invalidate(2, value);

    				setTimeout(() => {
    					$$invalidate(6, listOpen = false);
    					$$invalidate(28, activeValue = undefined);
    					if (loadOptions) $$invalidate(3, filterText = "");
    				});
    			}
    		}
    	}

    	function itemCreated(event) {
    		const { detail } = event;

    		if (isMulti) {
    			$$invalidate(2, value = value || []);
    			$$invalidate(2, value = [...value, createItem(detail)]);
    		} else {
    			$$invalidate(2, value = createItem(detail));
    		}

    		dispatch("itemCreated", detail);
    		$$invalidate(3, filterText = "");
    		$$invalidate(6, listOpen = false);
    		$$invalidate(28, activeValue = undefined);
    	}

    	function closeList() {
    		$$invalidate(6, listOpen = false);
    	}

    	const writable_props = [
    		"container",
    		"input",
    		"isMulti",
    		"multiFullItemClearable",
    		"isDisabled",
    		"isCreatable",
    		"isFocused",
    		"value",
    		"filterText",
    		"placeholder",
    		"placeholderAlwaysShow",
    		"items",
    		"itemFilter",
    		"groupBy",
    		"groupFilter",
    		"isGroupHeaderSelectable",
    		"getGroupHeaderLabel",
    		"labelIdentifier",
    		"getOptionLabel",
    		"optionIdentifier",
    		"loadOptions",
    		"hasError",
    		"containerStyles",
    		"getSelectionLabel",
    		"createGroupHeaderItem",
    		"createItem",
    		"isSearchable",
    		"inputStyles",
    		"isClearable",
    		"isWaiting",
    		"listPlacement",
    		"listOpen",
    		"isVirtualList",
    		"loadOptionsInterval",
    		"noOptionsMessage",
    		"hideEmptyState",
    		"inputAttributes",
    		"listAutoWidth",
    		"itemHeight",
    		"Icon",
    		"iconProps",
    		"showChevron",
    		"showIndicator",
    		"containerClasses",
    		"indicatorSvg",
    		"listOffset",
    		"ClearIcon",
    		"Item",
    		"List",
    		"Selection",
    		"MultiSelection",
    		"VirtualList",
    		"selectedValue"
    	];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(5, input);
    		});
    	}

    	function input_1_input_handler() {
    		filterText = this.value;
    		$$invalidate(3, filterText);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    		if ("input" in $$props) $$invalidate(5, input = $$props.input);
    		if ("isMulti" in $$props) $$invalidate(7, isMulti = $$props.isMulti);
    		if ("multiFullItemClearable" in $$props) $$invalidate(8, multiFullItemClearable = $$props.multiFullItemClearable);
    		if ("isDisabled" in $$props) $$invalidate(9, isDisabled = $$props.isDisabled);
    		if ("isCreatable" in $$props) $$invalidate(42, isCreatable = $$props.isCreatable);
    		if ("isFocused" in $$props) $$invalidate(1, isFocused = $$props.isFocused);
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("filterText" in $$props) $$invalidate(3, filterText = $$props.filterText);
    		if ("placeholder" in $$props) $$invalidate(43, placeholder = $$props.placeholder);
    		if ("placeholderAlwaysShow" in $$props) $$invalidate(44, placeholderAlwaysShow = $$props.placeholderAlwaysShow);
    		if ("items" in $$props) $$invalidate(41, items = $$props.items);
    		if ("itemFilter" in $$props) $$invalidate(45, itemFilter = $$props.itemFilter);
    		if ("groupBy" in $$props) $$invalidate(46, groupBy = $$props.groupBy);
    		if ("groupFilter" in $$props) $$invalidate(47, groupFilter = $$props.groupFilter);
    		if ("isGroupHeaderSelectable" in $$props) $$invalidate(48, isGroupHeaderSelectable = $$props.isGroupHeaderSelectable);
    		if ("getGroupHeaderLabel" in $$props) $$invalidate(49, getGroupHeaderLabel = $$props.getGroupHeaderLabel);
    		if ("labelIdentifier" in $$props) $$invalidate(50, labelIdentifier = $$props.labelIdentifier);
    		if ("getOptionLabel" in $$props) $$invalidate(51, getOptionLabel = $$props.getOptionLabel);
    		if ("optionIdentifier" in $$props) $$invalidate(52, optionIdentifier = $$props.optionIdentifier);
    		if ("loadOptions" in $$props) $$invalidate(53, loadOptions = $$props.loadOptions);
    		if ("hasError" in $$props) $$invalidate(10, hasError = $$props.hasError);
    		if ("containerStyles" in $$props) $$invalidate(11, containerStyles = $$props.containerStyles);
    		if ("getSelectionLabel" in $$props) $$invalidate(12, getSelectionLabel = $$props.getSelectionLabel);
    		if ("createGroupHeaderItem" in $$props) $$invalidate(54, createGroupHeaderItem = $$props.createGroupHeaderItem);
    		if ("createItem" in $$props) $$invalidate(55, createItem = $$props.createItem);
    		if ("isSearchable" in $$props) $$invalidate(13, isSearchable = $$props.isSearchable);
    		if ("inputStyles" in $$props) $$invalidate(14, inputStyles = $$props.inputStyles);
    		if ("isClearable" in $$props) $$invalidate(15, isClearable = $$props.isClearable);
    		if ("isWaiting" in $$props) $$invalidate(4, isWaiting = $$props.isWaiting);
    		if ("listPlacement" in $$props) $$invalidate(56, listPlacement = $$props.listPlacement);
    		if ("listOpen" in $$props) $$invalidate(6, listOpen = $$props.listOpen);
    		if ("isVirtualList" in $$props) $$invalidate(57, isVirtualList = $$props.isVirtualList);
    		if ("loadOptionsInterval" in $$props) $$invalidate(58, loadOptionsInterval = $$props.loadOptionsInterval);
    		if ("noOptionsMessage" in $$props) $$invalidate(59, noOptionsMessage = $$props.noOptionsMessage);
    		if ("hideEmptyState" in $$props) $$invalidate(60, hideEmptyState = $$props.hideEmptyState);
    		if ("inputAttributes" in $$props) $$invalidate(61, inputAttributes = $$props.inputAttributes);
    		if ("listAutoWidth" in $$props) $$invalidate(62, listAutoWidth = $$props.listAutoWidth);
    		if ("itemHeight" in $$props) $$invalidate(63, itemHeight = $$props.itemHeight);
    		if ("Icon" in $$props) $$invalidate(16, Icon = $$props.Icon);
    		if ("iconProps" in $$props) $$invalidate(17, iconProps = $$props.iconProps);
    		if ("showChevron" in $$props) $$invalidate(18, showChevron = $$props.showChevron);
    		if ("showIndicator" in $$props) $$invalidate(19, showIndicator = $$props.showIndicator);
    		if ("containerClasses" in $$props) $$invalidate(20, containerClasses = $$props.containerClasses);
    		if ("indicatorSvg" in $$props) $$invalidate(21, indicatorSvg = $$props.indicatorSvg);
    		if ("listOffset" in $$props) $$invalidate(64, listOffset = $$props.listOffset);
    		if ("ClearIcon" in $$props) $$invalidate(22, ClearIcon$1 = $$props.ClearIcon);
    		if ("Item" in $$props) $$invalidate(65, Item$1 = $$props.Item);
    		if ("List" in $$props) $$invalidate(23, List$1 = $$props.List);
    		if ("Selection" in $$props) $$invalidate(24, Selection$1 = $$props.Selection);
    		if ("MultiSelection" in $$props) $$invalidate(25, MultiSelection$1 = $$props.MultiSelection);
    		if ("VirtualList" in $$props) $$invalidate(66, VirtualList$1 = $$props.VirtualList);
    		if ("selectedValue" in $$props) $$invalidate(67, selectedValue = $$props.selectedValue);
    	};

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		createEventDispatcher,
    		onMount,
    		_List: List,
    		_Item: Item,
    		_Selection: Selection,
    		_MultiSelection: MultiSelection,
    		_VirtualList: VirtualList,
    		_ClearIcon: ClearIcon,
    		debounce,
    		dispatch,
    		container,
    		input,
    		isMulti,
    		multiFullItemClearable,
    		isDisabled,
    		isCreatable,
    		isFocused,
    		value,
    		filterText,
    		placeholder,
    		placeholderAlwaysShow,
    		items,
    		itemFilter,
    		groupBy,
    		groupFilter,
    		isGroupHeaderSelectable,
    		getGroupHeaderLabel,
    		labelIdentifier,
    		getOptionLabel,
    		optionIdentifier,
    		loadOptions,
    		hasError,
    		containerStyles,
    		getSelectionLabel,
    		createGroupHeaderItem,
    		createItem,
    		isSearchable,
    		inputStyles,
    		isClearable,
    		isWaiting,
    		listPlacement,
    		listOpen,
    		isVirtualList,
    		loadOptionsInterval,
    		noOptionsMessage,
    		hideEmptyState,
    		inputAttributes,
    		listAutoWidth,
    		itemHeight,
    		Icon,
    		iconProps,
    		showChevron,
    		showIndicator,
    		containerClasses,
    		indicatorSvg,
    		listOffset,
    		ClearIcon: ClearIcon$1,
    		Item: Item$1,
    		List: List$1,
    		Selection: Selection$1,
    		MultiSelection: MultiSelection$1,
    		VirtualList: VirtualList$1,
    		selectedValue,
    		originalItemsClone,
    		activeValue,
    		prev_value,
    		prev_filterText,
    		prev_isFocused,
    		prev_items,
    		prev_isMulti,
    		getItems,
    		setValue,
    		_inputAttributes,
    		assignInputAttributes,
    		convertStringItemsToObjects,
    		resetFilteredItems,
    		filterItem,
    		filterItems,
    		filterGroupedItems,
    		dispatchSelectedItem,
    		setupFocus,
    		setupMulti,
    		setupSingle,
    		setupFilterText,
    		setupFilteredItem,
    		checkValueForDuplicates,
    		findItem,
    		updateValueDisplay,
    		handleMultiItemClear,
    		handleKeyDown,
    		handleFocus,
    		handleWindowClick,
    		handleClick,
    		handleClear,
    		itemSelected,
    		itemCreated,
    		closeList,
    		showSelectedItem,
    		showClearIcon,
    		placeholderText,
    		listProps
    	});

    	$$self.$inject_state = $$props => {
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    		if ("input" in $$props) $$invalidate(5, input = $$props.input);
    		if ("isMulti" in $$props) $$invalidate(7, isMulti = $$props.isMulti);
    		if ("multiFullItemClearable" in $$props) $$invalidate(8, multiFullItemClearable = $$props.multiFullItemClearable);
    		if ("isDisabled" in $$props) $$invalidate(9, isDisabled = $$props.isDisabled);
    		if ("isCreatable" in $$props) $$invalidate(42, isCreatable = $$props.isCreatable);
    		if ("isFocused" in $$props) $$invalidate(1, isFocused = $$props.isFocused);
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("filterText" in $$props) $$invalidate(3, filterText = $$props.filterText);
    		if ("placeholder" in $$props) $$invalidate(43, placeholder = $$props.placeholder);
    		if ("placeholderAlwaysShow" in $$props) $$invalidate(44, placeholderAlwaysShow = $$props.placeholderAlwaysShow);
    		if ("items" in $$props) $$invalidate(41, items = $$props.items);
    		if ("itemFilter" in $$props) $$invalidate(45, itemFilter = $$props.itemFilter);
    		if ("groupBy" in $$props) $$invalidate(46, groupBy = $$props.groupBy);
    		if ("groupFilter" in $$props) $$invalidate(47, groupFilter = $$props.groupFilter);
    		if ("isGroupHeaderSelectable" in $$props) $$invalidate(48, isGroupHeaderSelectable = $$props.isGroupHeaderSelectable);
    		if ("getGroupHeaderLabel" in $$props) $$invalidate(49, getGroupHeaderLabel = $$props.getGroupHeaderLabel);
    		if ("labelIdentifier" in $$props) $$invalidate(50, labelIdentifier = $$props.labelIdentifier);
    		if ("getOptionLabel" in $$props) $$invalidate(51, getOptionLabel = $$props.getOptionLabel);
    		if ("optionIdentifier" in $$props) $$invalidate(52, optionIdentifier = $$props.optionIdentifier);
    		if ("loadOptions" in $$props) $$invalidate(53, loadOptions = $$props.loadOptions);
    		if ("hasError" in $$props) $$invalidate(10, hasError = $$props.hasError);
    		if ("containerStyles" in $$props) $$invalidate(11, containerStyles = $$props.containerStyles);
    		if ("getSelectionLabel" in $$props) $$invalidate(12, getSelectionLabel = $$props.getSelectionLabel);
    		if ("createGroupHeaderItem" in $$props) $$invalidate(54, createGroupHeaderItem = $$props.createGroupHeaderItem);
    		if ("createItem" in $$props) $$invalidate(55, createItem = $$props.createItem);
    		if ("isSearchable" in $$props) $$invalidate(13, isSearchable = $$props.isSearchable);
    		if ("inputStyles" in $$props) $$invalidate(14, inputStyles = $$props.inputStyles);
    		if ("isClearable" in $$props) $$invalidate(15, isClearable = $$props.isClearable);
    		if ("isWaiting" in $$props) $$invalidate(4, isWaiting = $$props.isWaiting);
    		if ("listPlacement" in $$props) $$invalidate(56, listPlacement = $$props.listPlacement);
    		if ("listOpen" in $$props) $$invalidate(6, listOpen = $$props.listOpen);
    		if ("isVirtualList" in $$props) $$invalidate(57, isVirtualList = $$props.isVirtualList);
    		if ("loadOptionsInterval" in $$props) $$invalidate(58, loadOptionsInterval = $$props.loadOptionsInterval);
    		if ("noOptionsMessage" in $$props) $$invalidate(59, noOptionsMessage = $$props.noOptionsMessage);
    		if ("hideEmptyState" in $$props) $$invalidate(60, hideEmptyState = $$props.hideEmptyState);
    		if ("inputAttributes" in $$props) $$invalidate(61, inputAttributes = $$props.inputAttributes);
    		if ("listAutoWidth" in $$props) $$invalidate(62, listAutoWidth = $$props.listAutoWidth);
    		if ("itemHeight" in $$props) $$invalidate(63, itemHeight = $$props.itemHeight);
    		if ("Icon" in $$props) $$invalidate(16, Icon = $$props.Icon);
    		if ("iconProps" in $$props) $$invalidate(17, iconProps = $$props.iconProps);
    		if ("showChevron" in $$props) $$invalidate(18, showChevron = $$props.showChevron);
    		if ("showIndicator" in $$props) $$invalidate(19, showIndicator = $$props.showIndicator);
    		if ("containerClasses" in $$props) $$invalidate(20, containerClasses = $$props.containerClasses);
    		if ("indicatorSvg" in $$props) $$invalidate(21, indicatorSvg = $$props.indicatorSvg);
    		if ("listOffset" in $$props) $$invalidate(64, listOffset = $$props.listOffset);
    		if ("ClearIcon" in $$props) $$invalidate(22, ClearIcon$1 = $$props.ClearIcon);
    		if ("Item" in $$props) $$invalidate(65, Item$1 = $$props.Item);
    		if ("List" in $$props) $$invalidate(23, List$1 = $$props.List);
    		if ("Selection" in $$props) $$invalidate(24, Selection$1 = $$props.Selection);
    		if ("MultiSelection" in $$props) $$invalidate(25, MultiSelection$1 = $$props.MultiSelection);
    		if ("VirtualList" in $$props) $$invalidate(66, VirtualList$1 = $$props.VirtualList);
    		if ("selectedValue" in $$props) $$invalidate(67, selectedValue = $$props.selectedValue);
    		if ("activeValue" in $$props) $$invalidate(28, activeValue = $$props.activeValue);
    		if ("prev_value" in $$props) prev_value = $$props.prev_value;
    		if ("prev_filterText" in $$props) $$invalidate(68, prev_filterText = $$props.prev_filterText);
    		if ("prev_isFocused" in $$props) $$invalidate(69, prev_isFocused = $$props.prev_isFocused);
    		if ("prev_items" in $$props) $$invalidate(70, prev_items = $$props.prev_items);
    		if ("prev_isMulti" in $$props) $$invalidate(71, prev_isMulti = $$props.prev_isMulti);
    		if ("_inputAttributes" in $$props) $$invalidate(29, _inputAttributes = $$props._inputAttributes);
    		if ("showSelectedItem" in $$props) $$invalidate(27, showSelectedItem = $$props.showSelectedItem);
    		if ("showClearIcon" in $$props) $$invalidate(30, showClearIcon = $$props.showClearIcon);
    		if ("placeholderText" in $$props) $$invalidate(31, placeholderText = $$props.placeholderText);
    		if ("listProps" in $$props) $$invalidate(32, listProps = $$props.listProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[2] & /*selectedValue*/ 32) {
    			{
    				if (selectedValue) console.warn("selectedValue is no longer used. Please use value instead.");
    			}
    		}

    		if ($$self.$$.dirty[1] & /*items*/ 1024) {
    			updateValueDisplay(items);
    		}

    		if ($$self.$$.dirty[0] & /*value*/ 4) {
    			{
    				if (value) setValue();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*isSearchable*/ 8192 | $$self.$$.dirty[1] & /*inputAttributes*/ 1073741824) {
    			{
    				if (inputAttributes || !isSearchable) assignInputAttributes();
    			}
    		}

    		if ($$self.$$.dirty[0] & /*filterText*/ 8 | $$self.$$.dirty[1] & /*loadOptions, groupBy*/ 4227072) {
    			{
    				if (loadOptions && filterText.length === 0 && originalItemsClone.length > 0) {
    					resetFilteredItems();
    				}

    				if (filterText && filterText.length > 0) {
    					filterItems();
    				}

    				if (groupBy) {
    					filterItems();
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*isMulti*/ 128 | $$self.$$.dirty[2] & /*prev_isMulti*/ 512) {
    			{
    				if (isMulti) {
    					setupMulti();
    				}

    				if (prev_isMulti && !isMulti) {
    					setupSingle();
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*isMulti, value*/ 132) {
    			{
    				if (isMulti && value && value.length > 1) {
    					checkValueForDuplicates();
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*value*/ 4) {
    			{
    				if (value) {
    					dispatchSelectedItem();
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*isFocused*/ 2 | $$self.$$.dirty[2] & /*prev_isFocused*/ 128) {
    			{
    				if (isFocused !== prev_isFocused) {
    					setupFocus();
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*filterText*/ 8 | $$self.$$.dirty[2] & /*prev_filterText*/ 64) {
    			{
    				if (filterText !== prev_filterText) {
    					setupFilterText();
    				}
    			}
    		}

    		if ($$self.$$.dirty[1] & /*items*/ 1024 | $$self.$$.dirty[2] & /*prev_items*/ 256) {
    			{
    				if (prev_items !== items) {
    					setupFilteredItem();
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*value, filterText*/ 12) {
    			$$invalidate(27, showSelectedItem = value && filterText.length === 0);
    		}

    		if ($$self.$$.dirty[0] & /*showSelectedItem, isClearable, isDisabled, isWaiting*/ 134251024) {
    			$$invalidate(30, showClearIcon = showSelectedItem && isClearable && !isDisabled && !isWaiting);
    		}

    		if ($$self.$$.dirty[0] & /*isMulti, value*/ 132 | $$self.$$.dirty[1] & /*placeholderAlwaysShow, placeholder*/ 12288) {
    			$$invalidate(31, placeholderText = placeholderAlwaysShow && isMulti
    			? placeholder
    			: value ? "" : placeholder);
    		}

    		if ($$self.$$.dirty[0] & /*filterText, value, isMulti, container*/ 141 | $$self.$$.dirty[1] & /*optionIdentifier, noOptionsMessage, hideEmptyState, isVirtualList, getGroupHeaderLabel, items, getOptionLabel, listPlacement*/ 909378560 | $$self.$$.dirty[2] & /*Item, VirtualList, itemHeight, listAutoWidth, listOffset*/ 31) {
    			$$invalidate(32, listProps = {
    				Item: Item$1,
    				filterText,
    				optionIdentifier,
    				noOptionsMessage,
    				hideEmptyState,
    				isVirtualList,
    				VirtualList: VirtualList$1,
    				value,
    				isMulti,
    				getGroupHeaderLabel,
    				items,
    				itemHeight,
    				getOptionLabel,
    				listPlacement,
    				parent: container,
    				listAutoWidth,
    				listOffset
    			});
    		}
    	};

    	return [
    		container,
    		isFocused,
    		value,
    		filterText,
    		isWaiting,
    		input,
    		listOpen,
    		isMulti,
    		multiFullItemClearable,
    		isDisabled,
    		hasError,
    		containerStyles,
    		getSelectionLabel,
    		isSearchable,
    		inputStyles,
    		isClearable,
    		Icon,
    		iconProps,
    		showChevron,
    		showIndicator,
    		containerClasses,
    		indicatorSvg,
    		ClearIcon$1,
    		List$1,
    		Selection$1,
    		MultiSelection$1,
    		handleClear,
    		showSelectedItem,
    		activeValue,
    		_inputAttributes,
    		showClearIcon,
    		placeholderText,
    		listProps,
    		handleMultiItemClear,
    		handleKeyDown,
    		handleFocus,
    		handleWindowClick,
    		handleClick,
    		itemSelected,
    		itemCreated,
    		closeList,
    		items,
    		isCreatable,
    		placeholder,
    		placeholderAlwaysShow,
    		itemFilter,
    		groupBy,
    		groupFilter,
    		isGroupHeaderSelectable,
    		getGroupHeaderLabel,
    		labelIdentifier,
    		getOptionLabel,
    		optionIdentifier,
    		loadOptions,
    		createGroupHeaderItem,
    		createItem,
    		listPlacement,
    		isVirtualList,
    		loadOptionsInterval,
    		noOptionsMessage,
    		hideEmptyState,
    		inputAttributes,
    		listAutoWidth,
    		itemHeight,
    		listOffset,
    		Item$1,
    		VirtualList$1,
    		selectedValue,
    		prev_filterText,
    		prev_isFocused,
    		prev_items,
    		prev_isMulti,
    		input_1_binding,
    		input_1_input_handler,
    		div_binding
    	];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				container: 0,
    				input: 5,
    				isMulti: 7,
    				multiFullItemClearable: 8,
    				isDisabled: 9,
    				isCreatable: 42,
    				isFocused: 1,
    				value: 2,
    				filterText: 3,
    				placeholder: 43,
    				placeholderAlwaysShow: 44,
    				items: 41,
    				itemFilter: 45,
    				groupBy: 46,
    				groupFilter: 47,
    				isGroupHeaderSelectable: 48,
    				getGroupHeaderLabel: 49,
    				labelIdentifier: 50,
    				getOptionLabel: 51,
    				optionIdentifier: 52,
    				loadOptions: 53,
    				hasError: 10,
    				containerStyles: 11,
    				getSelectionLabel: 12,
    				createGroupHeaderItem: 54,
    				createItem: 55,
    				isSearchable: 13,
    				inputStyles: 14,
    				isClearable: 15,
    				isWaiting: 4,
    				listPlacement: 56,
    				listOpen: 6,
    				isVirtualList: 57,
    				loadOptionsInterval: 58,
    				noOptionsMessage: 59,
    				hideEmptyState: 60,
    				inputAttributes: 61,
    				listAutoWidth: 62,
    				itemHeight: 63,
    				Icon: 16,
    				iconProps: 17,
    				showChevron: 18,
    				showIndicator: 19,
    				containerClasses: 20,
    				indicatorSvg: 21,
    				listOffset: 64,
    				ClearIcon: 22,
    				Item: 65,
    				List: 23,
    				Selection: 24,
    				MultiSelection: 25,
    				VirtualList: 66,
    				selectedValue: 67,
    				handleClear: 26
    			},
    			[-1, -1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get container() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set container(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get input() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set input(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isMulti() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isMulti(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiFullItemClearable() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiFullItemClearable(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isDisabled() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isDisabled(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isCreatable() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isCreatable(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isFocused() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isFocused(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filterText() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filterText(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholderAlwaysShow() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholderAlwaysShow(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get items() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get itemFilter() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemFilter(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get groupBy() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groupBy(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get groupFilter() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groupFilter(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isGroupHeaderSelectable() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isGroupHeaderSelectable(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getGroupHeaderLabel() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getGroupHeaderLabel(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelIdentifier() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelIdentifier(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getOptionLabel() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getOptionLabel(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get optionIdentifier() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set optionIdentifier(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loadOptions() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loadOptions(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasError() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasError(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get containerStyles() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set containerStyles(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getSelectionLabel() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getSelectionLabel(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get createGroupHeaderItem() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set createGroupHeaderItem(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get createItem() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set createItem(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isSearchable() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isSearchable(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputStyles() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputStyles(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isClearable() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isClearable(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isWaiting() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isWaiting(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listPlacement() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listPlacement(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listOpen() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listOpen(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isVirtualList() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isVirtualList(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loadOptionsInterval() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loadOptionsInterval(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noOptionsMessage() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noOptionsMessage(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideEmptyState() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideEmptyState(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputAttributes() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputAttributes(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listAutoWidth() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listAutoWidth(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get itemHeight() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemHeight(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Icon() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Icon(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconProps() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconProps(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showChevron() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showChevron(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showIndicator() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showIndicator(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get containerClasses() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set containerClasses(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indicatorSvg() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indicatorSvg(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get listOffset() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set listOffset(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ClearIcon() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ClearIcon(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Item() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Item(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get List() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set List(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Selection() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Selection(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get MultiSelection() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set MultiSelection(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get VirtualList() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set VirtualList(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedValue() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedValue(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleClear() {
    		return this.$$.ctx[26];
    	}

    	set handleClear(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.3 */
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (50:1) {#if data !== null}
    function create_if_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 2) {
    				each_value = /*data*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(50:1) {#if data !== null}",
    		ctx
    	});

    	return block;
    }

    // (51:2) {#each data as d}
    function create_each_block(ctx) {
    	let section;
    	let current;
    	const section_spread_levels = [/*d*/ ctx[5]];
    	let section_props = {};

    	for (let i = 0; i < section_spread_levels.length; i += 1) {
    		section_props = assign(section_props, section_spread_levels[i]);
    	}

    	section = new Section({ props: section_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(section.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(section, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const section_changes = (dirty & /*data*/ 2)
    			? get_spread_update(section_spread_levels, [get_spread_object(/*d*/ ctx[5])])
    			: {};

    			section.$set(section_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(section.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(section.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(section, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(51:2) {#each data as d}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let select;
    	let t;
    	let current;

    	select = new Select({
    			props: { items: /*files*/ ctx[0] },
    			$$inline: true
    		});

    	select.$on("select", /*handleSelect*/ ctx[2]);
    	select.$on("clear", /*handleClear*/ ctx[3]);
    	let if_block = /*data*/ ctx[1] !== null && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(select.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(main, "class", "svelte-1hqtkhz");
    			add_location(main, file, 47, 0, 864);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(select, main, null);
    			append_dev(main, t);
    			if (if_block) if_block.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const select_changes = {};
    			if (dirty & /*files*/ 1) select_changes.items = /*files*/ ctx[0];
    			select.$set(select_changes);

    			if (/*data*/ ctx[1] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*data*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(select.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(select.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(select);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { files } = $$props;
    	let data = [];

    	onMount(() => {
    		updateFiles();
    	});

    	function handleSelect(event) {
    		fetch(event.detail.download_url).then(res => res.json()).then(d => {
    			$$invalidate(1, data = d);
    		});
    	}

    	function handleClear(event) {
    		$$invalidate(1, data = []);
    	}

    	function updateFiles() {
    		octokit.request("GET /repos/{owner}/{repo}/contents/{path}", { ...GithubInfo, path: "data" }).then(res => {
    			res.data.forEach(d => {
    				files.push({
    					value: d.path,
    					label: d.name,
    					download_url: d.download_url
    				});
    			});

    			$$invalidate(0, files);
    		});
    	}

    	const writable_props = ["files"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		octokit,
    		GithubInfo,
    		Section,
    		Select,
    		files,
    		data,
    		handleSelect,
    		handleClear,
    		updateFiles
    	});

    	$$self.$inject_state = $$props => {
    		if ("files" in $$props) $$invalidate(0, files = $$props.files);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [files, data, handleSelect, handleClear];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { files: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*files*/ ctx[0] === undefined && !("files" in props)) {
    			console.warn("<App> was created without expected prop 'files'");
    		}
    	}

    	get files() {
    		return this.$$.ctx[0];
    	}

    	set files(files) {
    		this.$set({ files });
    		flush();
    	}
    }

    const octokit = new Octokit();
    const GithubInfo = {
    	owner: "Oni-Men",
    	repo: "EffectCommandUtil",
    };

    const app = new App({
    	target: document.body,
    	props: {
    		files: [],
    	},
    });

    exports.GithubInfo = GithubInfo;
    exports['default'] = app;
    exports.octokit = octokit;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));
//# sourceMappingURL=bundle.js.map
