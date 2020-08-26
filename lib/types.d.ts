export declare function __executable(data: Cli.CommandOptions): {
    getOptions(): Cli.CommandOptions;
    setOptions(fn: (data: Cli.CommandOptions) => Cli.CommandOptions): any;
    exec(args: Cli.ParsedArgv): Promise<unknown>;
    help(): string;
};
export declare function __command(data: Cli.CommandOptions): any;
export declare type MaybePromisor<Input extends any[], Output> = ((...args: Input) => Promise<Output>) | ((...args: Input) => Output);
export declare namespace Cli {
    export function parseArgs(argv: ReadonlyArray<string>): Cli.ParsedArgv;
    export interface CliArgTypes {
        readonly positional: {
            readonly value: string;
            readonly index: number;
        };
        readonly flag: {
            readonly arg: string;
            readonly value: string | boolean;
        };
    }
    /**
     * Union of CliArgTypes
     * @public
     */
    export type CliArg<Type extends keyof CliArgTypes = keyof CliArgTypes> = {
        [K in keyof CliArgTypes]: CliArgTypes[K] & {
            readonly type: K;
        };
    }[Type];
    export interface ParsedArgv {
        readonly command: string;
        readonly args: ReadonlyArray<CliArg>;
    }
    export interface RequiredFlag<T extends string> {
        readonly kind: 'flag';
        readonly required: 'required';
        readonly name: T | ReadonlyArray<T>;
    }
    export interface OptionalFlag<T extends string> {
        readonly kind: 'flag';
        readonly required: 'optional';
        readonly name: T | ReadonlyArray<T>;
    }
    export interface Positional<T extends string> {
        readonly kind: 'positional';
        readonly required: 'required';
        readonly name: T;
    }
    export type Flags = RequiredFlag<string> | OptionalFlag<string> | Positional<string>;
    export interface CommandOptions {
        readonly cli?: string;
        readonly command?: string;
        readonly description?: string;
        readonly parsers?: ReadonlyArray<(argv: ParsedArgv, data: unknown) => unknown>;
        readonly args?: ReadonlyArray<Flags>;
        readonly handle?: (data: unknown) => unknown;
    }
    export interface EmptyCommand<Q = {}> {
        setOptions(fn: (data: CommandOptions) => CommandOptions): EmptyCommand<Q>;
        getOptions(): CommandOptions;
        command(command: string, description?: string): EmptyCommand<Q>;
        flag<T extends string>(name: T | ReadonlyArray<T>): Command<Q, OptionalFlag<T>>;
        flag<T extends string>(name: T | ReadonlyArray<T>, required: 'optional', description?: string): Command<Q, OptionalFlag<T>>;
        flag<T extends string>(name: T | ReadonlyArray<T>, required: 'required', description?: string): Command<Q, RequiredFlag<T>>;
        positional<T extends string>(name: T | ReadonlyArray<T>): Command<Q, Positional<T>>;
        handle<R>(fn: (data: Q) => R | Promise<R>): Executable<R>;
    }
    export interface Executable<R> {
        setOptions(fn: (data: CommandOptions) => CommandOptions): Executable<R>;
        getOptions(): CommandOptions;
        exec(arv: ParsedArgv): Promise<R>;
        help(): string;
    }
    export interface Command<Q, X extends Flags> {
        setOptions(fn: (data: CommandOptions) => CommandOptions): EmptyCommand<Q>;
        getOptions(): CommandOptions;
        command(command: string, description?: string): Command<Q, X>;
        help(helpString: string): Command<Q, X>;
        flag<T extends string>(name: T | ReadonlyArray<T>): Command<Q, X | OptionalFlag<T>>;
        flag<T extends string>(name: T | ReadonlyArray<T>, required: 'optional', description?: string): Command<Q, X | OptionalFlag<T>>;
        flag<T extends string>(name: T | ReadonlyArray<T>, required: 'required', description?: string): Command<Q, X | RequiredFlag<T>>;
        flag(name: string | ReadonlyArray<string>, required: 'required', description?: string): Command<Q, X | RequiredFlag<string>>;
        flag(name: string | ReadonlyArray<string>): Command<Q, X | OptionalFlag<string>>;
        flag(name: string | ReadonlyArray<string>, required: 'optional', description?: string): Command<Q, X | OptionalFlag<string>>;
        positional<T extends string>(name: T | ReadonlyArray<T>): Command<Q, X | Positional<T>>;
        parse<Z>(parse: (match: Match<X>, data: Q) => Z): Command<Z extends Promise<any> ? PromiseValueOf<Z> : Z, X>;
        handle<R>(fn: (data: Q) => R | Promise<R>): Executable<R>;
        pipe<W extends Command<Q, X>, R extends Command<unknown, X>>(fn: (data: W) => R): R;
    }
    type PromiseValueOf<O> = O extends Promise<infer T> ? T : never;
    export type FlagReturnValue<FlagList extends Flags, T extends FlagList['name'], R, D> = R extends Promise<any> ? Promise<Extract<FlagList, {
        readonly name: T | ReadonlyArray<T>;
    }>['required'] extends 'required' ? PromiseValueOf<R> : PromiseValueOf<R> | D> : Extract<FlagList, {
        readonly name: T | ReadonlyArray<T>;
    }>['required'] extends 'required' ? R : R | D;
    export interface Match<FlagList extends Flags> {
        <T, N extends FlagList['name'], D = undefined>(parse: N): FlagReturnValue<FlagList, N, string | boolean | undefined, D>;
        <T, N extends FlagList['name'], D = undefined>(parse: N, fn: (data: string | undefined | boolean) => T, defaultValue?: D): FlagReturnValue<FlagList, N, T, D>;
    }
    export {};
}
export declare function baseCommand(): Cli.EmptyCommand;
export declare function command(name: string, description?: string): Cli.EmptyCommand<{}>;
export declare function cli(data: {
    cliName: string;
    commands: ReadonlyArray<Cli.Executable<unknown>>;
    argv?: ReadonlyArray<string>;
}): Promise<unknown>;
//# sourceMappingURL=types.d.ts.map