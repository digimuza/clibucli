"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prompt = exports.Canceled = void 0;
const tslib_1 = require("tslib");
const ts_prime_1 = require("ts-prime");
const prompts_1 = tslib_1.__importDefault(require("prompts"));
const util_1 = require("util");
class Canceled extends Error {
    constructor() {
        // tslint:disable-next-line: no-expression-statement
        super('Process was canceled');
        this.name = 'Canceled';
    }
}
exports.Canceled = Canceled;
var Prompt;
(function (Prompt) {
    async function canFail(fn) {
        try {
            return fn();
        }
        catch (err) {
            return err;
        }
    }
    /**
     * Interactive prompt for parsing and extracting string arguments
     * @param message - Prompt question
     * @param validate - String validation logic
     * @param defaultValue - Provide default value if `CLI` argument is `undefined`
     *
     */
    function string(message, validate, defaultValue) {
        return async (value) => {
            const promt = async () => {
                return prompts_1.default({
                    message,
                    type: 'text',
                    name: 'arg',
                    validate: async (a) => {
                        if (ts_prime_1.isString(a)) {
                            if (validate) {
                                const result = await validate(a);
                                if (ts_prime_1.isError(result)) {
                                    return result.message;
                                }
                            }
                            return true;
                        }
                        return `Argument is not string`;
                    },
                }).then((q) => {
                    if (!ts_prime_1.isDefined(q.arg)) {
                        // tslint:disable-next-line: no-throw
                        throw new Canceled();
                    }
                    return q.arg;
                });
            };
            const parse = async () => {
                if (!ts_prime_1.isDefined(value)) {
                    if (defaultValue) {
                        if (ts_prime_1.isFunction(defaultValue)) {
                            return defaultValue();
                        }
                        return defaultValue;
                    }
                }
                if (ts_prime_1.isString(value)) {
                    if (validate) {
                        const ppp = await validate(value);
                        if (ts_prime_1.isError(ppp)) {
                            return promt();
                        }
                        return ppp;
                    }
                    return value;
                }
                return promt();
            };
            return parse();
        };
    }
    Prompt.string = string;
    /**
     * Interactive prompt for parsing and extracting string arguments
     * @param message - Prompt question
     * @param validate - String validation logic
     * @param defaultValue - Provide default value if `CLI` argument is `undefined`
     *
     */
    function file(options) {
        const { message, validate: fn } = options;
        return async (arg, value) => {
            const promt = async () => {
                return prompts_1.default({
                    message,
                    type: 'text',
                    name: 'arg',
                    validate: (a) => {
                        if (ts_prime_1.isString(a)) {
                            if (fn) {
                                const result = fn(a);
                                if (ts_prime_1.isError(result)) {
                                    return result.message;
                                }
                            }
                            return true;
                        }
                        return `Argument ${arg} is not string`;
                    },
                }).then((q) => {
                    if (!ts_prime_1.isDefined(q.arg)) {
                        // tslint:disable-next-line: no-throw
                        throw new Canceled();
                    }
                    return q.arg;
                });
            };
            const parse = async () => {
                if (ts_prime_1.isString(value)) {
                    if (fn) {
                        const ppp = await fn(value);
                        if (ts_prime_1.isError(ppp)) {
                            return promt();
                        }
                        return ppp;
                    }
                    return value;
                }
                return promt();
            };
            return parse();
        };
    }
    Prompt.file = file;
    /**
 * Interactive prompt for selecting multiple values
 * @message - Prompt question
 * @values - Multi select values
 * @defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    function multiSelect(message, values, defaultValue) {
        return async (value) => {
            const getValues = () => {
                if (ts_prime_1.isArray(values)) {
                    return values;
                }
                return values();
            };
            const multSelectValues = await getValues();
            const normalized = multSelectValues.map((q) => {
                if (ts_prime_1.isString(q)) {
                    return { title: q, value: q };
                }
                return { title: q.title, value: q.value };
            });
            const promt = async () => {
                if (normalized.length === 1) {
                    return [normalized[0].value];
                }
                const promtResult = await prompts_1.default({
                    message,
                    type: 'multiselect',
                    name: 'arg',
                    hint: '- Space to select. Return to submit',
                    instructions: false,
                    choices: normalized,
                });
                if (!ts_prime_1.isDefined(promtResult.arg)) {
                    // tslint:disable-next-line: no-throw
                    throw new Canceled();
                }
                return promtResult.arg;
            };
            if (!ts_prime_1.isDefined(value)) {
                if (defaultValue) {
                    return defaultValue;
                }
                return promt();
            }
            const parseValue = async (iValue) => {
                if (ts_prime_1.isString(iValue)) {
                    const parsedJSON = canFail(() => JSON.parse(iValue).map((q) => q.toString()));
                    if (ts_prime_1.isError(parsedJSON)) {
                        if (multSelectValues.includes(iValue)) {
                            return [iValue];
                        }
                        if (iValue.includes('[') && iValue.includes(']')) {
                            const norm = iValue
                                .replace('[', '')
                                .replace(']', '')
                                .split(',')
                                .map((q) => q.trim());
                            const every = normalized.every((q) => {
                                return norm.includes(q.value);
                            });
                            if (every) {
                                const notm = normalized.filter((q) => {
                                    return norm.includes(q.value);
                                });
                                return notm.map((q) => q.value);
                            }
                        }
                        const splitOn = iValue.split(',');
                        const dsa = normalized.map((q) => q.value);
                        const everyV = splitOn.every((q) => {
                            return dsa.includes(q);
                        });
                        if (everyV) {
                            const erqwerqw = normalized.filter((q) => {
                                return splitOn.includes(q.value);
                            });
                            return erqwerqw.map((q) => q.value);
                        }
                        return promt();
                    }
                    if (ts_prime_1.isArray(parsedJSON)) {
                        const selected = normalized.filter((q) => {
                            return parsedJSON.includes(q.value);
                        });
                        return selected.map((q) => q.value);
                    }
                    return promt();
                }
                return promt();
            };
            return parseValue(value);
        };
    }
    Prompt.multiSelect = multiSelect;
    /**
 * Interactive promt for creating cli autocomplete feature
 * @param message - Prompt question
 * @param values - Auto complete values on each input change function will be called again. Function should return array of elements
 */
    function autoComplete(message, values) {
        return async (value) => {
            const autoCompleteValues = await values('');
            const normalized = autoCompleteValues.map((q) => {
                if (ts_prime_1.isString(q)) {
                    return { title: q, value: q };
                }
                return { title: q.title, value: q.value };
            });
            const promt = async () => {
                if (normalized.length === 1) {
                    return normalized[0].value;
                }
                return prompts_1.default({
                    message,
                    type: 'autocomplete',
                    name: 'arg',
                    choices: normalized,
                    suggest: async (input) => {
                        return values(input);
                    },
                }).then((q) => {
                    if (!ts_prime_1.isDefined(q.arg)) {
                        // tslint:disable-next-line: no-throw
                        throw new Canceled();
                    }
                    return q.arg;
                });
            };
            if (!ts_prime_1.isDefined(value)) {
                return promt();
            }
            const parseValue = async () => {
                if (ts_prime_1.isString(value)) {
                    const finedElement = normalized.find((element) => element.value === value);
                    if (finedElement) {
                        return finedElement.value;
                    }
                    return promt();
                }
                return promt();
            };
            return parseValue();
        };
    }
    Prompt.autoComplete = autoComplete;
    /**
 * Interactive promt for confirming an auction
 * @param message - Promt question
 * @param values - Select values as Array or function that returns array
 * @param defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    function select(message, values) {
        return async (value) => {
            const getValues = () => {
                if (ts_prime_1.isArray(values)) {
                    return values;
                }
                return values();
            };
            const selectValues = await getValues();
            if (ts_prime_1.isString(value) && selectValues.includes(value)) {
                return value;
            }
            const normalized = selectValues.map((q) => {
                if (ts_prime_1.isString(q)) {
                    return { title: q, value: q };
                }
                return { title: q.title, value: q.value };
            });
            const promt = async () => {
                if (normalized.length === 1) {
                    return normalized[0].value;
                }
                return prompts_1.default({ message: `${message}`, type: 'select', name: 'arg', choices: normalized }).then((q) => {
                    if (!ts_prime_1.isDefined(q.arg)) {
                        process.exit(1);
                    }
                    return q.arg;
                });
            };
            if (!ts_prime_1.isDefined(value)) {
                return promt();
            }
            const parseValue = async () => {
                if (ts_prime_1.isString(value)) {
                    const finedElement = normalized.find((element) => element.value === value);
                    if (finedElement) {
                        return finedElement.value;
                    }
                    return promt();
                }
                return promt();
            };
            return parseValue();
        };
    }
    Prompt.select = select;
    /**
 * Interactive prompt for confirming an auction
 * @param message - Prompt question
 * @param initial - Initial confirm value
 * @param defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    function confirm(message, initial = false, defaultValue) {
        return async (value) => {
            const promt = async () => {
                return prompts_1.default({ message, initial, type: 'confirm', name: 'arg' }).then((q) => {
                    if (!ts_prime_1.isDefined(q.arg)) {
                        // tslint:disable-next-line: no-throw
                        throw new Canceled();
                    }
                    return q.arg;
                });
            };
            if (!ts_prime_1.isDefined(value)) {
                if (defaultValue) {
                    return defaultValue;
                }
                return promt();
            }
            return !!value;
        };
    }
    Prompt.confirm = confirm;
    /**
 * Interactive prompt for parsing and extracting number arguments
 * @param message - Prompt question
 * @param validate - Number validation logic
 * @param defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    function number(message, validate, defaultValue) {
        return async (value) => {
            const iPrompt = async () => {
                const result = await prompts_1.default({
                    message,
                    type: 'number',
                    name: 'arg',
                    validate: (a) => {
                        const iNumber = parseFloat(a);
                        if (iNumber) {
                            if (validate) {
                                const result = validate(iNumber);
                                if (ts_prime_1.isError(result)) {
                                    return result.message;
                                }
                            }
                            return true;
                        }
                        return `Argument is not number`;
                    },
                });
                if (!ts_prime_1.isDefined(result.arg)) {
                    throw new Canceled();
                }
                return result.arg;
            };
            if (!ts_prime_1.isDefined(value)) {
                if (defaultValue)
                    return defaultValue;
                return iPrompt();
            }
            const parseValue = async () => {
                if (util_1.isBoolean(value))
                    return iPrompt();
                const parsedValue = parseFloat(value);
                if (parsedValue) {
                    if (validate) {
                        const ppp = validate(parsedValue);
                        if (ts_prime_1.isError(ppp)) {
                            return iPrompt();
                        }
                    }
                    return parsedValue;
                }
                return iPrompt();
            };
            return parseValue();
        };
    }
    Prompt.number = number;
})(Prompt = exports.Prompt || (exports.Prompt = {}));
