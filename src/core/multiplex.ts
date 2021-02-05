/**
 * @module core
 */

import { isFunction, isPromise, isArray } from "@thi.ng/checks"
import { pubsub, Subscription, PubSub } from "@thi.ng/rstream"
import { EquivMap } from "@thi.ng/associative"

import { CMD_SUB$, CMD_ARGS, CMD_RESO, CMD_ERRO, CMD_SRC$, CMD_WORK } from "@-0/keys"
import { stringify_type, xKeyError, key_index_err, diff_keys, stringify_fn } from "@-0/utils"
import { getIn } from "@thi.ng/paths"

const err_str = "🔥 Multiplex Spooling Interrupted 🔥"

const noSubEr = (c, i) => `
${err_str}

 >> No \`${CMD_SUB$}\` included for a Command with primitive \`${CMD_ARGS}\` <<

Ergo, nothing was done with this Command: 

${stringify_fn(c)}

${(i && key_index_err(c, i)) || ""}

Hope that helps!

`

const noEroEr = (c, i) => `
${err_str}

>> Unhandled Error 

This Command:

${stringify_fn(c)}

resulted in an error, but no ${CMD_ERRO} (error) handler was included

${(i && key_index_err(c, i)) || ""}
Unhandled errors terminate Tasks by default

`

const task_not_array_error = x => `
${err_str}

You may have:
1. Ran a Command that has no \`${CMD_ARGS}\` key and thus does nothing
2. Ran a Subtask - a unary Function that accepts an inter-Task accumulator 
    and returns an Array - outside of a Task and has thus starved

Please check this payload for issues:
${stringify_fn(x)}
`

const no_args_error = (C, i = null) => `
${err_str}

You have ran a Command that has no \`${CMD_ARGS}\` key and thus does nothing

Please check this payload for issues:
${stringify_fn(C)}

${i ? key_index_err(C, i) : ""}
`

const NA_keys = (c, i) => {
    const knowns = [ CMD_SUB$, CMD_ARGS, CMD_RESO, CMD_ERRO ]
    const [ unknowns, unknown_kvs ] = diff_keys(knowns, c)
    return xKeyError(err_str, c, unknown_kvs, i)
}

// prettier-ignore
export const keys_match = C => new EquivMap([
    [ [],                                         "NO_ARGS" ],
    [ [ CMD_SUB$ ],                               "NO_ARGS" ],
    [ [ CMD_RESO ],                               "NO_ARGS" ],
    [ [ CMD_ERRO ],                               "NO_ARGS" ],
    [ [ CMD_RESO, CMD_SUB$ ],                     "NO_ARGS" ],
    [ [ CMD_ERRO, CMD_SUB$ ],                     "NO_ARGS" ],
    [ [ CMD_ERRO, CMD_RESO ],                     "NO_ARGS" ],
    [ [ CMD_ERRO, CMD_RESO, CMD_SUB$ ],           "NO_ARGS" ],
    [ [ CMD_ARGS ],                               "A" ],
    [ [ CMD_ARGS, CMD_ERRO ],                     "AE" ],
    [ [ CMD_ARGS, CMD_RESO ],                     "AR" ],
    [ [ CMD_ARGS, CMD_SUB$ ],                     "AS" ],
    [ [ CMD_ARGS, CMD_ERRO, CMD_SUB$ ],           "AES" ],
    [ [ CMD_ARGS, CMD_ERRO, CMD_RESO ],           "AER" ],
    [ [ CMD_ARGS, CMD_RESO, CMD_SUB$ ],           "ARS" ],
    [ [ CMD_ARGS, CMD_ERRO, CMD_RESO, CMD_SUB$ ], "AERS" ]
]).get(Object.keys(C).sort()) || "UNKNOWN"

