# Description

Example of simple echo bot

# Configuration

Configure `.env` file

# Installation

```bash
$ yarn install
```

# Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

# Tips

## Env

1. `BOT_TOKEN` - created in vk bot token, see other tutorials
2. `BOT_GROUP_ID` - group id, example `https://vk.com/club219624730` - `219624730`

## Middleware chain

1. `@On('message_new')`
2. `@Hears(`...`)` - if matched
3. `@HearFallback()`

## Session

1. `Session` save data in memory, if process terminated all data deletes, use `session` with some storage e.g. `Redis`

## Common

1. `VkExceptionFilter` catch all `VkException`
2. `AdminGuard` throws `VkException` and `VkExceptionFilter` catched it, and send to user
