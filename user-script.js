const Api = require("./lib/looker-service-api.js")
//const https = require("https")

module.exports = async function userScript({
		userId, adminToken, host,
		lookSequence = [],
		format = "json"
	}){
	//const agent = new https.Agent({})
	const adminApi = Api({host, token: adminToken})
	//const userId = await adminApi(`users/credential/embed/${user}.id`)
	const userAuth = awaitadminApi(`POST login/${userId}`)
	const api = Api({host, token:userAuth.access_token})
	for(look of lookSequence){
		await api(`looks/${look}/run/${format}`)
		}
	}