// prettier-ignore
// recursive function that resolves all non static values
export const process_args = async (acc, args) => {
    const args_type = stringify_type(args)
    switch (args_type) {
        case "PRIMITIVE": case "OBJECT": case "ERROR": case "ARRAY":
            return { args_type, args }
        case "N-ARY": case "BINARY":
            console.warn(`${CMD_ARGS} function arity > 1: ${stringify_fn(args)}`)
        case "UNARY":
            return await process_args(acc, args(acc))
        case "PROMISE":
            let resolved = await args.catch(e => e)
            return await process_args(acc, resolved)
        case "NULLARY":
            return await process_args(acc, args())
        default:
            return "UNDEFINED"
    }
}

// prettier-ignore
/**
 * @example
 * acc = await pattern_match(acc, { args: { a: 1 } }, out$)
 */
export const pattern_match = async (acc, C, out$ = { next: null }, i = null) => {
    if (acc === null) return null
    const K_M = keys_match(C)
    if (K_M === "NO_ARGS") {
        console.warn(no_args_error(C, i))
        return acc
    }
    const _args = C[CMD_ARGS]
    const { args_type, args } = await process_args(acc, _args)

    //console.log(`
    //K_M: ${K_M}
    //args_type: ${args_type}
    //args: ${args}
    //`)

    const __R = K_M.includes("R") && C[CMD_RESO](acc, args) 
    const __C = { ...C, [CMD_ARGS]: args }
    const __A = args_type === "OBJECT" && { ...acc, ...args }
    const __RA = __R && { ...acc, ...__R }

    // equivalent matches are returned in LIFO order -> add least least restrictive cases first ⬇
    let result = new EquivMap([ 
        [ { K_M,                                 args_type: "UNKNOWN"   },() => (console.warn(NA_keys(C, i), null)) ],
        [ { K_M,                                 args_type: "OBJECT"    },() => __A ],
        [ { K_M: "AE",                           args_type: "OBJECT"    },() => __A ],
        // if primitive and no topic key -> warn and return acc
        [ { K_M: `${!K_M.includes("S") && K_M}`, args_type: "PRIMITIVE" },() => (console.warn(noSubEr(__C, i)), acc) ],
        [ { K_M: `${K_M.includes("S") && K_M}`,  args_type: "PRIMITIVE" },() => (out$.next(__C), acc) ],
        [ { K_M: `${K_M.includes("S") && K_M}`,  args_type: "OBJECT"    },() => (out$.next(__C), __A) ],
        // whatever args type (sans errors), if resolver, let that handle the result
        [ { K_M: `${K_M.includes("R") && K_M}`,  args_type              },() => __RA ],
        // ditto + if topic subscriber, send it downstream
        [ { K_M: `${K_M.includes("RS") && K_M}`, args_type              },() => (out$.next(__R), __RA) ],
        // isn't triggered if an error handler is included
        [ { K_M,                                 args_type: "ERROR"     },() => (console.warn(noEroEr(__C, i)), null) ],
        // if ERROR and handler -> handle error
        [ { K_M: `${K_M.includes("E") && K_M}`,  args_type: "ERROR"     },() => C[CMD_ERRO](acc, args, out$) ]
    ]).get({ K_M, args_type }) || null

    return result && result()
}

