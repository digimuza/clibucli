import chalk from 'chalk'
import { Prompt } from './parsers'
import { ensureArray, isDefined } from 'ts-prime'

export function __executable(data: Cli.CommandOptions) {
    return {
        getOptions() {
            return data
        },
        setOptions(fn: (data: Cli.CommandOptions) => Cli.CommandOptions) {
            return __executable(fn(data))
        },
        async exec(args: Cli.ParsedArgv) {
            if (data.command == null) {
                // tslint:disable-next-line: no-throw
                throw new Error('Found nameless command. All comands must have command attribute')
            }
            if (args.command !== data.command) {
                return
            }
            let parsedData = {} as unknown
            for await (const parser of (data.parsers || [])) {
                parsedData = await parser(args, parsedData)
            }

            if (data.handle == null) {
                throw new Error("handle was not provided")
            }

            return data.handle(parsedData)
        },
        help() {
            return ''
        }
    }
}

// tslint:disable
export function __command(data: Cli.CommandOptions) {
    return {
        setOptions(fn: (data: Cli.CommandOptions) => Cli.CommandOptions) {
            return __command(fn(data))
        },
        getOptions() {
            return data
        },
        command(command: string, description?: string) {
            return __command({
                ...data,
                command,
                description,
            })
        },
        flag(name: string | ReadonlyArray<string>, required: 'optional' | 'required') {
            return __command({
                ...data,
                args: [...(data.args || []), { name, required, kind: 'flag' } as Cli.Flags],
            })
        },
        positional(name: string) {
            return __command({
                ...data,
                args: [...(data.args || []), { name, required: 'required', kind: 'positional' } as Cli.Flags],
            })
        },
        parse(fn: (match: (name: string, fn: () => unknown, defaultValue?: unknown) => unknown, prev: unknown) => unknown) {
            return __command({
                ...data,
                parsers: [
                    ...(data.parsers || []),
                    (argv: Cli.ParsedArgv, prev: unknown) => {
                        const match = (
                            name: string,
                            fn?: (data: string | undefined | boolean) => unknown,
                            defaultValue?: unknown
                        ) => {
                            const flag = data.args?.find((q) => {
                                return q.name.includes(name)
                            })
                            console.log(name, data.args?.filter((c) => c.kind === 'positional'))
                            console.log(argv)
                            const value = argv.args.find((c) => {
                                if (c.type === 'positional') {
                                    return !!flag?.name.includes(c.value)
                                }
                                return ensureArray(flag?.name).filter(isDefined).map((q) => q.replace(/-/gm, '')).includes(c.arg)
                            })

                            if (fn == null) {
                                return value?.value
                            }

                            if (flag == null) {
                                return value
                            }


                            if (flag.kind === 'positional') {
                                return fn(value?.value)
                            }
                            if (flag.required === 'required') {
                                return fn(value?.value)
                            }
                            if (value == null) {
                                return defaultValue
                            }
                            return fn(value.value)
                        }
                        return fn(match, prev)
                    },
                ],
            })
        },
        pipe(fn: (x: any) => any) {
            return fn(__command(data))
        },
        handle(fn: (data: unknown) => unknown) {
            return __executable({
                ...data,
                handle: fn,
            })
        },
    } as any
}




export type MaybePromisor<Input extends any[], Output> =
    | ((...args: Input) => Promise<Output>)
    | ((...args: Input) => Output)



export namespace Cli {
    export function parseArgs(argv: ReadonlyArray<string>): Cli.ParsedArgv {
        const args = argv.slice(3)
        const command = argv[2]
        return {
            command: command,
            args: parseCliArguments(args),
        }
    }

