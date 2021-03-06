const defaultHttps = require('https')

module.exports = LookerServiceApi

function tryJsonParse(str,dft){
	try{return JSON.parse(str)}
	catch(e){return dft}
	}

const noop = ()=>{}
const defaultConsole = {
	debug:noop,
	info:noop,
	log:noop,
	warn:console.warn.bind(console),
	error:console.error.bind(console)
	}

function LookerServiceApi({
		host,
		token,
		clientId,
		asyncClientSecret,
		apiVersion = "3.1",
		console = defaultConsole,
		https = defaultHttps
	}={}){
	const hostMatch = host && host.match(/^([^\/:]+)\:?(\d*)$/)
	if(!hostMatch){
		throw "API_HOST must specify a host"
		}
	const hostname = hostMatch[1]
	const port = parseInt(hostMatch[2] || "443")
	if(!hostname){throw "host required"}
	if(!token){
		if(!clientId){throw "token or clientId required"}
		if(!asyncClientSecret){throw "token or asyncClientSecret required"}
		}
	let auth = token ? {access_token:token} : {}
	
	return api
	
	async function api(endpointSpec,{
			query={},
			body,
			authStep,
			contentType = "application/json",
			stage = false
		}={}){
		const endpointMatch = endpointSpec.match(/^(GET|POST|PUT|PATCH|DELETE)? ?(.*)$/)
		const method = endpointMatch[1]||"GET"
		let fields
		const endpoint = endpointMatch[2].replace(/\.[^?#]+/, str=>{fields=str.slice(1); return ""})
		query = {fields,...query}
		const stagedRequest = {
			method,
			hostname,
			port,
			path: `/api/${apiVersion}/${endpoint}`,
			query,
			body,
			contentType
			}
		if(stage){return stagedRequest}
		
		const clientSecret = await asyncClientSecret
		if(!clientSecret){throw "clientSecret required"}
		if(authStep === 'force' || authStep!=='skip' && !isAuthValid(auth)){
			auth = await getNewAuth()
			}
		while(true){
			//console.debug("Request:",method,headers,endpoint,query,body)
			const headers = {
					...(isAuthValid(auth)?{'Authorization': 'token '+auth.accessToken}:{})
				}
			const response = await request({...stagedRequest,headers})
			//console.debug("Response:",response.statusCode, response.body)
			if(response && response.statusCode == 401 && authStep!="skip"){
				// Retry failure once, to catch auth expiration issues, if not 'skip' mode
				auth = await getNewAuth()
				authStep = "skip" //Don't retry more than once
				continue
				}
			if(!response || !response.statusCode || response.statusCode>=400){
				throw {
					status:response && response.statusCode,
					body:response && response.body
					}
				}
			return response.body
			}
		}
	
	function isAuthValid(auth){
		return auth && auth.accessToken && (auth.expiresAt||3000000000000) > Date.now()
		}
	async function getNewAuth(){
		const clientSecret = await asyncClientSecret
		const response = await api("POST login",{
			authStep: 'skip',
			contentType: "application/x-www-form-urlencoded",
			body: {
				client_id: clientId,
				client_secret: clientSecret
				}
			})
		if(!response.access_token){
			console.error()
			throw "API Authentication Error"
			}
		return {
			accessToken: response.access_token,
			expiresAt: Date.now()+1000*response.expires_in
			}
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
	}
