const fs = require('fs');
const Discord = require('discordie');
const handlebars = require('handlebars');
const Screenshot = require('screenshot-stream');
const mongojs = require('mongojs');


class Kirito {

  constructor() {
    this.Events = Discord.Events;
    this.ApiClient = new Discord();
    this.ApiClient.connect({
    	token: process.env.AUTH_TOKEN
    });
    this.db = mongojs('mongo/kirito', ['users']);
    this.connectedUsers = [];
    this.setGame = this.setGame.bind(this);
    this.handleUserConnectedToVoice = this.handleUserConnectedToVoice.bind(this);
    this.handleUserDisconnectedFromVoice = this.handleUserDisconnectedFromVoice.bind(this);
    this.handleChatCommand = this.handleChatCommand.bind(this);
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.ApiClient.Dispatcher.on(this.Events.GATEWAY_READY, this.setGame);
    this.ApiClient.Dispatcher.on(this.Events.VOICE_CHANNEL_JOIN, this.handleUserConnectedToVoice);
    this.ApiClient.Dispatcher.on(this.Events.VOICE_CHANNEL_LEAVE, this.handleUserDisconnectedFromVoice);
    this.ApiClient.Dispatcher.on(this.Events.MESSAGE_CREATE, this.handleChatCommand);
  }

  setGame(e) {
    this.ApiClient.User.setGame('together with Asuna');
  }

  handleUserConnectedToVoice(e) {
    const user = JSON.parse(JSON.stringify(e.user));
    user.timeConnected = Date.now();
    this.connectedUsers[e.user.id] = user;
    console.log("User " + e.user.username + " connected to voice channel " + e.channel.name + " on server " + e.channel.guild.name + ".");
  }

  handleUserDisconnectedFromVoice(e) {
    const onlineTime = this.calculateVoiceTime(e.user);
    delete this.connectedUsers[e.user.id];
    this.addExperience(e.user, e.channel.guild, onlineTime);
    console.log("User " + e.user.username + " disconnected from voice channel " + e.channel.name + " on server " + e.channel.guild.name + ".");
  }

  calculateVoiceTime(user) {
    const timeDisconnected = Date.now();
    const currentUser = this.connectedUsers[user.id];
    if (currentUser) {
      return Math.round((timeDisconnected - currentUser.timeConnected) / 60000);
    }
    else {
      console.log("User " + user.username + " not found in list of online users. 0 minutes online.");
      return 0;
    }
  }

  addExperience(user, server, experience) {
    const databaseUser = JSON.parse(JSON.stringify(user));
    this.db.users.update({id: databaseUser.id, "servers.id": server.id}, {$inc: {"servers.$.experience": experience}} );
    this.db.users.update({id: databaseUser.id, "servers.id": {$ne: server.id}}, { $setOnInsert: databaseUser, $inc: { experience: experience }, $push: {"servers": {id: server.id, "experience": experience}} }, {upsert: true}, (err, res) => {
      if (err) throw err;
      console.log("Added " + experience + " experience to user " + user.username + ".");
      console.log(user.username + " has now a total experience of " + res.experience + ".");

    });
  }

  handleChatCommand(e) {
    if (e.message.content == 'ping') {
      e.message.channel.sendMessage('pong');
    }
    else if (e.message.content == 'profile') {
      const profile = this.getProfile(e.message.author, (profile) => {
        e.message.channel.uploadFile(profile, 'profile.png');
      });
    }
  }

  getAdditionalServerData(servers) {
    let serverList = [];
    servers.map((currentServer) => {
      let server = this.ApiClient.Guilds.get(currentServer.id);
      const databaseServer = JSON.parse(JSON.stringify(server));
      databaseServer.experience = currentServer.experience;
      serverList.push(databaseServer);
    });
    serverList.sort((a, b) => {b.experience - a.experience});
    return serverList;
  }

  getProfile(user, callback) {
    console.log("Printing profile for user " + user.username + ".");
    const databaseUser = JSON.parse(JSON.stringify(user));
    databaseUser.experience = 0;
    this.db.users.findAndModify({query: {id: user.id}, update: { $setOnInsert: databaseUser }, upsert: true, new: true}, (err, result) => {
      const source = fs.readFileSync('Profile/Profile.html').toString();
      // Calculate current level
      const currentLevel = Math.round(Math.sqrt(result.experience / 3 + 36) - 5);
      // Calculate level progress
      const nextLevel = currentLevel + 1;
      const totalExperienceForCurrentLevel = 3 * currentLevel * (currentLevel + 10) - 33;
      const totalExperienceForNextLevel = 3 * nextLevel * (nextLevel + 10) - 33;
      const experienceForCurrentLevel = totalExperienceForNextLevel - totalExperienceForCurrentLevel;
      const experienceOfCurrentLevel = databaseUser.experience - totalExperienceForCurrentLevel;
      const currentLevelProgress = experienceOfCurrentLevel * 100 / experienceForCurrentLevel;

      const servers = this.getAdditionalServerData(result.servers);

      const context = {
        username: databaseUser.username,
        level: currentLevel,
        levelProgress: currentLevelProgress,
        avatar: user.staticAvatarURL,
        servers: servers
      };
      const template = handlebars.compile(source);
      const html = template(context);
      const filename = 'profiles/' + databaseUser.username + '.html';
      fs.writeFileSync(filename, html);
      const stream = Screenshot(filename, '500x1000', {crop: true, selector: '.profile'});
      callback(stream);
    });
  }

  countServers() {
    return this.ApiClient.Guilds.length;
  }

}

const kiritoInstance = new Kirito();
