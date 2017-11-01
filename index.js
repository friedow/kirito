const fs = require('fs');
const mongojs = require('mongojs');
const discord = require('discordie');
const handlebars = require('handlebars');
const Screenshot = require('screenshot-stream');

/** A Discord bot, which encourages players to join voice channels. */
class Kirito {
  constructor() {
    // Prepare discord api
    this.discordApi = new discord({autoReconnect: true});
    this.discordApi.connect({ token: process.env.AUTH_TOKEN });

    // Prepare database
    this.db = mongojs(process.env.DATABASE, ['users']);

    // Prepare application state
    this.connectedUsers = [];
    this.subscribeToEvents();
  }

  /**
   * Registers callback functions to certain events which are triggered
   * through the DiscordApi.
   */
  subscribeToEvents() {
    // Bind this into callback functions
    this.prepareBot = this.prepareBot.bind(this);
    this.joinServer = this.joinServer.bind(this);
    this.userConnected = this.userConnected.bind(this);
    this.userDisconnected = this.userDisconnected.bind(this);
    this.handleChatCommand = this.handleChatCommand.bind(this);

    // Subscribe to events
    this.discordApi.Dispatcher.on(discord.Events.GATEWAY_READY, this.prepareBot);
    this.discordApi.Dispatcher.on(discord.Events.GUILD_CREATE, this.joinServer);
    this.discordApi.Dispatcher.on(discord.Events.VOICE_CHANNEL_JOIN, this.userConnected);
    this.discordApi.Dispatcher.on(discord.Events.VOICE_CHANNEL_LEAVE, this.userDisconnected);
    this.discordApi.Dispatcher.on(discord.Events.MESSAGE_CREATE, this.handleChatCommand);
  }

  /**
   * Initializes the bot using the Discord API.
   */
  prepareBot() {
    this.discordApi.User.setGame('together with Asuna');
    this.addCurrentlyConnectedUsers();
  }

  /**
   * Adds all currently connected users to the list of connected users.
   */
  addCurrentlyConnectedUsers() {
    this.discordApi.Guilds.forEach((server) => {
      server.voiceChannels.forEach((channel) => {
        channel.members.forEach((user) => {
          this.addConnectedUser(user, server);
        });
      });
    });
  }

  /**
   * Prints an introduction message.
   * @param {Event} e - Discord API event.
   */
  joinServer(e) {
    e.guild.generalChannel.sendTyping();
    const introduction = [
      'Hi!',
      'I am Kirito, your personal voice chat coach. From now on, every time you join',
      'a voice channel on this Server you will receive experience and therefore level.',
      'Additionally, you can ask me things through so called commands. Currently,',
      'I know two commands. Command number one is `ping`, which obviously starts a',
      'table tennis match, and command number two is called `profile` where I will',
      'print an image of your current player profile.',
      '',
      'Enjoy your time in voice channels :).'
    ]
    e.guild.generalChannel.sendMessage(introduction);
  }

  /**
   * Handles users connecting to voice channels.
   * @param {Event} e - Discord API event.
   */
  userConnected(e) {
    this.addConnectedUser(e.user, e.channel.guild);
  }

  /**
   * Adds a user to the list of users in voice channels (connected users).
   * @param {Object} user - Discord API user object.
   * @param {Object} server - Discord API guild object.
   */
  addConnectedUser(user, server) {
    const rewardInterval = 60000;
    const experiencePerMinute = 1;
    const connectedUser = {};
    connectedUser.experienceTimer = setInterval(() => { this.addExperience(user, server, experiencePerMinute) }, rewardInterval);
    this.connectedUsers[user.id] = connectedUser;
    console.log('User ' + user.username + ' connected to server ' + server.name + '.');
  }

  /**
   * Handles users disconnecting from voice channels.
   * @param {Event} e - Discord API event.
   */
  userDisconnected(e) {
    this.removeConnectedUser(e.user);
  }

  /**
   * Removes a user from the list of users in voice channels (connected users).
   * @param {Object} user - Discord API user object.
   */
  removeConnectedUser(user) {
    if (!this.connectedUsers[user.id]) {
      console.log('User ' + user.username + ' not found in list of online users.');
      return;
    }
    clearInterval(this.connectedUsers[user.id].experienceTimer);
    delete this.connectedUsers[user.id];
    console.log('User ' + user.username + ' disconnected.');
  }

  /**
   * Adds experience to the user account.
   * @param {Object} user - Discord API user object.
   * @param {Object} server - Discord API guild object.
   * @param {Number} experience - Amount of experience to add.
   */
  addExperience(user, server, experience) {
    this.db.users.update({id: user.id}, { $setOnInsert: user, $inc: { experience: experience } }, {upsert: true});
    this.db.users.update({id: user.id, 'servers.id': server.id}, {$inc: {'servers.$.experience': experience}} );
    this.db.users.update({id: user.id, 'servers.id': {$ne: server.id}}, { $push: {'servers': {id: server.id, 'experience': experience}} }, (err, res) => {
      console.log('Added ' + experience + ' experience to user ' + user.username + '.');
      console.log(user.username + ' has now a total experience of ' + res.experience + '.');
    });
  }

  /**
   * Handles received chat messages and checks for chat commands.
   * @param {Event} e - Discord API event.
   */
  handleChatCommand(e) {
    switch (e.message.content) {
      case 'ping':
        e.message.channel.sendTyping();
        e.message.channel.sendMessage('pong');
        break;

      case 'profile':
        this.getProfile(e.message.author, (profile) => {
          e.message.channel.sendTyping();
          e.message.channel.uploadFile(profile, 'profile.png');
        });
        break;
    }
  }

