import { __awaiter } from "tslib";
import { isPlainObject } from "@thi.ng/checks";
import { _PUSHSTATE_IF_HREF, _RESTORE_SCROLL_IF_POPSTATE, _SET_LINK_ATTRS_DOM, _SCROLL_TO_HASH, } from "../commands";
import { _, $$_VIEW, $$_LOAD, $$_PATH, URL_FULL, URL_DATA, URL_PATH, URL_PAGE, RTR_PREP, RTR_POST, RTR_PRFX, CFG_RUTR, CMD_ARGS, CMD_RESO, CMD_ERRO, DOM_BODY, DOM_HEAD, STATE_DATA, STATE_PATH, } from "@-0/keys";
import { URL2obj } from "@-0/utils";
const route_error = (_acc, _err, _out) => console.warn("Error in URL__ROUTE:", _err);
const e_s = `Prerequisite property: { ${CMD_ARGS}: { ${URL_FULL}: NOT FOUND 🔥 } }`;
const router_opts = (CFG) => {
    const rtr = CFG[CFG_RUTR] || null;
    const pre = CFG[RTR_PREP] || null;
    const pst = CFG[RTR_POST] || null;
    const pfx = CFG[RTR_PRFX] || null;
    const escRGX = /[-/\\^$*+?.()|[\]{}]/g;
    const escaped = string => string.replace(escRGX, "\\$&");
    const urlToPageState = rtr || CFG;
    const PREP = (pre && isPlainObject(pre) ? [pre] : pre) || [];
    const POST = (pst && isPlainObject(pst) ? [pst] : pst) || [];
    const prefix = pfx ? new RegExp(escaped(pfx), "g") : null;
    return { urlToPageState, PREP, POST, prefix };
};
export const __URL__ROUTE = (CFG, SET_STATE) => {
    const { urlToPageState, POST = [], PREP = [], prefix } = router_opts(CFG);
    const _SET_ROUTE_PATH = Object.assign(Object.assign({}, SET_STATE), { [CMD_ARGS]: _acc => ({
            [STATE_DATA]: _acc[URL_PATH],
            [STATE_PATH]: [_, $$_PATH],
        }) });
    const ROUTE_SUBTASK = ({ [URL_FULL]: FURL = "" }) => [
        ...PREP,
        {
            [CMD_ARGS]: FURL ? urlToPageState(FURL.replace(prefix, "")) : new Error(e_s),
            [CMD_RESO]: (_acc, _res) => (Object.assign(Object.assign({}, (_res && _res[URL_PAGE] && { [URL_PAGE]: _res[URL_PAGE] })), (_res && _res[URL_DATA] && { [URL_DATA]: _res[URL_DATA] }))),
            [CMD_ERRO]: route_error,
        },
        {
            [CMD_ARGS]: FURL ? URL2obj(FURL, prefix) : new Error(e_s),
            [CMD_ERRO]: route_error,
        },
        _SET_ROUTE_PATH,
        ...POST,
    ];
    return ROUTE_SUBTASK;
};
const conflict_warning = `
👀 You are setting state at the root of the store. Be careful!
Consider returning a \`${URL_DATA}\` property from your router 
with a keyed object value (e.g., { data: {...}}) to isolate the 
data needed for this route from other root state configuration
`;
const no_data_warning = path => `
No data (\`${URL_DATA}\`) hydrated @\`${URL_PATH}\`: ${path ? path : "/"}
`;
export const __DOM_URL__ROUTE = (CFG, SET_STATE) => {
    const { urlToPageState, POST, PREP } = router_opts(CFG);
    const UNIVERSAL_ROUTING_SUBTASK = __URL__ROUTE({
        [CFG_RUTR]: urlToPageState,
        [RTR_PRFX]: CFG[RTR_PRFX] || null,
    }, SET_STATE);
    const _SET_ROUTE_LOADING_TRUE = Object.assign(Object.assign({}, SET_STATE), { [CMD_ARGS]: { [STATE_PATH]: [_, $$_LOAD], [STATE_DATA]: true } });
    const _SET_ROUTE_LOADING_FALSE = Object.assign(Object.assign({}, SET_STATE), { [CMD_ARGS]: { [STATE_PATH]: [_, $$_LOAD], [STATE_DATA]: false } });
    const _SET_ROUTE_VIEW_TO_PAGE = Object.assign(Object.assign({}, SET_STATE), { [CMD_ARGS]: acc => ({
            [STATE_PATH]: [_, $$_VIEW],
            [STATE_DATA]: acc[URL_PAGE] || (console.error(`no \`${URL_PAGE}\` found for this route`), null),
        }) });
    const HACKED_API_FIXME = () => __awaiter(void 0, void 0, void 0, function* () { return yield new Promise(resolve => setTimeout(() => resolve({}), 0)); });
    const _SET_PATH_STATE_DATA = Object.assign(Object.assign({}, SET_STATE), { [CMD_ARGS]: acc => {
            const { [URL_DATA]: data, [URL_PATH]: path } = acc;
            if (!data) {
                console.log(no_data_warning(acc[URL_PATH]));
                if (!(path === null || path === void 0 ? void 0 : path.length))
                    console.log(conflict_warning);
                return {
                    [STATE_PATH]: path,
                    [STATE_DATA]: {},
                };
            }
            const { [DOM_BODY]: body, [DOM_HEAD]: head } = data;
            return {
                [STATE_PATH]: path,
                [STATE_DATA]: !head && !body ? data : head && !body ? {} : body,
            };
        } });
    const ROUTE_HOT = (args) => [
        ...PREP,
        _SET_ROUTE_LOADING_TRUE,
        { [CMD_ARGS]: args },
        _PUSHSTATE_IF_HREF,
        args => UNIVERSAL_ROUTING_SUBTASK({ [URL_FULL]: args[URL_FULL] }),
        _SET_PATH_STATE_DATA,
        _SET_ROUTE_VIEW_TO_PAGE,
        _SET_LINK_ATTRS_DOM,
        _SET_ROUTE_LOADING_FALSE,
        _RESTORE_SCROLL_IF_POPSTATE,
        _SCROLL_TO_HASH,
        ...POST,
    ];
    return ROUTE_HOT;
};
