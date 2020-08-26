"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = exports.command = exports.baseCommand = exports.Cli = exports.__command = exports.__executable = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const parsers_1 = require("./parsers");
const ts_prime_1 = require("ts-prime");
function __executable(data) {
    return {
        getOptions() {
            return data;
        },
        setOptions(fn) {
            return __executable(fn(data));
        },
        async exec(args) {
            var e_1, _a;
            if (data.command == null) {
                // tslint:disable-next-line: no-throw
                throw new Error('Found nameless command. All comands must have command attribute');
            }
            if (args.command !== data.command) {
                return;
            }
            let parsedData = {};
            try {
                for (var _b = tslib_1.__asyncValues((data.parsers || [])), _c; _c = await _b.next(), !_c.done;) {
                    const parser = _c.value;
                    parsedData = await parser(args, parsedData);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (data.handle == null) {
                throw new Error("handle was not provided");
            }
            return data.handle(parsedData);
        },
        help() {
            return '';
        }
    };
}
exports.__executable = __executable;
// tslint:disable
function __command(data) {
    return {
        setOptions(fn) {
            return __command(fn(data));
        },
        getOptions() {
            return data;
        },
        command(command, description) {
            return __command(Object.assign(Object.assign({}, data), { command,
                description }));
        },
        flag(name, required) {
            return __command(Object.assign(Object.assign({}, data), { args: [...(data.args || []), { name, required, kind: 'flag' }] }));
        },
        positional(name) {
            return __command(Object.assign(Object.assign({}, data), { args: [...(data.args || []), { name, required: 'required', kind: 'positional' }] }));
        },
        parse(fn) {
            return __command(Object.assign(Object.assign({}, data), { parsers: [
                    ...(data.parsers || []),
                    (argv, prev) => {
                        const match = (name, fn, defaultValue) => {
                            var _a, _b;
                            const flag = (_a = data.args) === null || _a === void 0 ? void 0 : _a.find((q) => {
                                return q.name.includes(name);
                            });
                            console.log(name, (_b = data.args) === null || _b === void 0 ? void 0 : _b.filter((c) => c.kind === 'positional'));
                            console.log(argv);
                            const value = argv.args.find((c) => {
                                if (c.type === 'positional') {
                                    return !!(flag === null || flag === void 0 ? void 0 : flag.name.includes(c.value));
                                }
                                return ts_prime_1.ensureArray(flag === null || flag === void 0 ? void 0 : flag.name).filter(ts_prime_1.isDefined).map((q) => q.replace(/-/gm, '')).includes(c.arg);
                            });
                            if (fn == null) {
                                return value === null || value === void 0 ? void 0 : value.value;
                            }
                            if (flag == null) {
                                return value;
                            }
                            if (flag.kind === 'positional') {
                                return fn(value === null || value === void 0 ? void 0 : value.value);
                            }
                            if (flag.required === 'required') {
                                return fn(value === null || value === void 0 ? void 0 : value.value);
                            }
                            if (value == null) {
                                return defaultValue;
                            }
                            return fn(value.value);
                        };
                        return fn(match, prev);
                    },
                ] }));
        },
        pipe(fn) {
            return fn(__command(data));
        },
        handle(fn) {
            return __executable(Object.assign(Object.assign({}, data), { handle: fn }));
        },
    };
}
exports.__command = __command;
var Cli;
(function (Cli) {
    function parseArgs(argv) {
        const args = argv.slice(3);
        const command = argv[2];
        return {
            command: command,
            args: parseCliArguments(args),
        };
    }
    Cli.parseArgs = parseArgs;
    /**
     * Function that parses cli arguments
     * @param iRawArgs
     */
    function parseCliArguments(iRawArgs) {
        const r = iRawArgs;
        // tslint:disable-next-line: no-let
        let position = 0;
        const parseReq = (c, qw) => {
            if (c.length === 0) {
                return qw;
            }
            const first = c[0];
            const second = c[1];
            // tslint:disable-next-line: no-collapsible-if
            if (first.includes('--') || first.includes('-')) {
                if (first.includes('=')) {
                    const [key, value] = first.split('=', 2);
                    return parseReq(c.slice(1), [
                        ...qw,
                        {
                            value: value === 'true' || value === 'false' ? value === 'true' : value,
                            type: 'flag',
                            arg: key.replace('--', '').replace('-', ''),
                        },
                    ]);
                }
                if (typeof second === 'undefined') {
                    return parseReq(c.slice(1), [
                        ...qw,
                        {
                            type: 'flag',
                            value: true,
                            arg: first.replace('--', '').replace('-', ''),
                        },
                    ]);
                }
                if (second.includes('--') || second.includes('-')) {
                    return parseReq(c.slice(1), [
                        ...qw,
                        {
                            type: 'flag',
                            value: true,
                            arg: first.replace('--', '').replace('-', ''),
                        },
                    ]);
                }
                return parseReq(c.slice(2), [
                    ...qw,
                    {
                        value: second === 'true' || second === 'false' ? second === 'true' : second,
                        type: 'flag',
                        arg: first.replace('--', '').replace('-', ''),
                    },
                ]);
            }
            return parseReq(c.slice(1), [...qw, { type: 'positional', value: first, index: position++ }]);
        };
        return parseReq(r, []);
    }
})(Cli = exports.Cli || (exports.Cli = {}));
function baseCommand() {
    return __command({});
}
exports.baseCommand = baseCommand;
function command(name, description) {
    return baseCommand().command(name, description);
}
exports.command = command;
async function cli(data) {
    const args = Cli.parseArgs(data.argv || process.argv);
    const command = data.commands.map((q) => q.setOptions((c) => (Object.assign(Object.assign({}, c), { cli: data.cliName }))))
        .find((c) => c.getOptions().command === args.command);
    if (command == null) {
        console.log();
        // tslint:disable-next-line: no-console
        console.log(`Unknown command ${chalk_1.default.bold.red(args.command)} was ${chalk_1.default.yellow('provided')}. For more ${chalk_1.default.bold(`information`)} execute ${chalk_1.default.green.bold(`yarn ${data.cliName} --docs`)} or ${chalk_1.default.bold.green(`yarn ${data.cliName} <command> --docs`)}`);
        console.log();
        const commandName = await parsers_1.Prompt.select(`Which command you want to execute?`, () => {
            return [
                ...data.commands.map((c) => {
                    const options = c.getOptions();
                    return {
                        title: `${chalk_1.default.bold(`${options.command}`)}${options.description ? ` - ${options.description}` : ''}`,
                        value: options.command || '',
                    };
                }),
            ];
        })(undefined);
        const reselectCommand = data.commands.map((q) => q.setOptions((c) => (Object.assign(Object.assign({}, c), { cli: data.cliName }))))
            .find((c) => c.getOptions().command === commandName);
        return reselectCommand === null || reselectCommand === void 0 ? void 0 : reselectCommand.exec(Object.assign(Object.assign({}, args), { command: commandName }));
    }
    return command === null || command === void 0 ? void 0 : command.exec(args);
}
exports.cli = cli;
