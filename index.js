const fs = require('fs');
const mongojs = require('mongojs');
const discord = require('discordie');
const handlebars = require('handlebars');
const Screenshot = require('screenshot-stream');

class Kirito {
  constructor() {
    // Prepare discord api
    this.discordApi = new discord();
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
    this.setGame = this.setGame.bind(this);
    this.addConnectedUser = this.addConnectedUser.bind(this);
    this.removeConnectedUser = this.removeConnectedUser.bind(this);
    this.handleChatCommand = this.handleChatCommand.bind(this);

    // Subscribe to events
    this.discordApi.Dispatcher.on(discord.Events.GATEWAY_READY, this.setGame);
    this.discordApi.Dispatcher.on(discord.Events.VOICE_CHANNEL_JOIN, this.addConnectedUser);
    this.discordApi.Dispatcher.on(discord.Events.VOICE_CHANNEL_LEAVE, this.removeConnectedUser);
    this.discordApi.Dispatcher.on(discord.Events.MESSAGE_CREATE, this.handleChatCommand);
  }

  /**
   * Tells Discord which game is be displayed below the name.
   */
  setGame() {
    this.discordApi.User.setGame('together with Asuna');
  }

  /**
   * Adds a user to the list of users
   * in voice channels (connected users).
   * @param {Event} e - Discord API event.
   */
  addConnectedUser(e) {
    const user = JSON.parse(JSON.stringify(e.user));
    user.dateConnected = Date.now();
    this.connectedUsers[e.user.id] = user;
    console.log('User ' + e.user.username + ' connected to voice channel ' + e.channel.name + ' on server ' + e.channel.guild.name + '.');
  }

  /**
   * Removes a user from the list of users in voice channels (connected users).
   * @param {Event} e - Discord API event.
   */
  removeConnectedUser(e) {
    const experience = this.calculateVoiceTime(e.user);
    this.addExperience(e.user, e.channel.guild, experience);
    delete this.connectedUsers[e.user.id];
    console.log('User ' + e.user.username + ' disconnected from voice channel ' + e.channel.name + ' on server ' + e.channel.guild.name + '.');
  }

  /**
   * Calculates the time a user spent in a voice channel.
   * @param {Object} user - Discord API user object.
   * @return {Number} Voice time in minutes.
   */
  calculateVoiceTime(user) {
    const dateDisconnected = Date.now();
    const connectedUser = this.connectedUsers[user.id];
    if (connectedUser) {
      return Math.round((dateDisconnected - connectedUser.dateConnected) / 60000);
    } else {
      console.log('User ' + user.username + ' not found in list of online users. 0 minutes online.');
      return 0;
    }
  }

  /**
   * Adds experience to the user account.
   * @param {Object} user - Discord API user object.
   * @param {Object} server - Discord API guild object.
   * @param {Number} experience - Amount of experience to add.
   */
  addExperience(user, server, experience) {
    this.db.users.update({id: user.id, 'servers.id': server.id}, {$inc: {'servers.$.experience': experience}} );
    this.db.users.update({id: user.id, 'servers.id': {$ne: server.id}}, { $setOnInsert: user, $inc: { experience: experience }, $push: {'servers': {id: server.id, 'experience': experience}} }, {upsert: true, new: true}, (err, res) => {
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
        e.message.channel.sendMessage('pong');
        break;

      case 'profile':
        this.getProfile(e.message.author, (profile) => {
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
        avatar: user.staticAvatarURL,
        servers: this.getAdditionalServerData(result.servers)
      };
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
    return Math.round(Math.sqrt(experience / 3 + 36) - 5);
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
