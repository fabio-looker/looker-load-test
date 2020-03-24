module.exports = [{
	runnerHost: "",
	lookerHost: "",
	adminToken: "",
	runners,
	usersPerRunner: 25,
	userConcurrencyPerRunner: 5,
	userIds: fs.readFileSync(path.join(__dirname,'./sandbox.user_ids.txt'),'utf-8').trim().split("\n"),
	lookSequence: [2115],
	format:""
}]