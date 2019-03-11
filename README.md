# Kirito
A Discord bot, which encourages players to join voice channels.

## Installation

### Cloud based (simple)
Use the cloud based solution to [add Kirito to your Discord Server](https://discordapp.com/api/oauth2/authorize?client_id=340419258045562882&permissions=402705408&scope=bot).

### Self-hosted (advanced)
You can set up your own instance of Kirito using the [Docker image](https://hub.docker.com/r/friedow/kirito/).

#### Requirements
1. [Docker](https://www.docker.com/)

#### Installation Instructions
1. Create a new Discord application under https://discordapp.com/developers/applications/me.

1. Under "APP DETAILS" copy the "Client ID".

1. Add your bot to a server of your choice. (Change the link to match you bots client ID)

  https://discordapp.com/api/oauth2/authorize?client_id=[BOT_CLIENT_ID_HERE]&permissions=402705408&scope=bot

1. Under "APP BOT USER > Token" press "click to reveal" and copy the token.

  Hint: This is your bots application authentication token. Do not give post it while asking for help or give it to anyone.

1. Deploy the service using docker compose or docker stack: 
  ```docker-compose up``` or ```docker stack deploy -c docker-compose.yml kirito```.


## Development

### Documentation
Please see https://doxdox.org/friedow/kirito for a detailed documentation.

### Conventions
1. Javascript is styled by [Airbnb guidelines](https://github.com/airbnb/javascript)
1. Code is documented through [jsdoc](http://usejsdoc.org/).

### Setup

1. Clone the repository

  ```git clone git@github.com:friedow/kirito.git```

1. Enter the directory

  ```cd kirito```

1. Install dependencies

  ```npm install```

1. Create a new Discord application under https://discordapp.com/developers/applications/me.

1. Under "APP DETAILS" copy the "Client ID".

1. Add your development bot to a server of your choice. (Change the link to match you bots client ID)

  https://discordapp.com/oauth2/authorize?&client_id=BOT_CLIENT_ID_HERE&scope=bot

1. Under "APP BOT USER > Token" press "click to reveal" and copy the token.

  Hint: This is your bots application authentication token. Do not give post it while asking for help or give it to anyone.

1. Set environment the following variables

  ```
  AUTH_TOKEN=BOT_AUTH_TOKEN_HERE
  DATABASE=kirito
  ```

1. Run the application and start developing.

  ```npm start```
