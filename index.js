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
        if (!data.prices.get(financeData[i].type) || !data.prices.get(financeData[i].type, financeData[i].id)) {
            await data.prices.set(financeData[i].type, { symbol: financeData[i].symbol, prices: [] }, financeData[i].id)
        }

        const getApi = (data) => {
            if (data.type === "crypto") return `https://api.coingecko.com/api/v3/coins/${data.id}`
            if (data.type === "action") return `https://finnhub.io/api/v1/quote?symbol=${data.symbol}&metric=all&token=${config.tokens.action}`

            return undefined
        }

        const typeData = await data.prices.get(financeData[i].type, financeData[i].id)

        /* News */
        try {
            let j = 0
            for (const language in config.languages) {
                const length = Object.size(config.languages)
                j++

                if (!config.languages[language]?.fetchNews) continue

                if (!typeData?.news?.languages[language]) {
                    const obj = data.prices.get(financeData[i].type, `${financeData[i].id}.news`)
                    const updatedObj = Object.assign(obj, { [language]: [] })

                    data.prices.set(financeData[i].type, updatedObj, `${financeData[i].id}.news.languages`)
                }

                if (!typeData?.news?.lastFetch) {
                    data.prices.set(financeData[i].type, { lastFetch: 0 }, `${financeData[i].id}.news`)
                }
                
                if (!(Date.now() - typeData.news.lastFetch > 10 * 60 * 60 * 1000)) continue

                await fetch(`https://newsapi.org/v2/top-headlines?q=${financeData[i].name}&category=business&language=${config.languages[language].short}&apiKey=${config.tokens.news}`).then(fetchData => fetchData.json().then(async(json) => {
                    if (!json || !json.articles) return

                    if (j + 1 === length) {
                        data.prices.set(financeData[i].type, Date.now(), `${financeData[i].id}.news.lastFetch`)
                        j = 0
                    }
    
                    data.prices.set(financeData[i].type, json, `${financeData[i].id}.news.languages.${language}`)
                }))
            }
        } catch(err) {
            logger.error(err)
        }

        /* Prices */
        try {
            const res = await fetch(getApi(financeData[i]))
            const body = await res.text()
            
            if (!body) return

            let price = typeData.prices
            let lastPrice = body["c"] ? body["c"] : body.market_data?.current_price?.usd

            if (!lastPrice) return

            if (price[0] && price[0].price === lastPrice) return

            price.unshift({ price: lastPrice, date: Date.now() })

            data.prices.set(financeData[i].type, price, `${financeData[i].id}.prices`)
        } catch(err) {
            logger.error(err)
        }

        logger.update({ message: `Ajout : ${financeData[i].id} (${financeData[i].type}) (${i+1}/${financeData.length})`, end: i + 1 === financeData.length, startDate: startDate, traitementMaxTime: 10 })
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

async function checkMissingData(id) { return false }

async function addMoney(id, number) { 
    const userData = await data.users.get(id)

    if (!userData) {
        return { success: false, error: "error.no_account"}
    }

    if (!userData.money) {
        const missingData = await checkMissingData(id)

        console.log(missingData)

        return { success: false, error: "error.missing_data"}
    }

    const newUserData = data.users.set(id, number, "money")

    console.log(newUserData)

    return { success: true, accountID: id, account: newUserData, newMoney: newUserData.money }
}
async function removeMoney(id, number) { return true }

async function getHistoricalData(data, from, to) {
    //https://finnhub.io/api/v1/calendar/ipo?from=2020-01-01&to=2020-04-30&token=c1go49748v6v8dn0dajg
    //https://api.coingecko.com/api/v3/coins/bitcoin/history?date=27-05-2021

    //Fetch => API ?
        //Json
        //Catch
    
    //Price = price

    //Return
    return { success: true, price: 0, date: Date.now() }
}

const functions = { genId, createAccount, addAccount, checkMissingData, deleteAllAccount, addMoney, removeMoney, getHistoricalData }

DiscordClient.load(data, functions)