/**
 * @module commands/state
 */
import { CMD_SUB$, CMD_ARGS, CMD_WORK, SET_DATA, SET_PATH, Command } from "@-0/keys"
import { set$$tate, $store$ } from "../store"
import { registerCMD } from "@-0/spool"
import { Err_missing_props } from "@-0/utils"

/**
 * Higher-order function that takes a `@thi.ng/Atom` state
 * container and returns a Command object for setting that
 * Atom's state by the provided path (lens)
 */
export const createSetStateCMD: Command = store =>
    registerCMD({
        [CMD_SUB$]: "_SET_STATE",
        [CMD_ARGS]: x => x,
        [CMD_WORK]: args => {
            const path = args[SET_PATH]
            const data = args[SET_DATA]
            const props = {
                [SET_PATH]: path,
                [SET_DATA]: data
            }
            if (path && data !== undefined) return set$$tate(path, data, store)
            console.warn(Err_missing_props("_SET_STATE", props))
        }
    })

/**
 *
 * Command that sets global store state using a path and
 * data key from args
 */
export const SET_STATE: Command = createSetStateCMD($store$)
