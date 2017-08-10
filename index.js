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
    this.db = mongojs('kirito', ['users']);

    // Prepare application state
    this.connectedUsers = [];
    this.subscribeToEvents();
  }

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

  setGame() {
    this.discordApi.User.setGame('together with Asuna');
  }

  addConnectedUser(e) {
    const user = JSON.parse(JSON.stringify(e.user));
    user.dateConnected = Date.now();
    this.connectedUsers[e.user.id] = user;
    console.log('User ' + e.user.username + ' connected to voice channel ' + e.channel.name + ' on server ' + e.channel.guild.name + '.');
  }

  removeConnectedUser(e) {
    const experience = this.calculateVoiceTime(e.user);
    this.addExperience(e.user, e.channel.guild, experience);
    delete this.connectedUsers[e.user.id];
    console.log('User ' + e.user.username + ' disconnected from voice channel ' + e.channel.name + ' on server ' + e.channel.guild.name + '.');
  }

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

  addExperience(user, server, experience) {
    this.db.users.update({id: user.id, 'servers.id': server.id}, {$inc: {'servers.$.experience': experience}} );
    this.db.users.update({id: user.id, 'servers.id': {$ne: server.id}}, { $setOnInsert: user, $inc: { experience: experience }, $push: {'servers': {id: server.id, 'experience': experience}} }, {upsert: true, new: true}, (err, res) => {
      console.log('Added ' + experience + ' experience to user ' + user.username + '.');
      console.log(user.username + ' has now a total experience of ' + res.experience + '.');
    });
  }

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
      callback(stream);
    });
  }

  calculateLevel(experience) {
    return Math.round(Math.sqrt(experience / 3 + 36) - 5);
  }

  calculateLevelProgress(experience) {
    const userLevel = this.calculateLevel(experience);
    const currentLevelMinExperience = this.minLevelExperience(userLevel);
    const nextLevelMinExperience = this.minLevelExperience(userLevel + 1);
    const currentLevelExperience = nextLevelMinExperience - currentLevelMinExperience;
    const userLevelExperience = experience - currentLevelMinExperience;
    return userLevelExperience * 100 / currentLevelExperience;
  }

  minLevelExperience(level) {
    return (3 * level * (level + 10) - 33);
  }

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

  createProfileHtml(filename, profileInformation) {
    const templateFile = fs.readFileSync('Profile/Profile.html').toString();
    const template = handlebars.compile(templateFile);
    const html = template(profileInformation);
    fs.writeFileSync(filename, html);
  }

  createProfileImageStream(filename) {
    return Screenshot(filename, '500x1000', {crop: true, selector: '.profile'});
  }

}

const kiritoInstance = new Kirito();
