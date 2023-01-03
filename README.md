# Nova quickstart

This is a simple example of a nov base Discord bot inspired by the discord.js structure.

## What you'll be doing

This repo is a simple example of a bot developped using Nova. It's a simple bot that executes `ping` (ICMP Echo) requests using slash-commands.

> Issuing arbitrary pings is not viable for a real discord bot, this is an example. Acces to your developement bot should be kept private to avoid abuse.

<img src="imgs/nova1.png">

## Running

### Configuring your instance

> The nova-all-in-one we are going to use is going to search this directory for a `default.{toml,json,json5,yml,yaml}`, feel free to use the configuration language you feel confortable with.

You need to fill the configuration file and rename it to `default.yml` in the `config/` folder.

### Getting nova running

Download the nova-all-in-one server and put it in `bin/nova`.
You can find the binary in the nova project releases page.

> You can also use a full Nova instance running in `docker-compose` or an orchestrator such as [Kubernetes](https://kubernetes.io). Using a real nova instance, you'll need to store the configuration file safely depending on your orchestrator.

The next step is starting nova:

```bash
RUST_LOG=info ./bin/nova
```

### Installing npm dependencies

Since this example use node, you need node.js installed and a package manager, we recommend *yarn* or *pnpm*. 

```bash
# Using yarn
yarn
# Using pnpm
pnpm install
# Using npm
npm install
```

### Registering commands

Before starting your bot, you need to run the `register.ts` utility to register the commands wihin discord.

> Registering commands is a one-time operation to tell discord which commands are available, you can read more about it [here](https://discord.com/developers/docs/interactions/application-commands#registering-a-command)

```bash
# Using yarn
yarn register
# Using pnpm
pnpm run register
# Using npm
npm run register
```

### Starting the bot

Finally, you can start the bot instance.

```bash
# Using yarn
yarn start
# Using pnpm
pnpm run start
# Using npm
npm run start
```

**Everything should be running now!**