/**
 *
 * Handles Collections (array) of Commands ("Tasks") which
 * require _ordered_ choreography and/or have a dependency
 * on some (a)sync data produced by a user interaction.
 *
 * ### Subtasks:
 *
 * Subtasks are the way you compose tasks. Insert a Task and
 * the spool will unpack it in place (super -> sub order
 * preserved) A Subtask must be defined as a unary function
 * that accepts an accumulator object and returns a Task,
 * e.g.:
 *
 * #### PSEUDO
 * ```js
 * // { C: Command }
 * // ( { A: Accumulator }: Object ) => [{C},{C}]: Subtask
 * let someSubtask = ({A}) => [{C}, {C}, ({A})=>[{C},{C}], ...]
 * ```
 *
 * #### Example
 * ```js
 * // subtask example:
 * let subtask1 = acc => [
 *  { sub$: "acc"
 *  , args: { data: acc.data } },
 *  { sub$: "route"
 *  , args: { route: { href: acc.href } } }
 * ]
 *
 * // task
 * let task = [
 *  { args: { href: "https://my.io/todos" } }, // acc init
 *  { sub$: "fetch"
 *  , args: ({ href }) => fetch(href).then(r => r.json())
 *  , erro: (acc, err) => ({ sub$: "cancel", args: err })
 *  , reso: (acc, res) => ({ data: res }) },
 *  acc => subtask1(acc), // subtask reference
 *  { sub$: "FLIP" , args: "done" }
 * ]
 * ```
 * ### Ad-hoc stream injection Example
 *
 * ```js
 * import { stream } from "@thi.ng/rstream"
 * import { map, comp } from "@thi.ng/transducers"
 *
 * // ad-hoc stream
 * let login = stream().subscribe(comp(
 *  map(x => console.log("login ->", x)),
 *  map(({ token }) => loginToMyAuth(token))
 * ))
 *
 * // subtask
 * let subtask_login = ({ token }) => [
 *  { sub$: login // <- stream
 *  , args: () => ({ token }) } // <- use acc
 * ]
 *
 * // task
 * let task = [
 *  // no sub$, just pass data
 *  { args: { href: "https://my.io/auth" } },
 *  { sub$: login , args: () => "logging in..." },
 *  { sub$: "AUTH"
 *  , args: ({ href }) => fetch(href).then(r => r.json())
 *  , erro: (acc, err) => ({ sub$: "cancel", args: err })
 *  , reso: (acc, res) => ({ token: res }) },
 *  acc => subtask_login(acc),
 *  { sub$: login , args: () => "log in success" }
 * ]
 * ```
 *
 * 🔥 IMPORTANT 🔥
 *
 * the accumulation object that's passed between Commands
 * within a task is spread together between Commands. I.e.,
 * later Commands payloads are spread into the accumulator -
 * potentially overwriting earlier Commands playoads, but -
 * if no later payloads keys overlap with keys from earlier
 * payloads those key/value pairs remain intact.
 *
 * ### Example that doesn't work
 * ```js
 * export const pruneKVPairs = (obj, ...keys) => {
 *   let out = {}
 *   Object.entries(obj).forEach(([k, v]) => {
 *     if (keys.some(x => x === k)) return
 *     else return (out[k] = v)
 *   })
 *   return out
 * }
 * const PRUNE_PROPS_CMD = registerCMD({
 *  sub$: "PRUNE_PROPS_CMD",
 *  args: acc => pruneKVPairs(acc, "remove_me", "omit_key")
 * })
 * ```
 * This Command doesn't actually prune the accumulator. It
 * does prune upon receipt, but that pruned result is
 * thereafter spread back together with the prior result,
 * effectively undoing the prune
 *
 * In order to "prune" entries from the accumulator, you
 * must do so at the receiving end of the Task. E.g., by
 * applying it to the output
 *
 */
