import { MaybePromisor } from '../types';
export declare class Canceled extends Error {
    readonly name = "Canceled";
    constructor();
}
export declare namespace Prompt {
    type AnyDefaultFormat<T> = () => Promise<T> | (() => T) | T;
    type CliValue = string | boolean | undefined;
    /**
     * Interactive prompt for parsing and extracting string arguments
     * @param message - Prompt question
     * @param validate - String validation logic
     * @param defaultValue - Provide default value if `CLI` argument is `undefined`
     *
     */
    export function string(message: string, validate?: MaybePromisor<[string], boolean | Error>, defaultValue?: AnyDefaultFormat<string>): (value: CliValue) => Promise<string>;
    /**
     * Interactive prompt for parsing and extracting string arguments
     * @param message - Prompt question
     * @param validate - String validation logic
     * @param defaultValue - Provide default value if `CLI` argument is `undefined`
     *
     */
    export function file(options: {
        readonly message: string;
        readonly validate?: MaybePromisor<[string], string | Error>;
    }): (arg: string, value: CliValue) => Promise<string>;
    /**
 * Interactive prompt for selecting multiple values
 * @message - Prompt question
 * @values - Multi select values
 * @defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    export function multiSelect<T extends string | {
        readonly title: string;
        readonly value: string;
    }>(message: string, values: MaybePromisor<[], ReadonlyArray<T>> | ReadonlyArray<T>, defaultValue?: ReadonlyArray<T extends {
        readonly title: string;
        readonly value: any;
    } ? T['value'] : T>): (value: string | boolean | undefined) => Promise<ReadonlyArray<T extends {
        readonly title: string;
        readonly value: any;
    } ? T['value'] : T>>;
    /**
 * Interactive promt for creating cli autocomplete feature
 * @param message - Prompt question
 * @param values - Auto complete values on each input change function will be called again. Function should return array of elements
 */
    export function autoComplete<T extends string | {
        readonly title: string;
        readonly value: string;
    }>(message: string, values: MaybePromisor<[string], ReadonlyArray<T>>): (value: string | boolean | undefined) => Promise<T extends {
        readonly title: string;
        readonly value: any;
    } ? T['value'] : T>;
    /**
 * Interactive promt for confirming an auction
 * @param message - Promt question
 * @param values - Select values as Array or function that returns array
 * @param defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    export function select<T extends string | {
        readonly title: string;
        readonly value: string;
    }>(message: string, values: MaybePromisor<[], ReadonlyArray<T>> | ReadonlyArray<T>): (value: string | boolean | undefined) => Promise<T extends {
        readonly title: string;
        readonly value: any;
    } ? T['value'] : T>;
    /**
 * Interactive prompt for confirming an auction
 * @param message - Prompt question
 * @param initial - Initial confirm value
 * @param defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    export function confirm(message: string, initial?: boolean, defaultValue?: boolean): (value: string | boolean | undefined) => Promise<boolean>;
    /**
 * Interactive prompt for parsing and extracting number arguments
 * @param message - Prompt question
 * @param validate - Number validation logic
 * @param defaultValue - Provide default value if `CLI` argument is `undefined`
 */
    export function number(message: string, validate?: (input: number) => number | Error, defaultValue?: number): (value: CliValue) => Promise<number>;
    export {};
}
//# sourceMappingURL=index.d.ts.map