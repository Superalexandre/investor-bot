const i18n = require("i18n")

const schedule = require("node-schedule")
const fetch = require("node-fetch")

const config = require("./config")
const path = require("path")

const Enmap = require("enmap")

const logger = require("./logger")

const DiscordClient = require("./discord/index")

const Sentry = require("@sentry/node")

Sentry.init({
    dsn: config.tokens.sentryDSN,
    tracesSampleRate: 1.0,
})

const data = {
    users: new Enmap({ name: "users" }),
    prices: new Enmap({ name: "prices" }),
    discord: {
        bot: new Enmap({ name: "discordBot" })
    }
}

const plateform = ["discord"]

i18n.configure({
    locales: ["fr_FR", "en_US"],
    directory: path.join(__dirname, "locales"),
    defaultLocale: config.defaultLocale,
    objectNotation: true,
    register: global,
    syncFiles: true,
  
    //logDebugFn: function (msg) {
    //    logger.log("i18n debug " + msg)
    //},

    logWarnFn: function (msg) {
        logger.warn("i18n warn " + msg)
    },
  
    logErrorFn: function (msg) {
        logger.error("i18n error " + msg)
    },
  
    missingKeyFn: function(locale, value) {
        logger.error(`MissingKey: La valeur ${value} est manquante dans la langue ${locale}`)

        i18n.setLocale(locale)
    
        return i18n.__("error.missingTranslation")
    },

    mustacheConfig: {
        tags: ["{{", "}}"],
        disable: false
    }
})

const autoFetch = config.autoFetch
schedule.scheduleJob("* * * * *", async() => {
    if (!autoFetch) return
    
    const financeData = config.financeData
    const startDate = Date.now()

    for (let i = 0; i < financeData.length; i++) {
        const type = financeData[i].type
        const id = financeData[i].id
        const symbol = financeData[i].symbol

        const getApi = (data) => {
            if (data.type === "crypto") return `https://api.coingecko.com/api/v3/coins/${data.id}`
            if (data.type === "action") return `https://finnhub.io/api/v1/quote?symbol=${data.symbol}&metric=all&token=${config.tokens.action}`

            return undefined
        }

        //Check if all data exist
        if (!data.prices.get(type)) data.prices.set(type, {})
        if (!data.prices.get(type, id)) data.prices.set(type, {}, id)
        if (!data.prices.get(type, `${id}.symbol`)) data.prices.set(type, symbol, `${id}.symbol`)
        if (!data.prices.get(type, `${id}.prices`)) data.prices.set(type, [], `${id}.prices`)
        if (!data.prices.get(type, `${id}.news`)) data.prices.set(type, {}, `${id}.news`)
        if (!data.prices.get(type, `${id}.news.lastFetch`)) data.prices.set(type, Date.now(), `${id}.news.lastFetch`)
        if (data.prices.get(type, `${id}.news.lastFetch`) === 0) data.prices.set(type, Date.now(), `${id}.news.lastFetch`)
        if (!data.prices.get(type, `${id}.news.languages`)) data.prices.set(type, {}, `${id}.news.languages`)

        let typeData = data.prices.get(type, id)

        //News
        let j = 0
        let newsFetched = false
        const lengthLanguages = Object.keys(config.languages).length
        for (const language in config.languages) {
            
            //if (!typeData.news.languages[language]) {
            //    const updatedObj = Object.assign(data.prices.get(type, `${id}.news.languages`), { [language]: {} })
            //
            //    data.prices.set(financeData[i].type, updatedObj, `${id}.news.languages`)
            //
            //    typeData = data.prices.get(type, id)
            //}

            if (Date.now() - typeData.news.lastFetch > 10 * 60 * 60 * 1000) continue

            const res = await fetch(`https://newsapi.org/v2/top-headlines?q=${financeData[i].name}&category=business&language=${config.languages[language].short}&apiKey=${config.tokens.news}`)
            const json = await res.json()

            if (!json || !json.articles) continue

            newsFetched = true

            if (j + 1 === lengthLanguages) {
                typeData = data.prices.set(financeData[i].type, Date.now(), `${financeData[i].id}.news.lastFetch`)
                j = 0
            }

            data.prices.set(financeData[i].type, json, `${financeData[i].id}.news.languages.${language}`)
        }

        //Prices
        await fetch(getApi(financeData[i])).then(rep => {
            if (!rep.ok) return

            rep.json().then(async(json) => {
                if (!json) return

                let price = typeData.prices
                let lastPrice = json["c"] ? json["c"] : json.market_data?.current_price?.usd

                if (!lastPrice) return

                if (price[0] && price[0].price === lastPrice) return

                await price.unshift({ price: lastPrice, date: Date.now() })

                data.prices.set(financeData[i].type, price, `${financeData[i].id}.prices`)
            })
        })

        logger.update({ message: `Ajout : ${financeData[i].id} (${financeData[i].type}) (${i+1}/${financeData.length}) (News fetched : ${newsFetched})`, end: i + 1 === financeData.length, startDate: startDate, traitementMaxTime: 10 })
    }
    /*
        prices: {
            crypto: {
                bitcoin: {
                    symbol: "BTC"
                    prices: [
                        {
                            date: Date.now()
                            price: ...$
                        }
                    ],
                    news: {
                        lastFetch: Date.now(),
                        languages: {
                            fr_FR: [{}, {}],
                            en_US: [{}, {}]
                        }
                    }
                },
            },
            action: {
                ...
            }
        }
    */
})


