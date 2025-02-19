const db = require('../db')
const { sendMessage } = require('./manage')
const cron = require('node-cron');
const fetch = require('node-fetch');
const dbKey = "github-release"
cron.schedule('1,31 * * * *', () => {
	sendData()
});
function releaseId(repo, value) {
	let releaseIdList = db.get(dbKey) || {}
	if (value) {
		releaseIdList[repo] = value
		db.set(dbKey, releaseIdList)
	}
	return releaseIdList[repo]
}
async function checkRepo(repo) {
	return (await fetch(`https://api.github.com/repos/${repo}/releases`).then(res => res.json()))
}
async function sendData() {
	// 取得 Repo List
	let repoSubscribeList = db.get('subscribe.github-release') || {}
	let repoList = Object.keys(repoSubscribeList)
	// 檢查更新
	for (repo of repoList) {
		let localReleaseId = releaseId(repo)
		let repoReleases = await checkRepo(repo)
		if (repoReleases.message == 'Not Found' || !repoReleases.length) {
			let resp = ''
			resp += `找不到 <b>${repo}</b>，或是該 Repo 無任何 Release，已自動取消訂閱\n`
			sendMessage({
				chats: repoSubscribeList[repo],
				message: resp,
				key: 'github-release',
				value: repo
			})
			function unsubscribe(value) {
				let subscribe_list = repoSubscribeList
				delete subscribe_list[value]
				db.set('subscribe.github-release', subscribe_list);
			}
			unsubscribe(repo)
		} else if (!repoReleases.message) {
			let latestRelease = repoReleases[0]
			if (!localReleaseId || latestRelease.id > localReleaseId && latestRelease.id) {
				releaseId(repo, latestRelease.id)
				// 發訊息
				let resp = ''
				resp += `<b>${repo}</b> 已發布 <b>${latestRelease.name}</b>\n`
				resp += `<b>更新日誌</b>：\n${latestRelease.body}`
				resp += `\n<b>連結</b>：<a href="${latestRelease.html_url}">GitHub</a>`
				sendMessage({
					chats: Object.keys(repoSubscribeList[repo]),
					message: resp,
					key: 'github-release',
					value: repo
				})
			}
		}
	}
}