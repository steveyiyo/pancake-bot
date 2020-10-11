const db = require('../db')
const Composer = require('telegraf/composer')
const telegram = require('../telegram')
const fetch = require('node-fetch');
const bot = new Composer()
const subscribeIdList = require('../../list').subscribeIdList

require('./bahamut-anime')
require('./github-release')
bot.command('admin', async ctx => {
    return ctx.reply(`尼${await isAdmin(ctx) ? '是' : '不是'}管理員`, { reply_to_message_id: ctx.message.message_id });
});

async function isAdmin(ctx) {
    if (ctx.chat.type == 'group' || ctx.chat.type == 'supergroup') {
        let adminList = await telegram.getChatAdministrators(ctx.chat.id)
        return adminList.some(adm => adm.user.id === ctx.from.id);
    }
    else {
        return true
    }
}

function subscribe(key, value, id) {
    key = 'subscribe.' + key
    let subscribe_list = db.get(key) || {}
    if (value) {
        if (!subscribe_list[value]) subscribe_list[value] = {}
        subscribe_list[value][id] = true
    } else {
        subscribe_list[id] = value || true
    }
    db.set(key, subscribe_list);
}
function unsubscribe(key, value, id) {
    key = 'subscribe.' + key
    let subscribe_list = db.get(key) || {}
    if (value) {
        if (!subscribe_list[value]) subscribe_list[value] = {}
        delete subscribe_list[value][id]
        if (!subscribe_list[value].length)
            delete subscribe_list[value]
    } else {
        delete subscribe_list[id]
    }
    db.set(key, subscribe_list);
}

bot.command('subscribe', async ctx => {
    if (await isAdmin(ctx)) {
        let args = ctx.state.command.splitArgs
        let chatId = ctx.message.chat.id
        if (args[0] !== '') {
            for (id in subscribeIdList) {
                if (args[0] == id) {
                    ctx.replyWithSticker('https://data.gnehs.net/stickers/ohohoh.webp', {
                        reply_to_message_id: ctx.message.message_id
                    })
                    telegram.sendChatAction(ctx.chat.id, "typing");
                    // GitHub 檢查有沒有這個 Repo
                    if (id === 'github-release') {
                        let testFetch = await fetch(`https://api.github.com/repos/${args[1]}/releases`).then(res => res.json())
                        if (testFetch.message)
                            return ctx.replyWithMarkdown(`❌ 無法訂閱「${subscribeIdList[id]}」，請確定 Repo 名稱是否正確。\n錯誤訊息：\`${testFetch.message}\``, { reply_to_message_id: ctx.message.message_id })
                    }
                    subscribe(id, args[1] || null, chatId)
                    ctx.replyWithMarkdown(`🎉 已訂閱「${subscribeIdList[id]}」，使用 \`/unsubscribe ${id}${args[1] ? ' ' + args[1] : ''}\` 來取消訂閱。`, { reply_to_message_id: ctx.message.message_id })
                }
            }
        } else {
            ctx.reply(`❌ 請在後面加上訂閱編號`, { reply_to_message_id: ctx.message.message_id })
        }
    } else {
        ctx.reply(`❌ 只有管理員能使用此指令`, { reply_to_message_id: ctx.message.message_id })
    }
})
bot.command('unsubscribe', async ctx => {
    if (await isAdmin(ctx)) {
        let args = ctx.state.command.splitArgs
        let chatId = ctx.message.chat.id
        if (args[0] !== '') {
            for (id in subscribeIdList) {
                if (args[0] == id) {
                    ctx.replyWithSticker('https://data.gnehs.net/stickers/bye.webp', { reply_to_message_id: ctx.message.message_id })
                    telegram.sendChatAction(ctx.chat.id, "typing");
                    unsubscribe(id, args[1] || null, chatId)
                    ctx.replyWithMarkdown(`👋 取消訂閱「${subscribeIdList[id]}」成功。`, { reply_to_message_id: ctx.message.message_id })
                }
            }
        } else {
            ctx.reply(`❌ 請在後面加上訂閱編號`, { reply_to_message_id: ctx.message.message_id })
        }
    } else {
        ctx.reply(`❌ 只有管理員能使用此指令`, { reply_to_message_id: ctx.message.message_id })
    }
})
module.exports = bot