export const multiplex = out$ => task_array =>
    isArray(task_array)
        ? task_array.reduce(async (a, c, i) => {
              let acc = await a

              /**
               * @example
               * let SubTask = ({ inter_task_prop }) => [
               *      { sub$: "A", args: inter_task_prop + 1 },
               *      { sub$: "B", args: inter_task_prop + 2 }
               * ]
               */
              if (isFunction(c)) {
                  try {
                      const queue = c(acc)
                      // ensures accumulator is preserved
                      // between stack calls
                      queue.unshift({ [CMD_ARGS]: acc })
                      // recur
                      return multiplex(out$)(queue)
                  } catch (e) {
                      console.warn(err_str, e)
                      return
                  }
              }

              return await pattern_match(acc, c, out$, i)

              //  // 🧲
              //  const props_type = keys_match(c)

              //  if (props_type === "NO_ARGS") {
              //      console.warn(no_args_error(c, i))
              //      return (acc = null)
              //  }

              //  // grab Command props
              //  const sub$ = c[CMD_SUB$]
              //  const args = c[CMD_ARGS]
              //  const erro = c[CMD_ERRO]
              //  const reso = c[CMD_RESO]

              // TODO: bring this in...
              //  // ensure no unknown Command props
              //  const knowns = [ CMD_SUB$, CMD_ARGS, CMD_RESO, CMD_ERRO ]
              //  const [ unknowns, unknown_kvs ] = diff_keys(knowns, c)
              //  if (unknowns.length > 0) throw new Error(xKeyError(err_str, c, unknown_kvs, sub$, i))

              //  // 🧲
              //  const arg_type = stringify_type(args)

              //  /* 👆 I: Step 1 -> resolve args to a value 👆 */

              //  // first we set the result to the args
              //  let result = args

              //  // if primitive value with no sub$ prop, use of just
              //  // data would replace accumulator and wouldn't be
              //  // useful for side-effects. I.e., no work done

              //  // CASE: ARGS = NOOP PRIMITIVE
              //  if (arg_type === "PRIMITIVE" && !sub$) {
              //      console.warn(noSubEr(c, i))
              //      return acc
              //  }
              //  // if object (static), send the Command as-is and spread into
              //  // acc. just data = no use of accumulator

              //  // CASE: ARGS = STATIC OBJECT
              //  if (arg_type === "OBJECT") {
              //      if (!sub$) return { ...acc, ...args }
              //      out$.next(c)
              //      return { ...acc, ...args }
              //  }

              //  /**
              //         * Support ad-hoc stream dispatch. E.g.:
              //         *
              //         * let adHoc$ = stream()
              //         * let AD_HOC = registerCMD({
              //         *      sub$: adHoc$,
              //         *      args: () => ({ sub$: "Y", args: 1 })
              //         * })
              //         */
              //  // CASE: AD-HOC STREAM (SPINOFF)
              //  if (arg_type === "NULLARY") {
              //      // if thunk, dispatch to ad-hoc stream, return acc
              //      // as-is ⚠ this command will not be waited on
              //      result = args()
              //      console.log(`dispatching to ad-hoc stream: ${sub$.id}`)
              //      sub$.next(result)
              //      return acc
              //  }

              //  /**
              //         * If some signature needs to deal with both Promises
              //         * and non-Promises, non-Promises are wrapped in a
              //         * Promise to "lift" them into the proper context for
              //         * handling
              //         */
              //  // CASE: ARGS = PROMISE SIG, BUT NOT PROMISE 🤔 what happens to resolved promises?
              //  if (arg_type !== "PROMISE" && reso) result = Promise.resolve(args)
              //  // CASE: ARGS = PROMISE
              //  if (arg_type === "PROMISE") result = await args.catch(e => e)

              //  // if function, call it with acc and resolve any Promises
              //  // CASE ARGS = NON-NULLARY FUNCTION
              //  if (arg_type === "UNARY") {
              //      let temp = args(acc)
              //      result = isPromise(temp) ? await temp.catch(e => e) : temp
              //  }

              //  /* 🤞 II: Step 2 -> deal with any Error 🤞 */

              //  // CASE: RESOLVED ARGS = ERROR
              //  if (result instanceof Error) {
              //      // promise handler
              //      if (reso) {
              //          // reject handler
              //          if (erro) {
              //              const err_type = stringify_type(erro)

              //              // Don't reset accumulator
              //              if (err_type === "NULLARY") {
              //                  let ERR = erro()
              //                  // Error Command
              //                  if (getIn(ERR, [ CMD_SUB$ ])) out$.next(ERR)
              //                  return acc
              //              }

              //              // if the error msg is a Command, send
              //              if (getIn(erro, [ CMD_SUB$ ])) out$.next(erro)
              //              // Function resets accumulator _and_ sends
              //              // saved Command to out$ stream
              //              // e.g.: (acc, err) => ({ sub$, args })
              //              if (err_type === "BINARY") {
              //                  if (getIn(erro(), [ CMD_SUB$ ])) {
              //                      let ERR_CMD = erro(acc, result)
              //                      out$.next(ERR_CMD)
              //                  }
              //                  acc = erro(acc, result)
              //              }
              //          }
              //          // implicitly reset if no error handler provided
              //          acc = null
              //      }
              //      // no promise handler
              //      // no reject handler: carry on
              //      acc === null || console.warn(`no \`erro\` (Error) handler set for ${sub$ || "error"} ${result}`)
              //      return acc
              //  }

              //  // Not an Error
              //  if (reso) {
              //      // resolve Promise
              //      let resolved = reso(acc, result)
              //      // if the resolved value is a Command send it
              //      // through w/out affecting acc
              //      if (getIn(resolved, [ CMD_SUB$ ])) return out$.next(resolved)
              //      // else just assign result to resolved val and
              //      // process in next step
              //      result = resolved
              //  }

              //  /* 👌 III: Step 3 -> Deliver resolved values 👌 */

              //  // resolved value with no sub$ key? -> data
              //  // acquisition only! spread val into acc
              //  if (result === Object(result) && !sub$) return { ...acc, ...result }

              //  // if the final result is primitive, you can't refer
              //  // to this value in following Commands
              //  if (result !== Object(result)) {
              //      // resolved value is primitive & no sub = NoOp
              //      if (!sub$) {
              //          console.warn(noSubEr(c, i))
              //          return acc
              //      }
              //      // send the Command as-is, return acc as-is.
              //      out$.next({ [CMD_SUB$]: sub$, [CMD_ARGS]: result })
              //      return acc
              //  }

              //  //console.log(`NO CONDITIONS MET FOR ${sub$}`)
              //  // if the result has made it this far, send it along
              //  out$.next({ [CMD_SUB$]: sub$, [CMD_ARGS]: result })
              //  return { ...acc, ...result }
          }, Promise.resolve({}))
        : (() => {
              throw new Error(task_not_array_error(task_array))
          })()

