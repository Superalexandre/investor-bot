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

        const financeData = client.config.financeData

        const cryptoList = financeData.filter(config => config.type === "crypto")
        const actionList = financeData.filter(config => config.type === "action")

        const find = cryptoList.find(info => info.id.toLowerCase() === args[0].toLowerCase() || info.symbol.toLowerCase() === args[0].toLowerCase()) || actionList.find(info => info.id.toLowerCase() === args[0].toLowerCase() || info.symbol.toLowerCase() === args[0].toLowerCase())

        console.log(find)

        const link = (crypto) => `https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${crypto}`

        const btn = new MessageButton()
            .setStyle("red")
            .setLabel("e")
            .setID("buy_buy")

        console.log(btn)

        message.channel.send("e", {
            buttons: [ btn ]
        })

        //message.lineReplyNoMention(i18n.__("discord.buy.1234567eee"))
    }
}