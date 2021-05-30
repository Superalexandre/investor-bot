const Command = require("../structures/Command")
const { MessageEmbed } = require("discord.js")
const stringSimilarity = require("string-similarity")
const Chart = require("quickchart-js")

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
                console.log(type)
                
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
                        return await actionCryptoEmbed(msg, args, client, bestMatch.type, bestMatch.data, i18n, "edit")
                    }
                })

                collector.on("end", (collected, reason) => {
                    if (reason === "user") return

                    msg.edit(i18n.__("discord.info.too_late"))
                })
            }

            if (isType) {
                return await typeEmbed(message, args, client, { name: args[0], type: "type", findBy: "name", data: null }, { action: actionList, crypto: cryptoList}, i18n, "lineReplyNoMention")
            } else if (isCrypto) {
                return await actionCryptoEmbed(message, args, client, "crypto", isCrypto, i18n, "lineReplyNoMention")
            } else if (isAction) {
                return await actionCryptoEmbed(message, args, client, "action", isAction, i18n, "lineReplyNoMention")
            }
        }
    }
}

async function typeEmbed(message, args, client, type, allList, i18n, messageAction) {
    const list = allList[type.name]

    const embed = new MessageEmbed()
        .setTitle("Liste des " + type.name)
        .setColor(client.config.colors.yellow)

    if (client.data.prices.get(type.name)) {
        for (let i = 0; i < list.length; i++) {
            const typePrices = client.data.prices.get(type.name, list[i].id)?.prices
    
            if (!typePrices) return message.lineReplyNoMention("Error typePrices in typeEmbed (info)")
    
            let lastPrice = {
                "0": {},
                "1": {},
                "2": {},
                "3": {}
            }
    
            for (const daysAgo in lastPrice) {
                const day = parseInt(daysAgo)
                const dayAgoDate = new Date().getTime() - (day * 24 * 60 * 60 * 1000)
            
                const priceDayAgo = typePrices.slice().sort((a, b) => sortDate(a, b, dayAgoDate))
        
                if (priceDayAgo[0].date - dayAgoDate > 10 * 60 * 60 * 1000) {
                    lastPrice[daysAgo] = {
                        price: 0,
                        date: dayAgoDate,
                        formatedDate: client.functions.compactDate(dayAgoDate),
                        currencyPrice: i18n.__("discord.info.error_more_10h")
                    }
                } else {
                    lastPrice[daysAgo] = { 
                        price: priceDayAgo[0].price, 
                        date: priceDayAgo[0].date,
                        formatedDate: client.functions.compactDate(priceDayAgo[0].date),
                        currencyPrice: priceDayAgo[0].price + "$" 
                    }
                }
            }
    
            embed.addField(list[i].name, `\`\`\`diff\n${lastPrice["0"].price > lastPrice["1"].price  ? "+" : "-"} ${i18n.__("discord.info.now")} : ${lastPrice["0"].currencyPrice}\n${lastPrice["1"].price  > lastPrice["2"].price  ? "+" : "-"} 24h (${lastPrice["1"].formatedDate}) : ${lastPrice["1"].currencyPrice}\n${lastPrice["2"].price  > lastPrice["3"].price  ? "+" : "-"} 48h (${lastPrice["2"].formatedDate}) : ${lastPrice["2"].currencyPrice}\`\`\``, true)
        }
    } else {
        embed.setDescription("Error no data found")
    }

    await message[messageAction](embed)
}

