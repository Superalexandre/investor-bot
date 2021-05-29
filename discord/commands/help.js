const Command = require("../structures/Command")
const { MessageEmbed } = require("discord.js")

module.exports = class Help extends Command {
    constructor(client) {
        super(client, {
            name: "help",
            desc: (i18n) => i18n.__("discord.help.desc"),
            directory: __dirname,
            use: (i18n) => i18n.__("discord.help.use"),
            example:(i18n) => i18n.__("discord.help.example"),
            aliases: ["h", "aide"]
        })
    }

    async run({ client, message, args, i18n, data, userData, util }) {
        if (!args[0]) {
            
            const embed = new MessageEmbed()
                .setTitle(i18n.__("discord.help.help_title"))
                .setColor(client.config.colors.yellow)
                .setFooter(i18n.__("discord.help.help_footer"))

            for (const [key, value] of client.commands) {
                if (!value.config.enabled) continue
                if (value.config.ownerOnly === true && !client.config.discord.ownerIds.includes(message.author.id)) continue

                embed.addField("**"+ value.help.name + "**", "```fix\n" + value.help.desc(i18n) + "```", true)
            }

            message.lineReplyNoMention(embed)
        } else {
            const command = client.commands.get(args[0].toLowerCase()) || client.commands.get(client.aliases.get(args[0].toLowerCase()))

            if (!command) return message.lineReplyNoMention(i18n.__("discord.help.no_command_found", { commandName: args[0] }))
            
            if (command.config.enabled === false) return
            if (command.config.ownerOnly === true && !client.config.discord.ownerIds.includes(message.author.id)) return
            
            const embed = new MessageEmbed()
                .setTitle(i18n.__("discord.help.help_title_command", { commandName: args[0] }))
                .addField(i18n.__("discord.help.alias"), command.help.aliases.length > 0 ? command.help.aliases.join(", ") : i18n.__("discord.help.no_alias"), false)
                .addField(i18n.__("discord.help.description"), `\`\`\`fix\n${command.help.desc(i18n)}\`\`\``, false)
                .addField(i18n.__("discord.help.usage"), `\`\`\`fix\n${command.help.use(i18n)}\`\`\``, true)
                .addField(i18n.__("discord.help.example_f"), `\`\`\`fix\n${command.help.example(i18n)}\`\`\``, true)
                .addField("\u200b", "\u200b")
                .addField(i18n.__("discord.help.bot_perm"), `\`\`\`diff\n${command.config.botPerms.length > 0 ? command.config.botPerms.map(perm => message.channel.permissionsFor(message.guild.me).has(perm) ? "+ " + perm : "- " + perm) : `+ ${i18n.__("discord.help.no_perm")}`}\`\`\``, true)
                .addField(i18n.__("discord.help.user_perm"), `\`\`\`diff\n${command.config.memberPerms.length > 0 ? command.config.memberPerms.map(perm => message.channel.permissionsFor(message.member).has(perm) ? "+ " + perm : "- " + perm) : `+ ${i18n.__("discord.help.no_perm")}`}\`\`\``, true)
                .setColor(client.config.colors.yellow)

            message.lineReplyNoMention(embed)
        }
    }
}