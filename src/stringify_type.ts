/**
 * @module utils/stringify_type
 */

import { isObject, isFunction, isPromise } from '@thi.ng/checks'

// prettier-ignore
/**
 * ### `stringify_type`
 *
 * just a little convenience function takes some value and
 * returns a string representation of its type this makes it
 * easier to create a switch statement using types
 *
 * powered by [@thi.ng/checks](http://thi.ng/checks)
 *
 */
export const stringify_type = x => {
    if (isFunction(x) && x.length === 0)  return "NULLARY"
    if (isFunction(x) && x.length === 1)  return "UNARY"
    if (isFunction(x) && x.length === 2)  return "BINARY"
    if (isFunction(x) && x.length > 2 )   return "N-ARY"
    if (isPromise(x))                     return "PROMISE"
    if (isObject(x))                      return "OBJECT"
                                          return "type_str NOT FOUND"
}