async function actionCryptoEmbed(message, args, client, type, typeData, i18n, messageAction) {
    const msg = await message[messageAction]("[Emote loading] Chargement en cours, cette action peu prendre du temps...")

    const allType = client.data.prices.get(type)

    if (!allType) return msg.edit("Error noType in actionCryptoEmbed (info)")

    const typePrices = client.data.prices.get(type, `${typeData.id}.prices`)
    const typeNews = client.data.prices.get(type, `${typeData.id}.news`)

    if (!typePrices) return msg.edit("Error typePrices in actionCryptoEmbed (info)")
    if (!typeNews) return msg.edit("Error typeNews in actionCryptoEmbed (info)")

    let lastPrice = {
        "0": {},
        "1": {},
        "2": {},
        "3": {},
        "4": {}
    }

    for (const daysAgo in lastPrice) {
        const days = parseInt(daysAgo)
        const daysAgoDate = new Date().getTime() - (days * 24 * 60 * 60 * 1000)
    
        const priceDayAgo = typePrices.slice().sort((a, b) => sortDate(a, b, daysAgoDate))

        if (priceDayAgo[0].date - daysAgoDate > 10 * 60 * 60 * 1000) {
            const fetchedMissingData = await client.functions.getHistoricalData(typeData, daysAgoDate)

            lastPrice[daysAgo] = {
                price: fetchedMissingData.price,
                date: daysAgoDate,
                formatedDate: client.functions.compactDate(daysAgoDate),
                currencyPrice: i18n.__("discord.info.error_more_10h")
            }
        } else {
            lastPrice[daysAgo] = { 
                price: priceDayAgo[0].price, 
                date: priceDayAgo[0].date,
                formatedDate: client.functions.compactDate(priceDayAgo[0].date),
                currencyPrice: priceDayAgo[0].price + "$" 
            }
        }
    }
    
    const diffDateInMinute = (date) => Math.round((Date.now() - date) / 60000)
    
    const chartLabels = []
    const chartData = []
    const maxSize = 10

    const regexDay = /([[0-9]+)([d|D])/gm
    const regexMonth = /([[0-9]+)([m|M])/gm

    if (!args[1] || args[1] === "last") {
        const slicedPrices = typePrices.slice(0, maxSize)

        for (let i = 0; i < slicedPrices.length; i++) {
            chartLabels.push(i18n.__n("discord.info.%s minutes", diffDateInMinute(slicedPrices[i].date)))
            chartData.push(slicedPrices[i].price)
        }

    } else if (args[1].match(regexDay)[0]) {
        const dayString = args[1].split("d")[0]
        const day = parseInt(dayString)

        if (day !== 1 && day % 10 !== 0) return msg.edit("Le nombre de jour saisi n'est pas valide")

        for (let i = 0; i < maxSize; i++) {
            const days = i * day
            const daysAgoDate = new Date().getTime() - (days * 24 * 60 * 60 * 1000)
            const priceDay = typePrices.slice().sort((a, b) => sortDate(a, b, daysAgoDate))

            let price = priceDay[0].price, date = priceDay[0].date

            if (priceDay[0].date - daysAgoDate > 10 * 60 * 60 * 1000) {
                const fetchedMissingData = await client.functions.getHistoricalData(typeData, daysAgoDate)

                price = fetchedMissingData.price
                date = fetchedMissingData.date
            }

            chartLabels.push(client.functions.fullCompactDate(date))
            chartData.push(price)
        }
    } else {
        return await msg.edit(i18n.__("discord.info.unknow_sort", { name: args[1] }))
    }

    const chartConfig = {
        type: "line",
        data: {
            labels: chartLabels.slice().reverse(),
            datasets: [{
                label: i18n.__("discord.info.graph", { name: typeData.name }),
                data: chartData.slice().reverse(),
                fill: false,
                borderColor: client.config.colors.pink,
                lineTension: 0.4,
                borderDash: [10, 10]
            }, {
                label: i18n.__("discord.info.graph", { name: typeData.name }),
                data: chartData.slice().reverse(),
                fill: false,
                borderColor: client.config.colors.yellow,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            },
            annotation: {
                annotations: [{
                    type: "line",
                    mode: "horizontal",
                    scaleID: "y-axis-0",
                    value: typePrices[0].price,
                    borderColor: "red",
                    borderWidth: 1,
                    label: {
                        enabled: true,
                        content: i18n.__("discord.info.actual_price")
                    }
                }]
            }
        }
    }

    let stringArticles = ""
    const news = typeNews?.languages[i18n.getLocale()]
    if (typeNews && news) {
        let newsJson

        try {
            newsJson = JSON.parse(news.articles)
        } catch(err) {
            newsJson = news
        }

        if (newsJson && newsJson.articles) {
            for (let i = 0; i < newsJson.articles.length; i++) {
                if (i + 1 >= 5) break

                if (stringArticles.length >= 2000) break

                const text = `__${newsJson.articles[i].title}__\n${newsJson.articles[i].content} ([${i18n.__("discord.info.articlesSuite")}](${newsJson.articles[i].url}))\n\n`

                if (stringArticles.length + text.length >= 2000) break

                stringArticles += text
            }
        }
    }

    const chart = new Chart()
        .setConfig(chartConfig)
        .setBackgroundColor("transparent")
        .setFormat("png")

    const embed = new MessageEmbed()
        .setTitle(i18n.__(`discord.info.info_${type}`, { name: typeData.name }))
        .setDescription(stringArticles.length > 2000 ? "" : stringArticles)
        .addField(i18n.__("discord.info.last_prices"), `\`\`\`diff\n${lastPrice["0"].price > lastPrice["1"].price  ? "+" : "-"} ${i18n.__("discord.info.now")} : ${lastPrice["0"].currencyPrice}\n${lastPrice["1"].price  > lastPrice["2"].price  ? "+" : "-"} 24h (${lastPrice["1"].formatedDate}) : ${lastPrice["1"].currencyPrice}\n${lastPrice["2"].price  > lastPrice["3"].price  ? "+" : "-"} 48h (${lastPrice["2"].formatedDate}) : ${lastPrice["2"].currencyPrice}\n${lastPrice["3"].price  > lastPrice["4"].price  ? "+" : "-"} 72h (${lastPrice["3"].formatedDate}) : ${lastPrice["3"].currencyPrice}\`\`\``)
        .addField("\u200B", i18n.__n("discord.info.%s last_prices", maxSize))
        .setImage(await chart.getShortUrl())
        .setColor(client.config.colors.yellow)

    await msg.edit("", embed)
}

function sortDate(a, b, dayAgo) {
    let distancea = Math.abs(dayAgo - a.date)
    let distanceb = Math.abs(dayAgo - b.date)
    return distancea - distanceb
}

function wait(ms) {
    new Promise(res => setTimeout(res, ms))
}