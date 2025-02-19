const Composer = require('telegraf/composer')
const telegram = require('../telegram')
const inlineProcessorList = require('../../list').inlineProcessorList
const bot = new Composer()
bot.on('inline_query', async ({ inlineQuery, answerInlineQuery }) => {
    let text = inlineQuery.query.split(' ')
    try {

        if (text.length > 1) {
            for (let inlineProcessor of inlineProcessorList) {
                if (inlineProcessor.keywords.includes(text[0])) {
                    return require(inlineProcessor.js)({ inlineQuery, answerInlineQuery })
                }
            }
        }
        if (text[0]?.startsWith('http')) {
            return require('./url')({ inlineQuery, answerInlineQuery })
        }
    } catch (e) {
        console.log(e)
        return answerInlineQuery([], { switch_pm_text: `❌ 出錯了，請稍後再試`, switch_pm_parameter: 'inline_error' })
    }
    // send help message
    let { first_name } = await telegram.getMe()
    return answerInlineQuery([], {
        cache_time: 60 * 60, /* second */
        switch_pm_text: `📘 查看「${first_name}」行內機器人使用說明`,
        switch_pm_parameter: 'inline_help'
    })
})

module.exports = bot