/**
 * User-land event dispatch stream
 *
 * This stream is directly exposed to users. Any one-off
 * Commands `next`ed into this stream are sent to the
 * `cmd$` stream. Arrays of Commands (Tasks) are sent to
 * the `task$` stream.
 *
 * TODO: add examples,`beforeunload` event handler within #4
 *    (orphan): SEE https://youtu.be/QQukWZcIptM and enable
 *    ctx.run.cancel() via external or internal events
 *    (e.g., popstate / { sub$:  "cancel" })
 *
 */
export const run$: PubSub<any, any> = pubsub({
    topic: x => !!x[CMD_ARGS],
    id: "run$_stream",
    equiv: (res, tpc) => res === tpc || tpc == "_TRACE_STREAM"
})

/**
 * Primary user-land _READ_ stream. For attaching handlers
 * for responding to emmitted Commands
 */
export const out$: PubSub<any, any> = pubsub({
    topic: x => x[CMD_SUB$],
    id: "out$_stream",
    equiv: (res, tpc) => res === tpc || tpc == "_TRACE_STREAM"
})

/**
 *
 * Primary fork/bisect stream for indivual commands.
 * attached to a `pubsub` stemming from this stream. The
 * `topic` function used to alert downstream handlers is a
 * simple lookup of the `sub$` key of the command
 */
export const cmd$: Subscription<any, any> = run$.subscribeTopic(
    true,
    {
        next: x => out$.next(x),
        error: console.warn
    },
    { id: "cmd$_stream" }
)

/**
 *
 * Task stream that handles Arrays of Commands. Dispatches
 * to `multiplex`er (the heart of `spule`)
 *
 */
export const task$: Subscription<any, any> = run$.subscribeTopic(
    false,
    {
        next: multiplex(out$),
        error: console.warn
    },
    { id: "task$_stream" }
)
