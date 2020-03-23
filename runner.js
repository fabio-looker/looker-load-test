const asyncPool = require("tiny-async-pool")
const userScript = require("./user-script.js")

module.exports = async function(req,res){
	const {users,host,adminToken,userConcurrency} = req.body	
	try {
		await asyncPool(userConcurrency, users, user=>userScript({user,adminToken}))
		res.json({
			ok: true,
			})
		}
	catch(e){
		res.json({
			ok: false,
			error: e.toString()
			})
		}
	}