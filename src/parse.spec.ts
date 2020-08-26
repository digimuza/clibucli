import { Cli } from "./types"

const base = ['/usr/local/bin/ts-node',
    '/home/andmzr/Documents/Darbas/Projektai/clibucli/src/test.ts']
test(
    'Boolean parsing', () => {
        expect(Cli.parseArgs([...base, 'asd', '--d']))
            .toEqual({ "args": [{ "arg": "d", "type": "flag", "value": true }], "command": "asd" })
        expect(Cli.parseArgs([...base, 'asd', '--d=true']))
            .toEqual({ "args": [{ "arg": "d", "type": "flag", "value": true }], "command": "asd" })
    }
)

test(
    'String parsing', () => {
        expect(Cli.parseArgs([...base, 'asd', '--abc=123']))
            .toEqual({ "args": [{ "arg": "abc", "type": "flag", "value": "123" }], "command": "asd" })
    }
)