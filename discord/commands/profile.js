const Command = require("../structures/Command")
const { MessageEmbed } = require("discord.js")

module.exports = class Profile extends Command {
    constructor(client) {
        super(client, {
            name: "profile",
            desc: (i18n) => i18n.__("discord.profile.desc"),
            directory: __dirname,
            use: (i18n) => i18n.__("discord.profile.use"),
            example: (i18n) => i18n.__("discord.profile.example"),
            aliases: ["profil"]
        })
    }

    async run({ client, message, args, i18n, data, userData, util }) {
        const embed = new MessageEmbed()
            .setTitle(i18n.__("discord.profile.title", { username: message.author.username }))
            .setDescription(`${i18n.__("discord.profile.money")} ${userData.money}$`)
            .setColor(client.config.colors.yellow)
            

        if (!userData.stats) {
            embed.addField(i18n.__("discord.profile.top3"), i18n.__("discord.profile.no_investment"))
        } else if (userData.stats.length >= 3) {
            embed.addField(i18n.__("discord.profile.top3"), "TODO")
        } else if (userData.stats.length >= 5) {
            embed.addField(i18n.__("discord.profile.top5"), "TODO")
        } else if (userData.stats.length >= 10) {
            embed.addField(i18n.__("discord.profile.top10"), "TODO")
        }

        message.lineReplyNoMention(embed)
    }
}