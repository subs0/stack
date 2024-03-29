import { getInUnsafe } from "@thi.ng/paths"
import { isObject } from "@thi.ng/checks"
import { EquivMap } from "@thi.ng/associative"
import { map } from "@thi.ng/transducers"
import { trace } from "@thi.ng/rstream"
import "regenerator-runtime"
// import scrolly from "@mapbox/scroll-restorer"
// scrolly.start()

// ⚠ <=> API SURFACE AREA TOO LARGE <=> ⚠ .

import { registerCMD, command$, out$, run$, task$, log$ } from "@-0/spool"
import { cmd_inject_head, cmd_nav } from "@-0/browser"
import { FLIPkid, boot } from "@-0/hdom"
import { URL2obj } from "@-0/utils"
import {
    DOM_BODY,
    DOM_HEAD,
    DOM_NODE,
    URL_PATH,
    URL_FULL,
    URL_DATA,
    URL_PAGE,
    URL_PRSE,
    CFG_RUN$,
    CFG_RUTR,
    CFG_ROOT,
    CFG_LOG$,
    CFG_DRFT,
    CFG_VIEW,
    CFG_KICK,
    RTR_PRFX,
    RTR_POST,
    HD_TITL,
    OG_DESC,
    OG_IMGU,
} from "@-0/keys"

const INJECT_HEAD = registerCMD(cmd_inject_head)
const NAV = registerCMD(cmd_nav)
// ⚠ <=> API SURFACE AREA TOO LARGE <=> ⚠ .

// import { button_x } from "./components"
// import { THEME } from "./theme"

const log = console.log

log$.subscribe(map(x => log("log$:", x)))
trace("run$     ->", run$)
////trace$("command$ ->", command$)
//trace$("out$     ->", out$)
//trace$("task$    ->", task$)

/**
 *
 * When using a router config object (rather than a plain
 * router function), payloads can also separate display data
 * under a `BODY` key to separate the content from any
 * metadata you may want to use in `pre`/`post`
 * Commands/Tasks. For example, the built-in
 * `INJECT_HEAD_CMD` pulls from a `HEAD` key in the payload.
 *
 * Regarding state MGMT: The payload (value) will be
 * destructured from the `BODY` to keep your lenses (paths)
 * and state clean. I.e., you do not have to destructure
 * this from your page/app template manually. However,
 * within a `pre`/`post` Command/Task, the user can/must
 * use/destructure `HEAD`/`POST` payloads for their own
 * needs
 *
 */
const getSomeJSON = async (path, uid) => {
    const text_base = "https://jsonplaceholder.typicode.com/"
    // `https://i.picsum.photos/id/${id}/${sz}/${sz}.jpg`
    const img_base = (id, sz) => `http://lorempixel.com/${sz}/${sz}/sports/${id}/`

    const data = uid
        ? (async () => {
              let detail = await fetch(`${text_base}${path}/${uid}`).then(r => r.json())
              let {
                  name = `User ${getInUnsafe(detail, "id")}`,
                  company: { catchPhrase } = { catchPhrase: detail.title },
              } = detail
              return {
                  [DOM_HEAD]: {
                      //title?: any
                      //description?: any
                      //img_url?: any
                      //img_width?: any
                      //img_height?: any
                      //favicon?: any
                      //type?: any
                      [HD_TITL]: `${name}'s Details`,
                      [OG_DESC]: `${name} handles ${catchPhrase}`,
                      [OG_IMGU]: img_base(uid, 600),
                  },
                  [DOM_BODY]: {
                      // lesson -> don't use the actual url as the uid (not flexible)
                      img: img_base(uid, 600),
                      // this needs fixin' 📌
                      text: detail,
                      uid,
                  },
              }
          })()
        : (async () => {
              let list = await fetch(`${text_base}${path}/`).then(r => r.json())
              console.log({ list })
              return {
                  [DOM_HEAD]: {
                      [HD_TITL]: `${path.replace(/^\w/, c => c.toUpperCase())} list`,
                      [OG_DESC]: `List page for ${path}`,
                      [OG_IMGU]: img_base(222, 200),
                  },
                  [DOM_BODY]: list.map((c, i) => ({
                      img: img_base(i + 1, 200),
                      text: c,
                      uid: i + 1,
                  })),
              }
          })()
    return data
}

