const Command = require("../structures/Command")

const { MessageButton } = require("discord-buttons")

module.exports = class Button extends Command {
    constructor(client) {
        super(client, {
            name: "button",
            desc: (i18n) => i18n.__("discord.profile.desc"),
            directory: __dirname,
            use: (i18n) => i18n.__("discord.profile.use"),
            example: (i18n) => i18n.__("discord.profile.example"),
            aliases: ["bouton"]
        })
    }

    async run({ client, message, args, i18n, data, userData, util }) {
        const goToCrypto = new MessageButton()
        .setLabel("Allez vers : cryptos")
        .setStyle("blurple")
        .setID("info_goto_crypto")
    
        const goToAction = new MessageButton()
            .setLabel("Allez vers : actions")
            .setStyle("blurple")
            .setID("info_goto_action")

        message.channel.send("Bonjour c un peu chiant la", { buttons: [ goToAction, goToCrypto ] })
    }
}