module.exports.hue = {
	"red": 360,
	"orange": 26,
	"yellow": 54,
	"green": 95,
	"teal": 156,
	"aqua": 172,
	"blue": 199,
	"navy": 231,
	"indigo": 261,
	"purple": 176,
	"violet": 302,
	"pink": 330
};

module.exports.saturation = {
	"cold":10,
	"cool": 30,
	"warm": 50,
	"hot": 100
};

module.exports.brightness = {
	"dim": 50,
	"dimmer": 20,
	"bright": 100
};

module.exports.duration = [
	[/([\d]+)[\s*]*second/, 1],
	[/([\d]+)[\s*]*minute/, 60],
	[/([\d]+)[\s*].*hour/, 3600]
];

module.exports.temperature = {
	"incandescent white" : 2000,
	"warm white": 2500,
	"neutral white": 3000,
	"studio white": 8000,
	"eye burning white": 9000
};