Object.size = function(obj) {
    let size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }

    return size;
}

function genId() {
    let random = ""
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let stringDate = Date.now().toString()
    for (let i = 0; i < 30; i++) {
    	random += characters.charAt(Math.floor(Math.random() * characters.length))

    	random += stringDate[i] ? stringDate[i] : ""
    }

    return random
}

async function createAccount(type, typeData) {
    const id = genId()

    data.users.set(id, {
        lang: "fr_FR",
        money: 20
    })

    if (type && plateform.includes(type) && typeData) {
        data.users.set(id, typeData, type)
    }

    const account = data.users.get(id)

    return { success: true, accountID: id, account: account }
}

async function deleteAllAccount() {
    data.users.forEach(async(content, id) => {
        data.users.delete(id)
    })

    return { success: true }
}

async function addAccount(id, type, typeData) {
    if (!id || !type || !typeData) {
        logger.error("Valeur manquante impossible d'ajouter un compte, data manquante")
        return { success: false, error: "error.data" }
    }

    if (!plateform.includes(type)) {
        logger.error(`Impossible de crée un compte avec la plateforme ${type}`)
        return { success: false, error: "error.plateform" }
    }

    if (!data.users.get(id)) {
        logger.error(`Compte "${id}" introuvable`)
        return { success: false, error: "error.id_invalid" }
    }

    if (data.users.get(id, type)) {
        logger.error(`Le compte ${id} contient deja ${type} en compte actif`)
        return { success: false, error: "error.already_active" }
    }

    const account = data.users.set(id, typeData, type)

    return { success: true, accountID: id, account: account }
}

async function addMoney(id, number) { 
    const userData = await data.users.get(id)

    if (!userData) {
        return { success: false, error: "error.no_account"}
    }

    if (!userData.money) {
        data.users.set(id, 20, "money")
    }

    const newMoney = userData.money + number
    const newUserData = data.users.set(id, newMoney, "money")

    return { success: true, accountID: id, account: newUserData, newMoney: newMoney }
}

async function removeMoney(id, number) {

    const userData = await data.users.get(id)

    if (!userData) {
        return { success: false, error: "error.no_account"}
    }

    if (!userData.money) {
        data.users.set(id, 20, "money")
    }

    if (userData.money <= number) {
        return { success: false, error: "Veuillez saisir un montant plus faible, vous n'avez pas les fonds" }
    }

    const newMoney = userData.money - number
    const newUserData = data.users.set(id, newMoney, "money")

    return { success: true, accountID: id, account: newUserData, newMoney: newMoney }
}

async function addStocks(id, type, name, number) {
    let userData = await data.users.get(id)

    if (!userData) {
        return { success: false, error: "error.no_account"}
    }

    if (!userData.money) {
        data.users.set(id, 20, "money")
    }

    if (!data.users.get(id, "stocks")) {
        data.users.set(id, {}, "stocks")
    }

    if (!data.users.get(id, `stocks.${type}`)) {
        data.users.set(id, {}, `stocks.${type}`)
    }

    if (!data.users.get(id, `stocks.${type}.${name}`)) {
        data.users.set(id, { number: 0 }, `stocks.${type}.${name}`)
    }

    userData = await data.users.get(id)

    const newStocksNumber = parseFloat(userData.stocks[type][name].number) + parseFloat(number)

    const stats = userData?.stocks?.[type]?.[name]?.stats ? parseInt(userData.stocks[type][name].stats) : 0
    const newStatsNumber = stats + 1

    data.users.set(id, newStatsNumber, `stocks.${type}.${name}.stats`)
    
    const newUserData = data.users.set(id, newStocksNumber, `stocks.${type}.${name}.number`)

    return { success: true, accountID: id, account: newUserData, newStocksNumber: newStocksNumber }
}

async function getHistoricalData(data, from, to) {
    //https://finnhub.io/api/v1/calendar/ipo?from=2020-01-01&to=2020-04-30&token=c1go49748v6v8dn0dajg
    //https://api.coingecko.com/api/v3/coins/bitcoin/history?date=27-05-2021

    //Fetch => API ?
        //Json
        //Catch
    
    //Price = price

    //Return
    return { success: true, price: 0, date: from }
}

const functions = { genId, createAccount, addAccount, deleteAllAccount, addMoney, removeMoney, addStocks, getHistoricalData }

DiscordClient.load(data, functions)