const https = require('https')
const config = require('./config.js')

!async function(){
	const runners = []
	for(let r=0; r<runners; r++){
		const userIdsSubset = userIds.slice(r*config.usersPerRunner,(r+1)*config.usersPerRunner)
		if(!userIdsSubset.length){break}
		runners[r] = callRunner(userIdsSubset)
			.then(result => {console.log(`> Runner ${r} done`) return result})
		}
	console.log(`${r+1} runners initiated...`)
	const results = await Promise.all(runners)
	console.log(results)
	}()

function callRunner(userIds){
	return request({
		method: "POST",
		hotstname: "",
		path:"",
		body:{
			userIds,
			
			}
		})
	}
	
async function request({
		method,
		hostname,
		port,
		path,
		query = {},
		headers,
		body,
		contentType
	}){
	const bodyString = body && (
		contentType == "application/json" ? JSON.stringify(body)
		: contentType == "application/x-www-form-urlencoded" && body && !(body instanceof String)
			? Object.entries(body)
				.map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v))
				.join("&")
		: body
		)
		
	return await new Promise((res,rej)=>{
		let requestConfig = {
			method,
			hostname,
			...(port?{port}:{}),
			path: path
				+ (path.includes("?")?"&":"?")
				+ Object.entries(query).map(([k,v])=>encodeURIComponent(k)+"="+encodeURIComponent(v)).join("&")
				,
			headers:{
				...headers,
				...(method[0] == 'P' //POST, PUT, PATCH
					? {
						"Content-Type": contentType,
						"Content-Length": Buffer.byteLength(bodyString)
						}
					: {}
					)
				}
			}
		let req = https.request(requestConfig,
			resp=>{
				let data = '';
				resp.on('data', (chunk) => {data+=chunk;})
				resp.on("error", err => {rej(err)})
				resp.on("abort", err => {rej(err)})
				resp.on('end', () => {
					try{res({
						...resp,
						...(data?{body: tryJsonParse(data,data)}:{})
						})}
					catch(e){rej(e)}
					})
				}
			)
		req.on("error", err => {rej(err)})
		//Note: Cloud Functions seems to smartly interpret various body content types & convert to a unified representation
		// But, we don't need to reproduce all those original bodies, since looker only cares about JSON bodies
		if(body!==undefined){req.write(bodyString)}
		req.end()
		})
	}