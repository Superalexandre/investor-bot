const { format, utcToZonedTime } = require("date-fns-tz")
const Chart = require("quickchart-js")
const { MessageEmbed } = require("discord.js")

const locales = {
    fr_FR: {
        locale: require("date-fns/locale/fr"),
        timeZone: "Europe/Paris",
        at: "à"
    },
    en_US: {
        locale: require("date-fns/locale/en-US"),
        timeZone: "America/New_York",
        at: "at"
    }
}

function formateDate(date = Date.now(), locale = "fr_FR") {

    const timeZone = locales[locale].timeZone
    const localeLang = locales[locale].locale

    date = utcToZonedTime(date, timeZone)

    const formatedDate = format(date, `EEEE dd LLLL yyyy '${locales[locale].at}' pp`, {
        timeZone: timeZone,
        locale: localeLang
    })

    return formatedDate
}

function compactDate(date = Date.now(), locale = "fr_FR") {

    const timeZone = locales[locale].timeZone
    const localeLang = locales[locale].locale

    date = utcToZonedTime(date, timeZone)

    const compactDate = format(date, `dd'/'MM'/'yy '${locales[locale].at}' pp`, {
        timeZone: timeZone,
        locale: localeLang
    })

    return compactDate
}

function fullCompactDate(date = Date.now(), locale = "fr_FR") {

    const timeZone = locales[locale].timeZone
    const localeLang = locales[locale].locale

    date = utcToZonedTime(date, timeZone)

    const fullCompactDate = format(date, "yyyy'-'MM'-'dd", {
        timeZone: timeZone,
        locale: localeLang
    })

    return fullCompactDate
}

function americanCompactDate(date = Date.now(), locale = "fr_FR") {

    const timeZone = locales[locale].timeZone
    const localeLang = locales[locale].locale

    date = utcToZonedTime(date, timeZone)

    const americanCompactDate = format(date, "yyyy'-'MM'-'dd", {
        timeZone: timeZone,
        locale: localeLang
    })

    return americanCompactDate
}

/* EMBED */
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

    if (!args || !args[1] || args[1] === "last") {
        const slicedPrices = typePrices.slice(0, maxSize)

        for (let i = 0; i < slicedPrices.length; i++) {
            chartLabels.push(i18n.__n("discord.info.%s minutes", diffDateInMinute(slicedPrices[i].date)))
            chartData.push(slicedPrices[i].price)
        }

    } else if (args[1].match(regexDay) && args[1].match(regexDay)[0]) {
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

function sortDate(a, b, dayAgo) {
    let distancea = Math.abs(dayAgo - a.date)
    let distanceb = Math.abs(dayAgo - b.date)
    
    return distancea - distanceb
}

module.exports = {
    formateDate,
    compactDate,
    fullCompactDate,
    americanCompactDate,
    actionCryptoEmbed,
    typeEmbed
}