  /**
   * Gathers necessary user data and prepares the image stream to print
   * a users profile.
   * @param {Object} user - Discord API user object.
   * @param {Callback} callback - Called when image stream is ready.
   */
  getProfile(user, callback) {
    const newUser = JSON.parse(JSON.stringify(user));
    newUser.experience = 0;
    console.log('Printing profile for user ' + user.username + '.');
    this.db.users.findAndModify({query: {id: user.id}, update: { $setOnInsert: newUser }, upsert: true, new: true}, (err, result) => {
      const profileInformation = {
        username: user.username,
        level: this.calculateLevel(result.experience),
        levelProgress: this.calculateLevelProgress(result.experience),
        avatar: this.getAvatarUrl(user),
        servers: this.getAdditionalServerData(result.servers)
      };
      console.log('username:' + user.username);
      console.log('level:' + this.calculateLevel(result.experience));
      console.log('experience:' + result.experience);
      console.log('levelProgress:' + this.calculateLevelProgress(result.experience));
      console.log('servers:' + this.getAdditionalServerData(result.servers));
      const profileHtmlFilename = 'profiles/' + user.username + '.html';
      this.createProfileHtml(profileHtmlFilename, profileInformation);
      const stream = this.createProfileImageStream(profileHtmlFilename);

      /**
       * Is called when the profile creation finished and the image stream
       * is ready.
       * @callback callback
       * @param {String} stream - Image stream containing the user profile.
       */
      callback(stream);
    });
  }

  /**
   * Calculates the level given a total amount of experience.
   * @param {Number} experience - Amount of experience.
   * @return {Number} Level corresponding to experience.
   */
  calculateLevel(experience) {
    return Math.floor(Math.sqrt(experience / 3 + 36) - 5);
  }

  /**
   * Calculates the progress of the current level given a total amount
   * of experience.
   * @param {Number} experience - Amount of experience.
   * @return {Number} Level progress in percent (0 - 100).
   */
  calculateLevelProgress(experience) {
    const userLevel = this.calculateLevel(experience);
    const currentLevelMinExperience = this.minLevelExperience(userLevel);
    const nextLevelMinExperience = this.minLevelExperience(userLevel + 1);
    const currentLevelExperience = nextLevelMinExperience - currentLevelMinExperience;
    const userLevelExperience = experience - currentLevelMinExperience;
    return userLevelExperience * 100 / currentLevelExperience;
  }

  /**
   * If the user has an avatar, the avatar is returned, otherwise an URL to
   * a default avatar is returned.
   * @param {Object} user - Discord API user object.
   * @return {String} Avatar URL.
   */
  getAvatarUrl(user) {
    let avatarUrl = '';
    if (user.avatar) {
      avatarUrl = 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png';
    } else {
      const defaultAvatarIndex = Number(user.id) % 100;
      avatarUrl = './images/superheroes/heroes-and-villains-' + defaultAvatarIndex + '.png'
    }
    return avatarUrl;
  }

  /**
   * If the server has an icon, the icon is returned, otherwise an URL to
   * a default icon is returned.
   * @param {Object} server - Discord API server object.
   * @return {String} Icon URL.
   */
  getIconUrl(server) {
    let iconUrl = '';
    if (server.icon) {
      iconUrl = 'https://cdn.discordapp.com/icons/' + server.id + '/' + server.icon + '.png';
    } else {
      const defaultIconIndex = Number(server.id) % 100;
      iconUrl = './images/superheroes/heroes-and-villains-' + defaultIconIndex + '.png'
    }
    return iconUrl;
  }

  /**
   * Calculates the minimal amount of experience needed for a given level.
   * @param {Number} level - The level, which the experience is calculated for.
   * @return {Number} Amount of Experience needed for the level.
   */
  minLevelExperience(level) {
    return (3 * level * (level + 10) - 33);
  }

  /**
   * Fetches additional information for a given list of Discord servers
   * through the Discord API.
   * @param {Array} servers - List of objects containing Discord server ids.
   * @return {Array} List of Discord servers.
   */
  getAdditionalServerData(servers) {
    let serverList = [];
    if (!servers) return [];

    servers.map((currentServer) => {
      const server = this.discordApi.Guilds.get(currentServer.id);
      const databaseServer = JSON.parse(JSON.stringify(server));
      databaseServer.iconURL = this.getIconUrl(server);
      databaseServer.experience = currentServer.experience;
      serverList.push(databaseServer);
    });

    serverList.sort((a, b) => {b.experience - a.experience});
    return serverList;
  }

  /**
   * Creates a HTML profile file containing user information based on
   * a profile template.
   * @param {String} filename - Name and path of the HTML file.
   * @param {Object} profileInformation - Information to fill the HTML profile.
   */
  createProfileHtml(filename, profileInformation) {
    const templateFile = fs.readFileSync('Profile/Profile.html').toString();
    const template = handlebars.compile(templateFile);
    const html = template(profileInformation);
    fs.writeFileSync(filename, html);
  }

  /**
   * Creates an image stream given an HTML file.
   * @param {String} filename - Name and path of the HTML file.
   * @return {String} Image stream.
   */
  createProfileImageStream(filename) {
    return Screenshot(filename, '500x1000', {crop: true, selector: '.profile'});
  }

}

const kiritoInstance = new Kirito();
