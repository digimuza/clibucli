import { isArray, isError, isFunction, isString, isDefined } from 'ts-prime'

import Promts from 'prompts'
import { MaybePromisor } from '../types'
import { isBoolean } from 'util'

export class Canceled extends Error {
    readonly name = 'Canceled'
    constructor() {
        // tslint:disable-next-line: no-expression-statement
        super('Process was canceled')
    }
}

export namespace Prompt {

    

    // tslint:disable: no-collapsible-if
    // tslint:disable: no-console
    // tslint:disable: no-expression-statement
    type AnyDefaultFormat<T> = () => Promise<T> | (() => T) | T
    type CliValue = string | boolean | undefined

    function canFail<R>(fn: () => R): R | Error
    function canFail<R>(fn: () => Promise<R>): Promise<R | Error>
    async function canFail<R>(fn: () => Promise<R>): Promise<R | Error> {
        try {
            return fn()
        } catch (err) {
            return err as Error
        }
    }


    /**
     * Interactive prompt for parsing and extracting string arguments
     * @param message - Prompt question
     * @param validate - String validation logic
     * @param defaultValue - Provide default value if `CLI` argument is `undefined`
     *
     */
    export function string(
        message: string,
        validate?: MaybePromisor<[string], boolean | Error>,
        defaultValue?: AnyDefaultFormat<string>
    ): (value: CliValue) => Promise<string> {
        return async (value: CliValue) => {
            const promt = async () => {
                return Promts({
                    message,
                    type: 'text',
                    name: 'arg',
                    validate: async (a) => {
                        if (isString(a)) {
                            if (validate) {
                                const result = await validate(a)
                                if (isError(result)) {
                                    return result.message
                                }
                            }

                            return true
                        }

                        return `Argument is not string`
                    },
                }).then((q) => {
                    if (!isDefined(q.arg)) {
                        // tslint:disable-next-line: no-throw
                        throw new Canceled()
                    }
                    return q.arg
                })
            }
            const parse = async () => {
                if (!isDefined(value)) {
                    if (defaultValue) {
                        if (isFunction(defaultValue)) {
                            return defaultValue()
                        }

                        return defaultValue
                    }
                }

                if (isString(value)) {
                    if (validate) {
                        const ppp = await validate(value)
                        if (isError(ppp)) {
                            return promt()
                        }
                        return ppp
                    }

                    return value
                }
                return promt()
            }

            return parse()
        }
    }


    /**
     * Interactive prompt for parsing and extracting string arguments
     * @param message - Prompt question
     * @param validate - String validation logic
     * @param defaultValue - Provide default value if `CLI` argument is `undefined`
     *
     */
    export function file(options: {
        readonly message: string
        readonly validate?: MaybePromisor<[string], string | Error>
    }): (arg: string, value: CliValue) => Promise<string> {
        const { message, validate: fn } = options
        return async (arg: string, value: CliValue) => {
            const promt = async () => {
                return Promts({
                    message,
                    type: 'text',
                    name: 'arg',
                    validate: (a) => {
                        if (isString(a)) {
                            if (fn) {
                                const result = fn(a)
                                if (isError(result)) {
                                    return result.message
                                }
                            }

                            return true
                        }

                        return `Argument ${arg} is not string`
                    },
                }).then((q) => {
                    if (!isDefined(q.arg)) {
                        // tslint:disable-next-line: no-throw
                        throw new Canceled()
                    }
                    return q.arg
                })
            }
            const parse = async () => {
                if (isString(value)) {
                    if (fn) {
                        const ppp = await fn(value)
                        if (isError(ppp)) {
                            return promt()
                        }
                        return ppp
                    }

                    return value
                }
                return promt()
            }

            return parse()
        }
    }