//
//                             d8
//  888-~\  e88~-_  888  888 _d88__  e88~~8e   d88~\
//  888    d888   i 888  888  888   d888  88b C888
//  888    8888   | 888  888  888   8888__888  Y88b
//  888    Y888   ' 888  888  888   Y888    ,   888D
//  888     "88_-~  "88_-888  "88_/  "88___/  \_88P
//
//

/**
 *
 * Even if you don't end up using `spule` - you may find the
 * [`@thi.ng/associative`](https://github.com/thi-ng/umbrella/tree/develop/packages/associative)
 * library __very handy__ indeed!
 *
 * Value semantics have so many benefits. As a router,
 * here's one.
 *
 */
const routerCfg = async url => {
    let match = URL2obj(url)
    // let {
    // URL,
    // URL_subdomain, // array
    // URL_domain, // array
    // URL_query, // object
    // URL_hash, // string
    // URL_path // array
    // } = match

    let path = match[URL_PATH]
    let [, p_b] = path

    let RES = new EquivMap([
        [
            { ...match, [URL_PATH]: ["todos"] },
            { [URL_DATA]: () => getSomeJSON("todos"), [URL_PAGE]: set },
        ],
        [
            { ...match, [URL_PATH]: ["todos", p_b] },
            { [URL_DATA]: () => getSomeJSON("todos", p_b), [URL_PAGE]: single },
        ],
        [
            { ...match, [URL_PATH]: ["users"] },
            { [URL_DATA]: () => getSomeJSON("users"), [URL_PAGE]: set },
        ],
        [
            { ...match, [URL_PATH]: ["users", p_b] },
            { [URL_DATA]: () => getSomeJSON("users", p_b), [URL_PAGE]: single },
        ],
        // home page (empty path)
        [
            { ...match, [URL_PATH]: [] },
            {
                [URL_DATA]: () => (console.log("HOME"), getSomeJSON("users", 10)),
                [URL_PAGE]: single,
            },
        ], // get match || 404 data
    ]).get(match) || {
        [URL_DATA]: () => getSomeJSON("users", 10),
        [URL_PAGE]: single,
    }

    let data = RES[URL_DATA]
    let page = RES[URL_PAGE]

    let result = { [URL_DATA]: await data(), [URL_PAGE]: page }
    //console.log({ result })
    return result
}

//
//  888            888
//  888-~88e  e88~\888  e88~-_  888-~88e-~88e
//  888  888 d888  888 d888   i 888  888  888
//  888  888 8888  888 8888   | 888  888  888
//  888  888 Y888  888 Y888   ' 888  888  888
//  888  888  "88_/888  "88_-~  888  888  888
//
//

//////////////////// FLIP API 🔻 //////////////////////////

// CHILD DEF: sig = (ctx, attrs, ...any)

const child = (ctx, id, img, sz, ...args) => (
    log("child"),
    [
        "img",
        {
            src: img,
            style:
                sz === "sm"
                    ? {
                          height: "100px",
                          width: "100px",
                          cursor: "pointer",
                          "margin-right": "15px",
                      }
                    : {
                          height: "600px",
                          width: "600px",
                      },
            href:
                sz === "sm"
                    ? `/${ctx[URL_PRSE]()[URL_PATH]}/${id}`
                    : `/${ctx[URL_PRSE]()[URL_PATH].join("/")}`,
        },
        ...args,
    ]
)

const zoomOnNav = (ctx, id, img, sz) => [FLIPkid(NAV), [child, id, img, sz]]

//////////////////// FLIP API 🔺  //////////////////////////

/**
 * higher order components should only take static parameters
 * so that they can be cached. I.e., in this case a string
 * Do not nest an HDOM functional component within another
 * in an attempt to pass state between components. Use an atom,
 * which is deref'able for that
 */
