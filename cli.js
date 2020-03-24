const https = require('https')
const fs = require('fs')
const configs = require('./config.js')

!async function(){
	const reports = []
	for (let config of configs){
		reports.push(await test(config))
		}
	const reportTimestamp = (new Date()).toISOString()
	fs.writeFileSync(`reports/${reportTimestamp}.json`,JSON.stringify(reports,undefined,4))
	}()

async function test(config){
	try{
		const testBegin = (new Date()).toISOString()
		const {adminSecret, userIds, ...loggableConfig} = config
		const runners = []
		for(let r=0; r<config.runners; r++){
			const userIdsSubset = config.userIds.slice(r*config.usersPerRunner,(r+1)*config.usersPerRunner)
			if(!userIdsSubset.length){break}
			runners[r] = callRunner(userIdsSubset,config)
				.then(result => {console.log(`> Runner ${r} done`); return result.body})
			}
		console.log(`${runners.length} runners initiated...`)
		const results = await Promise.all(runners)
		const testEnd = (new Date()).toISOString()
		const report = {
			testBegin,
			testEnd,
			loggableConfig,
			results
			}
		console.log(report)
		return report
		}
	catch(e){console.error(e)}
	}

async function callRunner(userIds,config){
	return await request({
		method: "POST",
		hostname: config.runnerHost,
		path: config.runnerPath,
		contentType: "application/json",
		body:{
			userIds,
			host: config.lookerHost,
			adminId: config.adminId,
			adminSecret: config.adminSecret,
			userConcurrency: config.userConcurrencyPerRunner,
			lookSequence: config.lookSequence,
			format: config.format
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
	})
	{
	const bodyString = 
		contentType == "application/json"
			? JSON.stringify(body||{})
			:
		contentType == "application/x-www-form-urlencoded" && body && !(body instanceof String)
			? Object.entries(body)
				.map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v))
				.join("&")
			:
		body || ""
		
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
function tryJsonParse(str,dft){
	try{return JSON.parse(str)}
	catch(e){return dft}
	}