    /**
 * Interactive prompt for selecting multiple values
 * @message - Prompt question
 * @values - Multi select values
 * @defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    export function multiSelect<T extends string | { readonly title: string; readonly value: string }>(
        message: string,
        values: MaybePromisor<[], ReadonlyArray<T>> | ReadonlyArray<T>,
        defaultValue?: ReadonlyArray<T extends { readonly title: string; readonly value: any } ? T['value'] : T>
    ): (
            value: string | boolean | undefined
        ) => Promise<ReadonlyArray<T extends { readonly title: string; readonly value: any } ? T['value'] : T>> {
        return async (value: string | boolean | undefined) => {
            const getValues = () => {
                if (isArray(values)) {
                    return values
                }
                return values()
            }
            const multSelectValues = await getValues()
            const normalized = multSelectValues.map((q) => {
                if (isString(q)) {
                    return { title: q, value: q }
                }

                return { title: (q as any).title, value: (q as any).value }
            }) as Array<{ readonly title: string; readonly value: string }>

            const promt = async () => {
                if (normalized.length === 1) {
                    return [normalized[0].value]
                }
                const promtResult = await Promts({
                    message,
                    type: 'multiselect',
                    name: 'arg',
                    hint: '- Space to select. Return to submit',
                    instructions: false,
                    choices: normalized,
                } as any)
                if (!isDefined(promtResult.arg)) {
                    // tslint:disable-next-line: no-throw
                    throw new Canceled()
                }

                return promtResult.arg
            }
            if (!isDefined(value)) {
                if (defaultValue) {
                    return defaultValue
                }

                return promt()
            }

            const parseValue = async (iValue: string | boolean | undefined) => {
                if (isString(iValue)) {
                    const parsedJSON = canFail(() => (JSON.parse(iValue) as ReadonlyArray<string>).map((q) => q.toString()))
                    if (isError(parsedJSON)) {
                        if (multSelectValues.includes(iValue as any)) {
                            return [iValue]
                        }
                        if (iValue.includes('[') && iValue.includes(']')) {
                            const norm = iValue
                                .replace('[', '')
                                .replace(']', '')
                                .split(',')
                                .map((q) => q.trim())
                            const every = normalized.every((q) => {
                                return norm.includes(q.value)
                            })

                            if (every) {
                                const notm = normalized.filter((q) => {
                                    return norm.includes(q.value)
                                })
                                return notm.map((q) => q.value)
                            }
                        }

                        const splitOn = iValue.split(',')
                        const dsa = normalized.map((q) => q.value)
                        const everyV = splitOn.every((q) => {
                            return dsa.includes(q)
                        })
                        if (everyV) {
                            const erqwerqw = normalized.filter((q) => {
                                return splitOn.includes(q.value)
                            })
                            return erqwerqw.map((q) => q.value)
                        }
                        return promt()
                    }

                    if (isArray(parsedJSON)) {
                        const selected = normalized.filter((q) => {
                            return parsedJSON.includes(q.value)
                        })

                        return selected.map((q) => q.value)
                    }

                    return promt()
                }

                return promt()
            }

            return parseValue(value)
        }
    }

    /**
 * Interactive promt for creating cli autocomplete feature
 * @param message - Prompt question
 * @param values - Auto complete values on each input change function will be called again. Function should return array of elements
 */
    export function autoComplete<T extends string | { readonly title: string; readonly value: string }>(
        message: string,
        values: MaybePromisor<[string], ReadonlyArray<T>>,
    ): (
            value: string | boolean | undefined
        ) => Promise<T extends { readonly title: string; readonly value: any } ? T['value'] : T> {
        return async (value: string | boolean | undefined) => {
            const autoCompleteValues = await values('')
            const normalized = autoCompleteValues.map((q) => {
                if (isString(q)) {
                    return { title: q, value: q }
                }

                return { title: (q as any).title, value: (q as any).value }
            }) as Array<{ readonly title: string; readonly value: string }>

            const promt = async () => {
                if (normalized.length === 1) {
                    return normalized[0].value
                }
                return Promts({
                    message,
                    type: 'autocomplete',
                    name: 'arg',
                    choices: normalized,
                    suggest: async (input: string) => {
                        return values(input)
                    },
                }).then((q) => {
                    if (!isDefined(q.arg)) {
                        // tslint:disable-next-line: no-throw
                        throw new Canceled()
                    }
                    return q.arg
                })
            }
            if (!isDefined(value)) {
                return promt()
            }

            const parseValue = async () => {
                if (isString(value)) {
                    const finedElement = normalized.find((element) => element.value === value)
                    if (finedElement) {
                        return finedElement.value
                    }
                    return promt()
                }

                return promt()
            }

            return parseValue()
        }
    }
    /**
 * Interactive promt for confirming an auction
 * @param message - Promt question
 * @param values - Select values as Array or function that returns array
 * @param defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    export function select<T extends string | { readonly title: string; readonly value: string }>(
        message: string,
        values: MaybePromisor<[], ReadonlyArray<T>> | ReadonlyArray<T>,
    ): (
            value: string | boolean | undefined
        ) => Promise<T extends { readonly title: string; readonly value: any } ? T['value'] : T> {
        return async (value: CliValue) => {
            const getValues = () => {
                if (isArray(values)) {
                    return values
                }

                return values()
            }
            const selectValues = await getValues()
            if (isString(value) && (selectValues as readonly string[]).includes(value)) {
                return value
            }

            const normalized = selectValues.map((q) => {
                if (isString(q)) {
                    return { title: q, value: q }
                }

                return { title: (q as any).title, value: (q as any).value }
            }) as Array<{ readonly title: string; readonly value: string }>

            const promt = async () => {
                if (normalized.length === 1) {
                    return normalized[0].value
                }
                return Promts({ message: `${message}`, type: 'select', name: 'arg', choices: normalized }).then((q) => {
                    if (!isDefined(q.arg)) {
                        process.exit(1)
                    }
                    return q.arg
                })
            }
            if (!isDefined(value)) {
                return promt()
            }

            const parseValue = async () => {
                if (isString(value)) {
                    const finedElement = normalized.find((element) => element.value === value)
                    if (finedElement) {
                        return finedElement.value
                    }

                    return promt()
                }

                return promt()
            }

            return parseValue()
        }
    }
    /**
 * Interactive prompt for confirming an auction
 * @param message - Prompt question
 * @param initial - Initial confirm value
 * @param defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    export function confirm(
        message: string,
        initial = false,
        defaultValue?: boolean
    ): (value: string | boolean | undefined) => Promise<boolean> {
        return async (value: string | boolean | undefined) => {
            const promt = async () => {
                return Promts({ message, initial, type: 'confirm', name: 'arg' }).then((q) => {
                    if (!isDefined(q.arg)) {
                        // tslint:disable-next-line: no-throw
                        throw new Canceled()
                    }

                    return q.arg
                })
            }
            if (!isDefined(value)) {
                if (defaultValue) {
                    return defaultValue
                }

                return promt()
            }

            return !!value
        }
    }
    /**
 * Interactive prompt for parsing and extracting number arguments
 * @param message - Prompt question
 * @param validate - Number validation logic
 * @param defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    export function number(
        message: string,
        validate?: (input: number) => number | Error,
        defaultValue?: number
    ): (value: CliValue) => Promise<number> {
        return async (value: string | boolean | undefined) => {
            const iPrompt = async () => {
                const result = await Promts({
                    message,
                    type: 'number',
                    name: 'arg',
                    validate: (a) => {
                        const iNumber = parseFloat(a)
                        if (iNumber) {
                            if (validate) {
                                const result = validate(iNumber)
                                if (isError(result)) {
                                    return result.message
                                }
                            }

                            return true
                        }

                        return `Argument is not number`
                    },
                })

                if (!isDefined(result.arg)) {
                    throw new Canceled()
                }
                return result.arg
            }
            if (!isDefined(value)) {
                if (defaultValue) return defaultValue
                return iPrompt()
            }

            const parseValue = async () => {
                if (isBoolean(value)) return iPrompt()
                const parsedValue = parseFloat(value)
                if (parsedValue) {
                    if (validate) {
                        const ppp = validate(parsedValue)
                        if (isError(ppp)) {
                            return iPrompt()
                        }
                    }
                    return parsedValue
                }
                return iPrompt()
            }

            return parseValue()
        }
    }
}
