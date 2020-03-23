const asyncPool = require("tiny-async-pool")
const userScript = require("./user-script.js")
const {performance } = require('perf_hooks')

module.exports = async function runner(req,res){
	const {userIds,host,adminToken,userConcurrency} = req && req.body	|| {}
	const start = performance.now()
	try {
		const users = await asyncPool(userConcurrency, users, await user => {
			const userStart = performance.now()
			const userReturn = userScript({user,adminToken,host,lookSequence,format})
			const userEnd = performance.now()
			return {...retval, userStart, userEnd}
			})
		const end = performance.now()
		const elapsed = (end - start)/1000
		res.json({
			ok: true,
			elapsed,
			start,
			end,
			users
			})
		}
	catch(e){
		const end = performance.now()
		res.json({
			ok: false,
			error: e.toString()
			start,
			end
			})
		}
	}