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
}).startRTM();

let commandResults = commands.map((commandFn) => {
	return commandFn(lifx, controller);
});
