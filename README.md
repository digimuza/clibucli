# Introduction

Modular typescript CLI builder

Why to have another cli parser when we have [yargs](https://github.com/yargs/yargs), [oclif](https://oclif.io/) and so on.

Reasons
1. Modularity easy to reuse flags and parsing logic.
2. Flag dependency logic. Flags can be validated against other flags.
3. All validation can be interactive. All flags will be always with correct data. If user makes mistakes he have opportunity to fix it [select, retype]

```typescript

    const base = baseCommand()
    .flag(['--debug', '-d'])
    .parse((match)=>{
        return {
            debug: match('--debug', (v) => !!v, false)
        }
    })


    const buildBase = base
    .flag('--port')
    .flag('--env')
    .parse(async (match, prev)=> {
        return {
            ...prev,
            env: await match('--env', Prompt.select('Please select environment', ['production', 'development']), 'development')
            port: await match('--port', Prompt.number('Please enter port number'), 3000)
        }
    })

    cli({
        cliName: 'pkg',
        commands: [
            base.command('lint').handle(()=> {
                // Handle lint
                 }),
                 buildBase.command('watch').handle(({ debug, env, port })=>{
        // handle watch command
    }),     buildBase.command('build').handle(({ debug, env, port })=>{
        // handle watch command
    })
        ]
    })
```

2. Arguments validation order
Lets assume that we have 100 customers each customer have primary namespace. To get customer first of all we need valid namespace then we can have list of customer.

Case 1. `cli execute --customer=1` - This command should fail because namespace is not provided. But instead of immediately throwing this library will show all available namespaces. And when we have namespace we can validate customer argument.

```typescript

command('execute')
    .flag('--namespace', 'required')
    .flag('')

```


3. Arguments dependencies

   Let's assume simple cli `yarn xxx --namespace abc --customer sample`

   - Customer value depends on namespace

   1. Let's assume that `abc` namespace is invalid and correct namespace is `abc_123`

   Cli should fail
