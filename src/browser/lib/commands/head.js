import { URL_DATA, CMD_SUB$, CMD_ARGS, CMD_WORK, DOM_HEAD } from "@-0/keys";
import { registerCMD } from "@-0/spool";
const setFavicon = (href) => {
    let link = document.querySelector("link[rel*='icon']") || document.createElement("link");
    link.type = "image/x-icon";
    link.rel = "shortcut icon";
    link.href = href;
    document.getElementsByTagName("head")[0].appendChild(link);
};
const defalt_cfg = {
    meta: {
        "og:title": document.title,
        "og:image": document.head.querySelector(`meta[property="og:image"]`).content,
        "og:image:width": document.head.querySelector(`meta[property="og:image:width"]`).content,
        "og:image:height": document.head.querySelector(`meta[property="og:image:height"]`).content,
        "og:description": document.head.querySelector(`meta[property="og:description"]`).content,
        "og:type": document.head.querySelector(`meta[property="og:image"]`).content,
    },
    title: document.title,
    favicon: document.querySelector("link[rel*='icon']"),
};
const replaceMeta = (obj = defalt_cfg) => {
    Object.entries(obj).forEach(([key, val]) => {
        try {
            return {
                HEAD_title: () => {
                    document.title = val;
                },
                HEAD_meta: () => {
                    Object.entries(val).forEach(([prop, content]) => {
                        document.head.querySelector(`meta[property="${prop}"]`).content = content;
                    });
                },
                HEAD_favicon: () => setFavicon(val),
            }[key]();
        }
        catch (e) {
            console.warn(e);
        }
    });
};
const conformToHead = ({ title = defalt_cfg.title, description = defalt_cfg.meta["og:description"], img_url = defalt_cfg.meta["og:image"], img_height = defalt_cfg.meta["og:image:height"], img_width = defalt_cfg.meta["og:image:width"], favicon = defalt_cfg.favicon, type = defalt_cfg.meta["og:type"], }) => ({
    HEAD_meta: {
        "og:title": title,
        "og:type": type,
        "og:description": description,
        "og:image:width": img_width,
        "og:image:height": img_height,
        "og:image": img_url,
    },
    HEAD_title: title,
    HEAD_favicon: favicon,
});
export const INJECT_HEAD = registerCMD({
    [CMD_SUB$]: "_INJECT_HEAD",
    [CMD_ARGS]: (acc) => ({ [URL_DATA]: acc[URL_DATA] }),
    [CMD_WORK]: ({ [URL_DATA]: { [DOM_HEAD]: { title, description, img_url, img_height, img_width, favicon, type }, }, }) => replaceMeta(conformToHead({ title, description, img_url, img_height, img_width, favicon, type })),
});