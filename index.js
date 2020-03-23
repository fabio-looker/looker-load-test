
exports.httpHandler = async function httpHandler(req,res) 
	try{
		switch(req.path){
			case "": case "/": return await ui(req,res)
			case "/leader": return await leader(req,res)
			case "/runner": return await runner(req,res)
			}
		}
	catch(err){
		console.error(err)
		res
			.status( err && err.status || 500 )
			.json({
				status: err && err.status || 500,
				looker:{
					success: false,
					message: err && err.message || "Unknown error. See ActionHub/GCF logs for more details."
					}
				})
		}
	}