const Command = require("../structures/Command")
const { MessageEmbed } = require("discord.js")
const stringSimilarity = require("string-similarity")

const { MessageButton } = require("discord-buttons")

module.exports = class Info extends Command {
    constructor(client) {
        super(client, {
            name: "info",
            desc: (i18n) => i18n.__("discord.info.desc"),
            directory: __dirname,
            use: (i18n) => i18n.__("discord.info.use"),
            example: (i18n) => i18n.__("discord.info.example"),
            aliases: ["list"]
        })
    }

    async run({ client, message, args, i18n, data, userData, util }) {

        const financeData = client.config.financeData
        const dataPrices = client.data.prices

        const cryptoList = financeData.filter(config => config.type === "crypto")
        const actionList = financeData.filter(config => config.type === "action")

        if (!args[0]) {
            let desc = ""
            let i = 0

            for (const type of dataPrices.keys()) {
                desc += `${i > 0 ? "\n\n": ""}__${i18n.__(`discord.info.${type}`)}__\n`
                const typeIds = client.data.prices.get(type)

                i++
                for (const typeId in typeIds) {
                    const typeData = typeIds[typeId]
                    const typeConfig = financeData.find(config => config.id === typeId)

                    if (!typeConfig || !typeData) continue

                    desc += `${typeConfig.name} (${typeData.symbol}) • ${typeData.prices[0].price}$ ${typeData.prices[0].price > typeData.prices[1]?.price ? "↑" : "↓"}\n`
                }
            }
            
            if (!desc || desc.length <= 0) desc += "Data error, no data found"

            const embed = new MessageEmbed()
                .setTitle(i18n.__("discord.info.title_no_args"))
                .setDescription(desc)
                .setColor(client.config.colors.yellow)

            const goToCrypto = new MessageButton()
                .setLabel("Allez vers : cryptos")
                .setStyle("blurple")
                .setID("info_goto_crypto")
            
            const goToAction = new MessageButton()
                .setLabel("Allez vers : actions")
                .setStyle("blurple")
                .setID("info_goto_action")

            await message.lineReplyNoMention({
                buttons: [ goToCrypto, goToAction ],
                embed: embed
            })
        } else {
            let isType = args[0] === "action" || args[0] === "crypto"

            let isCrypto, isAction
            if (!isType) {
                isCrypto = cryptoList.find(info => info.id.toLowerCase() === args[0].toLowerCase() || info.symbol.toLowerCase() === args[0].toLowerCase())

                isAction = actionList.find(info => info.id.toLowerCase() === args[0].toLowerCase() || info.symbol.toLowerCase() === args[0].toLowerCase())
            }

            if (!isType && !isCrypto && !isAction) {
                const prop = [
                    "action",
                    "crypto",
                    ...cryptoList.map(e => e.id.toLowerCase()),
                    ...cryptoList.map(e => e.symbol.toLowerCase()),
                    ...actionList.map(e => e.id.toLowerCase()),
                    ...actionList.map(e => e.symbol.toLowerCase())
                ]

                const findBestMatch = stringSimilarity.findBestMatch(args[0].toLowerCase(), prop)

                if (!findBestMatch.bestMatch || !findBestMatch.bestMatch.target || findBestMatch.bestMatch.rating <= 0) return message.lineReplyNoMention(i18n.__("discord.info.args_not_found", { arg: args[0] }))

                const bestMatchName = findBestMatch.bestMatch.target

                let bestMatch
                if (bestMatchName === "action" || bestMatchName === "crypto") {
                    bestMatch = { name: bestMatchName, type: "type", findBy: "name", data: null }
                /* Crypto by id */
                } else if (cryptoList.find(info => info.id.toLowerCase() === bestMatchName.toLowerCase())) {
                    bestMatch = { name: bestMatchName, type: "crypto", findBy: "id", data: cryptoList.find(info => info.id.toLowerCase() === bestMatchName.toLowerCase()) }
                /* Crypto by symbol */
                } else if (cryptoList.find(info => info.symbol.toLowerCase() === bestMatchName.toLowerCase())) {
                    bestMatch = { name: bestMatchName, type: "crypto", findBy: "symbol", data: cryptoList.find(info => info.symbol.toLowerCase() === bestMatchName.toLowerCase()) }
                /* Action by id */
                } else if (actionList.find(info => info.id.toLowerCase() === bestMatchName.toLowerCase())) {
                    bestMatch = { name: bestMatchName, type: "action", findBy: "id", data: actionList.find(info => info.id.toLowerCase() === bestMatchName.toLowerCase()) }
                /* Action by name */
                } else if (actionList.find(info => info.symbol.toLowerCase() === bestMatchName.toLowerCase())) {
                    bestMatch = { name: bestMatchName, type: "action", findBy: "symbol", data: actionList.find(info => info.symbol.toLowerCase() === bestMatchName.toLowerCase()) }
                }
                
                if (!bestMatch) return message.lineReplyNoMention(i18n.__("discord.info.args_not_found", { arg: args[0] })) 
                
                const embed = new MessageEmbed()
                    .setDescription(`${i18n.__("discord.info.args_not_found_alternative")} \`${bestMatch.data ? bestMatch.data[bestMatch.findBy] : bestMatch.name}\` ${bestMatch.data && bestMatch.findBy !== "id" ? "(" + bestMatch.data.name + ")" : ""}, ${i18n.__("discord.info.alternative_yes")}`)
                    .setColor(client.config.colors.yellow)

                const msg = await message.lineReplyNoMention(embed)

                await msg.react("✅")

                const filter = (reaction, user) => reaction.emoji.name === "✅" && user.id === message.author.id
                const collector = await msg.createReactionCollector(filter, { time: 30000 })

                collector.on("collect", async() => {
                    await collector.stop()
                    await msg.reactions.removeAll()

                    if (bestMatch.type === "type") {
                        return await typeEmbed(msg, args, client, bestMatch, { action: actionList, crypto: cryptoList}, i18n, "edit")
                    } else {
                        return await client.functions.actionCryptoEmbed(msg, args, client, bestMatch.type, bestMatch.data, i18n, "edit")
                    }
                })

                collector.on("end", (collected, reason) => {
                    if (reason === "user") return

                    msg.edit(i18n.__("discord.info.too_late"))
                })
            }

            if (isType) {
                return await typeEmbed(message, args, client, { name: args[0], type: "type", findBy: "name", data: null }, { action: actionList, crypto: cryptoList}, i18n, "lineReplyNoMention")
            } else {
                return await client.functions.actionCryptoEmbed(message, args, client, isCrypto ? "crypto" : "action", isCrypto ? isCrypto : isAction, i18n, "lineReplyNoMention")
            }
        }
    }
}