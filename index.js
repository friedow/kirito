const Discord = require('discordie');

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
        // DATABASE request user;
        // IF user:
          // user.level += 5000;
        // ELSE:
          // user.level = 5000;
        // DATABASE write user;
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
      const profile = this.getProfile(e.message.user);
      e.message.channel.sendMessage(profile);
    }
  }

  getProfile(user) {

    return 'test';
  }

  countServers() {
    return this.ApiClient.Guilds.length;
  }

}

const kiritoInstance = new Kirito();
