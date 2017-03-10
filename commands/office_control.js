"use strict";
let Promise = require("bluebird");
let util = require("util");
let breathe = require("./breather.js");
let constants = require('./constants');
let nextBreath = null;
let mentionTrackers = {};
const hue = constants.hue
const saturation = constants.saturation
const brightness = constants.brightness
const duration = constants.duration
let temperature = constants.temperature
let hustle = false;
module.exports = (lifx, controller) => {
	let changePattern = /(hustle|turn|change|blink|breathe)(.*)(lights|light)/
	controller.hears("^(what|show).*lights",['direct_message','direct_mention','mention','message_received'], (bot, message) => {
		let lights = lifx.lights('on');
		
		let labelPromises = lights.map((l) => lightLabel(l));
		Promise.all(labelPromises).then((labels) => {				
			bot.reply(message, util.format("These are the lights I can see:\n %s", labels.map((l) => l.label).join("\n") + "\n"));
		});
	});
	// change lights
	controller.hears("^(do the hustle).*(lights|light)", ['direct_message','direct_mention','mention', 'message_received'], (bot, message) => {
		hustle = true;
		bot.reply(message, ":champagne: :cocktail: :tada:")
		matchLights(message).then((matched) => disco(matched));
	})

	controller.hears("^(turn|change|blink).*(lights|light)", ['direct_message','direct_mention','mention', 'message_received'], (bot, message) => {
		let k = matchKelvin(message);
		let hue = matchHue(message);
		let brightness = k > 8999 ? 100 : matchBright(message);
		let sat = k == 3500 ? matchSat(message): 0;
		let dur = matchDuration(message);
		hustle = false;


		console.log("Hue: ", hue);
		console.log("Sat: ", sat);
		console.log("Brightness: ", brightness);
		console.log("Duration: ", dur);
		console.log("Temp: ", k);
		matchLights(message)
		.then((matched) => {
			let formattedMatches = matched.map((l) => l.label).join("\n") + "\n";
			if(message.match[1] == 'turn' || message.match[1] == 'change'){
				bot.reply(message, util.format("Changing these lights\n %s", formattedMatches));
				changeLights(matched,k,hue,brightness,sat, dur);
			}
			if(message.match[1] == 'blink'){
				return blinkLights(matched, k, hue, brightness, sat, dur, 1000, 12);
			}
			
		}).catch((e) => {
			bot.reply(message, util.format("uh. %s", e));
		})
	});
	controller.hears("help", ['direct_message','direct_mention','mention','message_received'], (bot, message)=>{
		bot.startConversation(message,(e,convo) => {
			convo.say(util.format("I understand the following colors: \n%s", Object.keys(hue).join("\n")));
			convo.say(util.format("I also understand these saturations: \n%s", Object.keys(saturation).join("\n")));
			convo.say(util.format("And these brightness levels: %s", Object.keys(brightness).join(", ")));
			convo.say("You can also specify time intervals like \"over 10 minutes\" or \"over 1 hour\" ");
			convo.say("I can listen for mentions also; e.g. \"when I'm mentioned change lounge lights green\"");

		})
	});
	controller.hears("(mention)*(turn|change|blink)(.*)(light|lights)", 
	['direct_message','direct_mention','mention','message_received'], (bot,message) => {
		let [
			k,
			hue,
			brightness,
			sat,
			dur
		] = extractHSBKD(message);

		console.log("Hue: ", hue);
		console.log("Sat: ", sat);
		console.log("Brightness: ", brightness);
		console.log("Duration: ", dur);
		console.log("Temp: ", k);
		matchLights(message)
		.then((matched) => {
			mentionTrackers[message.user] = {matched: matched, action: message.match[2], color: {k: k, hue: hue, brightness: brightness, dur: dur, sat: sat}};
		})
		.catch(e => {
			bot.reply(message,util.format("Oops. %s", e));
		});
		
	});
	controller.hears("^(breathe)", ['direct_message'], (bot, message) => {
		bot.reply(message, "Breathe test");
		matchLights(message).then((lights) => {
			Promise.all(lights.map((l) => lightState(l.light).then((state) => {
				return {
					state: state,
					light: l.light,
					label: l.label
				};
			}))).then((lightsWithState) => {
				breathe(0.1,0,100, 5, (t, b, next) => {
					lightsWithState.forEach((light) => {				
						nextBreath = next
						light.light.color(light.state.hue, light.state.saturation, b, light.state.kelvin, 200);
					});
				});
			});
			
		})
		
	});
	controller.hears("stop", ['direct_message'], (bot,message) => {
		bot.reply(message, "okay");
		clearTimeout(nextBreath);
	});
	
	controller.on('ambient', (bot, message) => {
		Object.keys(mentionTrackers).forEach(function(mention) {
			if(message.text.indexOf(mention) > -1){
				let mentionCondition = mentionTrackers[mention];
				if(mentionCondition.action == 'change' || mentionCondition.action == 'turn'){
					changeLights(mentionCondition.matched,
						mentionCondition.color.k,
						mentionCondition.color.hue,
						mentionCondition.color.sat,
						mentionCondition.color.brightness,
						mentionCondition.color.dur);
					bot.reply(message, util.format("I heard <@%s> changing these lights: \n%s",
						mention, 
						mentionCondition.matched.map(m => m.label).join("\n")));
				} else if (mentionCondition.action == 'blink'){
					blinkLights(mentionCondition.matched,
						mentionCondition.color.k,
						mentionCondition.color.hue,
						mentionCondition.color.sat,
						mentionCondition.color.brightness,
						mentionCondition.color.dur,
						1000,
						10);
					bot.reply(message, util.format("Someone mentioned <@%s>, blinking.", mention));
				}
		
			}
		});
	});

	let changeLights = (matched, k, hue, brightness, sat, dur) => {
		matched.forEach((l) => l.light.color(hue, sat, brightness, k, dur));
	};

	let blinkLights = (matched, k, hue, brightness, sat, dur, blink, times) => {
		if(times < 1){
			return Promise.resolve(true);
		}
		return Promise.all(matched.map(l => {
			return lightState(l.light).then((state) => {
				return {
					light: l.light,
					state: state,
					label: l.label
				};
			});
		})).then((lightStates) => {
			let nextLights = lightStates.forEach((light) => {
				light.light.color(hue, sat, brightness, k, dur);
				setTimeout(blinkLights.bind(null,
					[light],
					light.state.kelvin,
					light.state.hue, 
					light.state.brightness,
					light.state.saturation,
					dur,
					blink,
					times - 1), blink);
			});
		});
	};

	let lightState = (light) => {
		return new Promise((resolve, reject) => {
			light.getState((e, state) => {
				if(e){
					reject(e);
				} else {
					resolve(state.color);
				}
			});
		});
	};

	let extractHSBKD = (message) => {
		let k = matchKelvin(message);
		return [
			k,
			matchHue(message),
			k > 8999 ? 100 : matchBright(message),
			k == 3500 ? matchSat(message): 0,
			matchDuration(message)
		];
	}
	let matchMapKey = (map, message, seed) => {
		return Object.keys(map).reduce((lastValue, key) => {
			return message.text.indexOf(key) > -1 ? 
				map[key] : lastValue
		},seed)
	}
	let matchHue = (message) => matchMapKey(hue, message, 50);
	let matchSat = (message) => matchMapKey(saturation, message, 50);
	let matchBright = (message) => matchMapKey(brightness, message, 50);
	let matchKelvin = (message) => matchMapKey(temperature, message, 3500);
	
	let matchDuration = (message) => {
		return 1000 * duration.reduce((total, patternTuple) => {
			let match = message.text.match(patternTuple[0]);
			if(match){
				return total + parseInt(match[1], 10) * patternTuple[1];
			}
			return total;
		},0);
	};
	let matchLights = (message) => {
		let lights = message.text.match(changePattern);
		if(lights != null && lights.length > 1) {
			let toChange = lights[2].trim();
			return Promise.all(lifx.lights('on').map((l) => lightLabel(l)))
			.then(labels => labels.filter((l) => toChange == 'all' ||
				 l.label.toLowerCase().indexOf(toChange.toLowerCase()) > -1));
		}
		return Promise.reject(new Error("cant match"));
	}

	let disco = (matched) => {
		if(!hustle) return;
		let colors = Object.keys(constants.hue);
		let choice = Math.floor(Math.random() * colors.length)
		let colorchoice = constants.hue[colors[choice]];
		matched.forEach((lp) => {
			lp.light.color(colorchoice, constants.saturation['hot'],
				constants.brightness['bright'],constants.temperature['eye burning white'], 400);	
		})
		setTimeout(disco.bind(null, matched), 400)
	}

	let lightLabel = (light) => {
		return new Promise((resolve, reject) => {
			light.getLabel((e,label) => {
				if(e){
					reject(e);
				} else {
					resolve({
						light: light,
						label: label
					});
				}
			}, true);
		});
	}
}