    /**
     * Function that parses cli arguments
     * @param iRawArgs
     */
    function parseCliArguments(iRawArgs: ReadonlyArray<string>): ReadonlyArray<Cli.CliArg> {
        const r = iRawArgs
        // tslint:disable-next-line: no-let
        let position = 0
        const parseReq = (c: ReadonlyArray<string>, qw: any[]): any => {
            if (c.length === 0) {
                return qw
            }
            const first = c[0]
            const second = c[1]

            // tslint:disable-next-line: no-collapsible-if
            if (first.includes('--') || first.includes('-')) {
                if (first.includes('=')) {
                    const [key, value] = first.split('=', 2)

                    return parseReq(c.slice(1), [
                        ...qw,
                        {
                            value: value === 'true' || value === 'false' ? value === 'true' : value,
                            type: 'flag',
                            arg: key.replace('--', '').replace('-', ''),
                        },
                    ])
                }

                if (typeof second === 'undefined') {
                    return parseReq(c.slice(1), [
                        ...qw,
                        {
                            type: 'flag',
                            value: true,
                            arg: first.replace('--', '').replace('-', ''),
                        },
                    ])
                }

                if (second.includes('--') || second.includes('-')) {
                    return parseReq(c.slice(1), [
                        ...qw,
                        {
                            type: 'flag',
                            value: true,
                            arg: first.replace('--', '').replace('-', ''),
                        },
                    ])
                }

                return parseReq(c.slice(2), [
                    ...qw,
                    {
                        value: second === 'true' || second === 'false' ? second === 'true' : second,
                        type: 'flag',
                        arg: first.replace('--', '').replace('-', ''),
                    },
                ])
            }
            return parseReq(c.slice(1), [...qw, { type: 'positional', value: first, index: position++ }])
        }

        return parseReq(r, [])
    }
    export interface CliArgTypes {
        readonly positional: {
            readonly value: string
            readonly index: number
        }
        readonly flag: {
            readonly arg: string
            readonly value: string | boolean
        }
    }

    /**
     * Union of CliArgTypes
     * @public
     */
    export type CliArg<Type extends keyof CliArgTypes = keyof CliArgTypes> = {
        [K in keyof CliArgTypes]: CliArgTypes[K] & { readonly type: K }
    }[Type]

    export interface ParsedArgv {
        readonly command: string
        readonly args: ReadonlyArray<CliArg>
    }
    export interface RequiredFlag<T extends string> {
        readonly kind: 'flag'
        readonly required: 'required'
        readonly name: T | ReadonlyArray<T>
    }

    export interface OptionalFlag<T extends string> {
        readonly kind: 'flag'
        readonly required: 'optional'
        readonly name: T | ReadonlyArray<T>
    }

    export interface Positional<T extends string> {
        readonly kind: 'positional'
        readonly required: 'required'
        readonly name: T
    }

    export type Flags = RequiredFlag<string> | OptionalFlag<string> | Positional<string>
    export interface CommandOptions {
        readonly cli?: string
        readonly command?: string
        readonly description?: string
        readonly parsers?: ReadonlyArray<(argv: ParsedArgv, data: unknown) => unknown>
        readonly args?: ReadonlyArray<Flags>
        readonly handle?: (data: unknown) => unknown
    }
    export interface EmptyCommand<Q = {}> {
        setOptions(fn: (data: CommandOptions) => CommandOptions): EmptyCommand<Q>
        getOptions(): CommandOptions
        command(command: string, description?: string): EmptyCommand<Q>
        flag<T extends string>(name: T | ReadonlyArray<T>): Command<Q, OptionalFlag<T>>
        flag<T extends string>(
            name: T | ReadonlyArray<T>,
            required: 'optional',
            description?: string
        ): Command<Q, OptionalFlag<T>>
        flag<T extends string>(
            name: T | ReadonlyArray<T>,
            required: 'required',
            description?: string
        ): Command<Q, RequiredFlag<T>>
        positional<T extends string>(name: T | ReadonlyArray<T>): Command<Q, Positional<T>>
        handle<R>(fn: (data: Q) => R | Promise<R>): Executable<R>
    }

