const Api = require("./lib/looker-service-api.js")
//const https = require("https")

module.exports = function userScript({user, adminToken, host}){
	//const agent = new https.Agent({})
	const adminApi = Api({host, token: adminToken})
	const userId = adminApi(`GET users/credential/embed/${user}.id`)
	const userToken = adminApi(`POST login/${userId}`)
	const api = Api({host, token:userToken})
	
	await Promise.all([
		
		])
	
	}
