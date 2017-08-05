const fs = require('fs');
const Discord = require('discordie');
const handlebars = require('handlebars');
const Screenshot = require('screenshot-stream');
const MongoClient = require('mongodb').MongoClient;
const databaseUrl = "mongodb://localhost:27017/test";

class Kirito {

  constructor() {
    this.Events = Discord.Events;
    this.ApiClient = new Discord();
    this.ApiClient.connect({
    	token: "MzQwNDE5MjU4MDQ1NTYyODgy.DFyPtw.T-i9DfVm2-bbcZ3Nc6E1kJ-DLqY"
    });
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
    this.addExperience(e.user, onlineTime);
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

  addExperience(currentUser, experience) {
    MongoClient.connect(databaseUrl, (err, db) => {
      if (err) throw err;
      db.collection("users").findOne({id: currentUser.id}, (err, result) => {
        if (err) throw err;
        let user = {};
        if (!result) {
          user = JSON.parse(JSON.stringify(currentUser));
          user.experience = 0;
          db.collection("users").insertOne(user, (err, res) => {
            if (err) throw err;
            console.log("Added user " + user.username + " to databse.");
          });
        }
        else {
          user = result;
          console.log("Found user: " + user.username + " in database.");
        }
        user.experience += experience;
        db.collection("users").updateOne({id: user.id}, user, function(err, res) {
          if (err) throw err;
          console.log("Added " + experience + " experience to user " + user.username + ".");
          console.log(user.username + " has now a total experience of " + user.experience + ".");
        });
        db.close();
      });
    });
  }

  watchUsers() {
    setInterval( () => {
      console.log('Currently connected users:')
      this.getCurrentlyConnectedUsers().map( (user) => {
        console.log('- ' + user.name);
        // TODO: Add online time to user profile
      });
      console.log('')
    }, 5000);
  }

  getCurrentlyConnectedUsers() {
    let Users = [];
    this.ApiClient.Guilds.map( (guild) => {
      this.ApiClient.Channels.voiceForGuild(guild).map( (voiceChannel) => {
        voiceChannel.members.map( (member) => {
          Users.push(member);
        });
      });
    });
    return Users;
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

  getProfile(author, cb) {
    MongoClient.connect(databaseUrl, (err, db) => {
      if (err) throw err;
      db.collection("users").findOne({id: author.id}, (err, result) => {
        if (err) throw err;
        let user = {};
        if (!result) {
          user = JSON.parse(JSON.stringify(author));
          user.experience = 0;
          db.collection("users").insertOne(user, (err, res) => {
            if (err) throw err;
            console.log("Added user to databse!");
          });
        }
        else {
          user = result;
          console.log("Found user: " + result.username);
        }
        db.close();
        const source = fs.readFileSync('Profile/Profile.html').toString();
        // Calculate current level
        const currentLevel = Math.round(Math.sqrt(user.experience / 3 + 36) - 5);
        // Calculate level progress
        const nextLevel = currentLevel + 1;
        const totalExperienceForCurrentLevel = 3 * currentLevel * (currentLevel + 10) - 33;
        const totalExperienceForNextLevel = 3 * nextLevel * (nextLevel + 10) - 33;
        const experienceForCurrentLevel = totalExperienceForNextLevel - totalExperienceForCurrentLevel;
        const experienceOfCurrentLevel = user.experience - totalExperienceForCurrentLevel;
        const currentLevelProgress = experienceOfCurrentLevel * 100 / experienceForCurrentLevel;

        const context = {
          username: user.username,
          level: currentLevel,
          levelProgress: currentLevelProgress,
          avatar: author.staticAvatarURL,
          achievements: [
            {
              icon: "11",
              title: "The One Award",
              description: "Highest rank ever reachable"
            },
            {
              icon: "14",
              title: "Skill Level? Over 9000!",
              description: "You asked for it XP"
            },
            {
              icon: "27",
              title: "Ridiculouosly Overpowered",
              description: "Title sais everything"
            }
          ]
        };
        const template = handlebars.compile(source);
        const html = template(context);
        fs.writeFileSync('profiles/Notoxus.html', html);
        const stream = Screenshot('profiles/Notoxus.html', '500x1000', {crop: true, selector: '.profile'});
        cb(stream);
      });
    });
  }

  countServers() {
    return this.ApiClient.Guilds.length;
  }

}

const kiritoInstance = new Kirito();