    export interface Executable<R> {
        setOptions(fn: (data: CommandOptions) => CommandOptions): Executable<R>
        getOptions(): CommandOptions
        exec(arv: ParsedArgv): Promise<R>
        help(): string
    }
    export interface Command<Q, X extends Flags> {
        setOptions(fn: (data: CommandOptions) => CommandOptions): EmptyCommand<Q>
        getOptions(): CommandOptions
        command(command: string, description?: string): Command<Q, X>
        help(helpString: string): Command<Q, X>
        flag<T extends string>(name: T | ReadonlyArray<T>): Command<Q, X | OptionalFlag<T>>
        flag<T extends string>(name: T | ReadonlyArray<T>, required: 'optional', description?: string): Command<Q, X | OptionalFlag<T>>
        flag<T extends string>(name: T | ReadonlyArray<T>, required: 'required', description?: string): Command<Q, X | RequiredFlag<T>>
        flag(name: string | ReadonlyArray<string>, required: 'required', description?: string): Command<Q, X | RequiredFlag<string>>
        flag(name: string | ReadonlyArray<string>): Command<Q, X | OptionalFlag<string>>
        flag(name: string | ReadonlyArray<string>, required: 'optional', description?: string): Command<Q, X | OptionalFlag<string>>
        positional<T extends string>(name: T | ReadonlyArray<T>): Command<Q, X | Positional<T>>
        parse<Z>(parse: (match: Match<X>, data: Q) => Z): Command<Z extends Promise<any> ? PromiseValueOf<Z> : Z, X>
        handle<R>(fn: (data: Q) => R | Promise<R>): Executable<R>
        pipe<W extends Command<Q, X>, R extends Command<unknown, X>>(fn: (data: W) => R): R
    }

    type PromiseValueOf<O> = O extends Promise<infer T> ? T : never;

    export type FlagReturnValue<FlagList extends Flags, T extends FlagList['name'], R, D> = R extends Promise<any>
        ? Promise<
            Extract<FlagList, { readonly name: T | ReadonlyArray<T> }>['required'] extends 'required'
            ? PromiseValueOf<R>
            : PromiseValueOf<R> | D
        >
        : Extract<FlagList, { readonly name: T | ReadonlyArray<T> }>['required'] extends 'required'
        ? R
        : R | D

    export interface Match<FlagList extends Flags> {
        // tslint:disable-next-line: callable-types
        <T, N extends FlagList['name'], D = undefined>(
            parse: N,
        ): FlagReturnValue<FlagList, N, string | boolean | undefined, D>
        <T, N extends FlagList['name'], D = undefined>(
            parse: N,
            fn: (data: string | undefined | boolean) => T,
            defaultValue?: D
        ): FlagReturnValue<FlagList, N, T, D>
    }



}

export function baseCommand(): Cli.EmptyCommand {
    return __command({}) as Cli.EmptyCommand
}


export function command(name: string, description?: string) {
    return baseCommand().command(name, description)
}

export async function cli(data: { cliName: string, commands: ReadonlyArray<Cli.Executable<unknown>>, argv?: ReadonlyArray<string> }) {
    const args = Cli.parseArgs(data.argv || process.argv)
    const command = data.commands.map((q) => q.setOptions((c) => ({ ...c, cli: data.cliName })))
        .find((c) => c.getOptions().command === args.command)

    if (command == null) {
        console.log()
        // tslint:disable-next-line: no-console
        console.log(
            `Unknown command ${chalk.bold.red(args.command)} was ${chalk.yellow(
                'provided'
            )}. For more ${chalk.bold(`information`)} execute ${chalk.green.bold(
                `yarn ${data.cliName} --docs`
            )} or ${chalk.bold.green(`yarn ${data.cliName} <command> --docs`)}`
        )
        console.log()

        const commandName = await Prompt.select(`Which command you want to execute?`, () => {
            return [
                ...data.commands.map((c) => {
                    const options = c.getOptions()
                    return {
                        title: `${chalk.bold(`${options.command}`)}${options.description ? ` - ${options.description}` : ''}`,
                        value: options.command || '',
                    }
                }),
            ]
        })(undefined)

        const reselectCommand = data.commands.map((q) => q.setOptions((c) => ({ ...c, cli: data.cliName })))
            .find((c) => c.getOptions().command === commandName)

        return reselectCommand?.exec({
            ...args,
            command: commandName
        })
    }
    return command?.exec(args)
}