const fs = require('fs');
const Discord = require('discordie');
const handlebars = require('handlebars');
const Screenshot = require('screenshot-stream');

class Kirito {

  constructor() {
    this.Events = Discord.Events;
    this.ApiClient = new Discord();
    this.ApiClient.connect({
    	token: "MzQwNDE5MjU4MDQ1NTYyODgy.DFyPtw.T-i9DfVm2-bbcZ3Nc6E1kJ-DLqY"
    });
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.ApiClient.Dispatcher.on(this.Events.GATEWAY_READY, (e) => {
      this.setGame();
      this.watchUsers();
    });
    this.ApiClient.Dispatcher.on(this.Events.MESSAGE_CREATE, (e) => {
    	this.handleChatCommand(e);
    });
  }

  setGame() {
    this.ApiClient.User.setGame('together with Asuna');
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
      e.message.channel.uploadFile(profile, 'profile.png');
      const profile = this.getProfile(e.message.author, (profile) => {
      });
    }
  }

    const source = fs.readFileSync('Profile/Profile.html').toString();
    const context = {
      username: user.username,
      achievements: [
        {
          icon: "11",
          description: "Highest rank ever reachable"
        },
        {
          icon: "14",
          description: "You asked for it XP"
        },
        {
          icon: "27",
          title: "Ridiculouosly Overpowered",
          description: "Title sais everything"
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
      ]
    };
    const template = handlebars.compile(source);
    const html = template(context);
    fs.writeFileSync('profiles/Notoxus.html', html);
    const stream = Screenshot('profiles/Notoxus.html', '500x1000', {crop: true, selector: '.profile'});
    return stream;
        db.close();
        // Calculate current level
        const currentLevel = Math.round(Math.sqrt(user.experience / 3 + 36) - 5);
        // Calculate level progress
        const nextLevel = currentLevel + 1;
        const totalExperienceForCurrentLevel = 3 * currentLevel * (currentLevel + 10) - 33;
        const totalExperienceForNextLevel = 3 * nextLevel * (nextLevel + 10) - 33;
        const experienceForCurrentLevel = totalExperienceForNextLevel - totalExperienceForCurrentLevel;
        const experienceOfCurrentLevel = user.experience - totalExperienceForCurrentLevel;
        const currentLevelProgress = experienceOfCurrentLevel * 100 / experienceForCurrentLevel;

          level: currentLevel,
          levelProgress: currentLevelProgress,
          avatar: author.staticAvatarURL,
              title: "The One Award",
              title: "Skill Level? Over 9000!",
  }

  countServers() {
    return this.ApiClient.Guilds.length;
  }

}

const kiritoInstance = new Kirito();