const component =
    sz =>
    // log("component"),
    (ctx, uid, img, fields) =>
        [
            "div",
            { style: { "margin-bottom": "30px", display: sz === "sm" ? "flex" : "block" } },
            [zoomOnNav, uid, img, sz],
            ["p", { class: "title" }, fields],
        ]

// babel/core-js will complain if pages aren't defined
// before they're used even though eslint will allow it
const single = (ctx, body) => {
    //console.log("single component loaded. body:", body)
    return [
        component("lg"),
        getInUnsafe(body, "uid") || 1,
        getInUnsafe(body, "img") || `http://lorempixel.com/600/600/sports/4/`,
        getInUnsafe(body, "text") ? fields(body.text.company || body.text) : null,
    ]
}

const set = (ctx, bodies) =>
    // log("set"),
    ["div", ...bodies.map(({ img, text, uid }) => [component("sm"), uid, img, fields(text)])]

// const S = JSON.stringify // <- handy for adornment phase

// declare button before using in-site (prevent re-registration on RAF)

// const btn_outline = button_x({ tag: "a" }, "buttons.outline")

const pathLink = (ctx, uid, ...args) =>
    // log("pathLink"),
    [
        "div",
        // btn_outline,
        uid === 3
            ? { disabled: true }
            : {
                  href: `/${ctx[URL_PRSE]()[URL_PATH]}/${uid}`,
                  onclick: e => {
                      e.preventDefault()
                      ctx[CFG_RUN$]({ ...NAV, args: e })
                  },
              },
        ...args,
    ]

const field = (ctx, key, val) =>
    // log("field"),
    [
        "li",
        { style: { display: "flex" } },
        key === "id"
            ? [pathLink, val, val]
            : isObject(val)
            ? ["ul", ...Object.entries(val).map(([k, v]) => [field, k, v])]
            : ["p", { style: { padding: "0 0.5rem" } }, val],
    ]

const fields = payload =>
    // log("fields", { payload }),
    [
        "ul",
        ...Object.entries(payload)
            .slice(0, 4)
            .map(([k, v]) => [field, k, v]),
    ]

const link = (ctx, path, ...args) =>
    // log("link"),
    [
        "a",
        {
            href: "/" + path.join("/"),
            // regular href just works if there's no extra paths in
            // URL (e.g., gh-pages URLs will break these)...
            onclick: e => (e.preventDefault(), ctx[CFG_RUN$]({ ...NAV, args: e })),
        },
        ...args,
    ]

//
//
//    /~~~8e  888-~88e  888-~88e
//        88b 888  888b 888  888b
//   e88~-888 888  8888 888  8888
//  C888  888 888  888P 888  888P
//   "88_-888 888-_88"  888-_88"
//            888       888
//
const app = (ctx, page) =>
    //log("app"),
    [
        "div",
        { style: { "max-width": "30rem", margin: "auto", padding: "2rem" } },
        ...[["users"], ["todos"], ["todos", 2], ["users", 9]].map(path => [
            link,
            path,
            `/${path[0]}${path[1] ? "/" + path[1] : ""}`,
            ["br"],
        ]),
        // default to homepage `single` shell during
        // hydration/start (before any async is done)
        page,
    ]

const router = {
    [CFG_RUTR]: routerCfg,
    [RTR_PRFX]: "ac/",
    [RTR_POST]: INJECT_HEAD,
}

// const router = routerCfg
const w_config = {
    [CFG_VIEW]: app,
    [CFG_RUTR]: router,
    [CFG_ROOT]: document.getElementById("app"), // <- 🔍
    [CFG_DRFT]: { users: [] },
    //[CFG_LOG$] : "state ->"
    [CFG_KICK]: true,

    // arbitrary context k/v pairs...
    // theme: THEME
}
// @ts-ignore
boot(w_config)

console.log("registered Commands:", out$.topics.entries())

console.log("starting...")
