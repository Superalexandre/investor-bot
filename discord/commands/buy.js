const Command = require("../structures/Command")
const fetch = require("node-fetch")
const { MessageButton } = require("discord-buttons")

module.exports = class Buy extends Command {
    constructor(client) {
        super(client, {
            name: "buy",
            //desc: (i18n) => i18n.__("discord.help.desc"),
            directory: __dirname,
            //use: (i18n) => i18n.__("discord.help.use"),
            //example:(i18n) => i18n.__("discord.help.example"),
            aliases: ["b"]
        })
    }

    async run({ client, message, args, i18n, data, userData, util }) {
        if (!args[0]) return message.lineReplyNoMention("Merci de saisir la crypto ou l'action que vous voulez acheter")
        if (!args[1]) return message.lineReplyNoMention("Merci de saisir le montant en dollar que vous voulez acheter")
        if (isNaN(args[1])) return message.lineReplyNoMention("Merci de saisir un nombre")
        if (args[1] <= 0) return message.lineReplyNoMention("Merci de saisir plus de 0 dollar")

        const financeData = client.config.financeData

        const cryptoList = financeData.filter(config => config.type === "crypto")
        const actionList = financeData.filter(config => config.type === "action")

        const find = cryptoList.find(info => info.id.toLowerCase() === args[0].toLowerCase() || info.symbol.toLowerCase() === args[0].toLowerCase()) || actionList.find(info => info.id.toLowerCase() === args[0].toLowerCase() || info.symbol.toLowerCase() === args[0].toLowerCase())
        let convert = null

        if (find.type === "crypto") {
            const rep = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${find.symbol}`)
            if (!rep.ok) convert = null

            const json = await rep.json()
            convert = json[find.symbol]
        } else {
            if (!client.data.prices.get(find.type)) return message.lineReplyNoMention("Erreur dans la base de données")
            if (!client.data.prices.get(find.type, find.id)) return message.lineReplyNoMention("Erreur dans la base de données")

            const typeData = client.data.prices.get(find.type, find.id)

            
            if (!typeData.prices || !typeData.prices[0]) return message.lineReplyNoMention("Aucun prix trouvé re-essayer dans quelques minutes")

            if (typeData.prices[0].date - Date.now() > 10 * 60 * 60 * 1000) return message.lineReplyNoMention("Le prix est trop ancien")

            convert = args[1] / typeData.prices[0].price
        }

        if (!convert) return message.lineReplyNoMention("Une erreur est survenue")

        const confirm = new MessageButton()
            .setStyle("green")
            .setLabel("Cofirmer")
            .setID(`buy_confirm_[${args[0]}_${convert}]_[${args[1]}]`)

        const cancel = new MessageButton()
            .setStyle("red")
            .setLabel("Annuler")
            .setID("buy_cancel")

        message.channel.send(`Voulez vous vraiment acheter ${convert}${find.type === "action" ? " action" : ""} ${find.type === "action" ? find.name : find.symbol} (${args[1]}$)`, { buttons: [ confirm, cancel ] })
    }
}