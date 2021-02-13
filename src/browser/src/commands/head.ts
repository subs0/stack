/**
 * @module commands/head
 */
import {
    URL_DATA,
    CMD_SUB$,
    CMD_ARGS,
    CMD_WORK,
    DOM_HEAD,
    HD_TITL,
    HD_ICON,
    OG_TYPE,
    OG_DESC,
    OG_IMGU,
    OG_IMGW,
    OG_IMGH,
    HeadData,
    DOM_BODY
} from "@-0/keys"
// FIXME: move to import above
const HD_META = "HD_META"

import { Err_missing_props } from "@-0/utils"
import { registerCMD } from "@-0/spool"

const setFavicon = href => {
    let link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement("link")
    link.type = "image/x-icon"
    link.rel = "shortcut icon"
    link.href = href
    document.getElementsByTagName("head")[0].appendChild(link)
}

const getHeadProp = prop => () => document.head.querySelector(`meta[property="${prop}"]`)
// TODO currently throws CORS warning
const meta = prop => (getHeadProp(prop)() && getHeadProp(prop)().content) || null

const defalt_cfg = {
    [HD_META]: {
        "og:title": document.title,
        "og:image": meta("og:image"),
        "og:image:width": meta("og:image:width"),
        "og:image:height": meta("og:image:height"),
        "og:description": meta("og:description"),
        "og:type": meta("og:type")
    },
    [HD_TITL]: document.title,
    //"https://github.com/loganpowell/ac/raw/master/assets/favicon.ico",
    [HD_ICON]: document.querySelector("link[rel*='icon']")
}

declare var document: any

const replaceMeta = (obj: any = defalt_cfg) => {
    Object.entries(obj).forEach(([ key, val ]) => {
        try {
            return {
                [HD_TITL]: () => {
                    document.title = val
                },
                [HD_META]: () => {
                    Object.entries(val).forEach(([ prop, content ]) => {
                        if (getHeadProp(prop)()) getHeadProp(prop)().content = content
                    })
                },
                [HD_ICON]: () => setFavicon(val)
            }[key]()
        } catch (e) {
            console.warn(e)
        }
    })
}

const conformToHead = ({
    [HD_TITL]: title = defalt_cfg[HD_TITL],
    [OG_DESC]: description = defalt_cfg[HD_META]["og:description"],
    [OG_IMGU]: img_url = defalt_cfg[HD_META]["og:image"],
    [OG_IMGH]: img_height = defalt_cfg[HD_META]["og:image:height"],
    [OG_IMGW]: img_width = defalt_cfg[HD_META]["og:image:width"],
    [OG_TYPE]: type = defalt_cfg[HD_META]["og:type"],
    [HD_ICON]: favicon = defalt_cfg[HD_ICON]
}) => ({
    [HD_META]: {
        /**
         * og:url can tell scrapers to ignore the page and
         * scrape this instead. Would save scraping the whole
         * page and might be friendlier for `jsdom`
         */
        // "og:url": history.state.URL,
        "og:title": title,
        "og:type": type,
        "og:description": description,
        "og:image:width": img_width,
        "og:image:height": img_height,
        "og:image": img_url
    },
    [HD_TITL]: title,
    [HD_ICON]: favicon
})

interface apiURL {
    [URL_DATA: string]: {
        [DOM_HEAD: string]: HeadData
    }
}

// FIXME: add title, description, etc. to @-0/keys constants
// TODO: add title, description, etc. to @-0/keys constants
export const INJECT_HEAD: any = registerCMD({
    [CMD_SUB$]: "_INJECT_HEAD",
    [CMD_ARGS]: acc => ({ [URL_DATA]: acc[URL_DATA] }),
    [CMD_WORK]: (args: apiURL) => {
        const data = args[URL_DATA]
        const head = data[DOM_HEAD]
        const shallow_props = {
            [URL_DATA]: data
        }
        const deep_props = {
            [DOM_HEAD]: head
        }
        if (head) return replaceMeta(conformToHead(head))
        if (data) return console.warn(Err_missing_props("_INJECT_HEAD", deep_props, args))
        return console.warn(Err_missing_props("_INJECT_HEAD", shallow_props, args))
    }
})
