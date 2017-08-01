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
      const profile = this.getProfile(e.message.author);
      e.message.channel.uploadFile(profile, 'profile.png');
    }
  }

  getProfile(user) {
    // TODO: LOAD Level Information from database
    const source = fs.readFileSync('Profile/Profile.html').toString();
    const context = {
      username: user.username,
      level: "13",
      levelProgress: "1%",
      avatar: user.staticAvatarURL,
      achievements: [
        {
          icon: "11",
          title: "Creator of Kirito",
          description: "Highest rank ever reachable"
        },
        {
          icon: "14",
          title: "Level? Over 9000!",
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
    return stream;
  }

  countServers() {
    return this.ApiClient.Guilds.length;
  }

}

const kiritoInstance = new Kirito();
