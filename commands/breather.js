"use strict";
let breathe = (lambda,t,interval,times,fn) => {
	lambda = lambda || 2;
	var b = (Math.exp(Math.sin(t * (Math.PI/2))) - 0.36787) * 42.54590;
	if(t > 1 && (t|0)%9 == 0){
		times = times - 1
	}
	if(times > 0){
		let next = setTimeout(breathe.bind(null, lambda,(t+(interval * 0.8) / 1000),interval,times,fn),interval);
		fn(t,b,next);
	}
	
}

module.exports = breathe;