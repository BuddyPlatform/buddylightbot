"use strict";
let LifxClient = require("node-lifx").Client;
let Botkit = require("botkit");
let commands = require("./commands");
let lifx = new LifxClient();
lifx.init(); //start looking for lights
lifx.startDiscovery();
let controller = Botkit.slackbot({
	debug: true
});
let bot = controller.spawn({
	token: process.env.SLACK_TOKEN
});
//handle silent disconnects
//https://github.com/howdyai/botkit/issues/261
let startRtm = () => {
	bot.startRTM((err, bot, payload) => {
		if(err){
			return setTimeout(startRtm, 60000);
		}
		console.log("RTM Started");
	});
}
controller.on('rtm_close', (bot, err) => {
	startRtm();
});

let commandResults = commands.map((commandFn) => {
	return commandFn(lifx, controller);
});
startRtm();