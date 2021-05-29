const Command = require("../structures/Command")
const { MessageEmbed } = require("discord.js")

module.exports = class Ping extends Command {
    constructor(client) {
        super(client, {
            name: "ping",
            desc: (i18n) => i18n.__("discord.ping.desc"),
            directory: __dirname,
            use: (i18n) => i18n.__("discord.ping.use"),
            example: (i18n) => i18n.__("discord.ping.example"),
            aliases: []
        })
    }

    async run({ client, message, args, i18n, data, userData, util }) {

        const startAddDatabase = Date.now()
        await data.discord.bot.set("ping", true)
        const timeAddDatabase = (Date.now() - startAddDatabase) / 1000

        const startEditDatabase = Date.now()
        await data.discord.bot.set("ping", true)
        const timeEditDatabase = (Date.now() - startEditDatabase) / 1000

        const startDeleteDatabse = Date.now()
        await data.discord.bot.delete("ping")
        const timeDeleteDatabase = (Date.now() - startDeleteDatabse) / 1000

        const embed = new MessageEmbed()
            .setTitle(i18n.__("discord.ping.title"))
            
            .addField(i18n.__("discord.ping.message"), `${i18n.__("discord.ping.processing")} \`${util.messageTimeProcessing}s\`\n${i18n.__("discord.ping.send")} \`${i18n.__("discord.ping.calculation")}s\`\n${i18n.__("discord.ping.total")} \`${i18n.__("discord.ping.calculation")}s\``)
            .addField(i18n.__("discord.ping.discord_api"), `\`${client.ws.ping / 1000}s\``)
            .addField(i18n.__("discord.ping.database"), `${i18n.__("discord.ping.database_add")} \`${timeAddDatabase}s\`\n${i18n.__("discord.ping.database_edit")} \`${timeEditDatabase}s\`\n${i18n.__("discord.ping.database_delete")} \`${timeDeleteDatabase}s\``)
            .setColor(client.config.colors.yellow)

        const startSendMessage = Date.now()

        let msg = await message.lineReplyNoMention(embed)

        const timeSendMessage = (Date.now() - startSendMessage) / 1000

        const updatedEmbed = new MessageEmbed()
            .setTitle(i18n.__("discord.ping.title"))
            
            .addField(i18n.__("discord.ping.message"), `${i18n.__("discord.ping.processing")} \`${util.messageTimeProcessing}s\`\n${i18n.__("discord.ping.send")} \`${timeSendMessage}s\`\n${i18n.__("discord.ping.total")} \`${(timeSendMessage + util.messageTimeProcessing).toFixed(3)}s\``)
            .addField(i18n.__("discord.ping.discord_api"), `\`${client.ws.ping / 1000}s\``)
            .addField(i18n.__("discord.ping.database"), `${i18n.__("discord.ping.database_add")} \`${timeAddDatabase}s\`\n${i18n.__("discord.ping.database_edit")} \`${timeEditDatabase}s\`\n${i18n.__("discord.ping.database_delete")} \`${timeDeleteDatabase}s\``)
            .setColor(client.config.colors.yellow)

        await msg.edit(updatedEmbed)
    }
}