let util = require('util')
let Promise = require('bluebird')
let request = require('request')
module.exports = (sonosHost, room) => {
	return {
		party: () => {
			return new Promise((resolve, reject) => {
				request.get(util.format('%s/%s/shuffle/on', sonosHost, room), (e, response) => {
					if(e){
						reject(e);
					} else {
						request.get(util.format('%s/%s/playlist/party button', sonosHost, room), (e, response) => {
							if(e){
								reject(e)
							} else {
								resolve(response)
							}
						})
					}
				})	
			})
		},
		business: () => {
			return new Promise((resolve, reject) => {
				request.get(util.format('%s/%s/pause', sonosHost, room), (e, response) => {
					if(e){ 
						reject(e)
					} else {
						resolve(response)
					}
				})
			})
			
		}
	}	
}