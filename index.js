const Discord = require('discordie');

const Events = Discord.Events;
const ApiClient = new Discord();

ApiClient.connect({
	token: "MzQwNDE5MjU4MDQ1NTYyODgy.DFyPtw.T-i9DfVm2-bbcZ3Nc6E1kJ-DLqY"
});

ApiClient.Dispatcher.on(Events.GATEWAY_READY, (e) => {
	console.log('Connecting as ' + ApiClient.User.username);
	ApiClient.User.setGame('together with Asuna');
	ApiClient.Guilds.map((guild) => {
		console.log('Currently connected to ' + guild.name);
	});

});

ApiClient.Dispatcher.on(Events.MESSAGE_CREATE, (e) => {
	if (e.message.content == 'ping') {
		e.message.channel.sendMessage('pong');
	}
});