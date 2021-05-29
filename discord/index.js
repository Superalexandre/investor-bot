const Client = require("./structures/Client") 
const client = new Client()
const { readdir } = require("fs")

require("discord-reply")
require("discord-buttons")(client)

module.exports.load = async(data, globalFunctions) => {
    readdir("./discord/events", (err, files) => {
        if (err) return console.error(err)

        if (files.length <= 0) return console.error("Aucun evenement n'a été trouvé")

        const events = files.filter((ext) => ext.split(".").pop() === "js")

        for (let i = 0; i < events.length; i++)  {
            const event = new (require("./events/" + events[i]))(client)
            const eventName = events[i].split(".")[0]

            client.logger.update({ message: `Chargement de l'evenement ${i + 1}/${events.length}`, end: i + 1 === events.length })

            client.on(eventName, (...args) => event.run(...args))

            delete require.cache[require.resolve("./events/" + events[i])]
        }
    })

    readdir("./discord/commands", (err, commands) => {
        if (err) return console.error(err)

        if (commands.length <= 0) return console.error("No command was found")

        for (let i = 0; i < commands.length; i++) {
            const command = new (require("./commands/" + commands[i]))(client)

            client.logger.update({ message: `Chargement de la commande ${i + 1}/${commands.length}`, end: i + 1 === commands.length })

            client.commands.set(command.help.name, command)

            for (let j = 0; j < command.help.aliases.length; j++) {
                client.aliases.set(command.help.aliases[j], command.help.name)  
            }

            delete require.cache[require.resolve("./commands/" + commands[i])]
        }
    })

    client.functions = Object.assign(client.functions, globalFunctions)

    client.data = data

    client.on("warn", client.logger.warn)
    client.on("error", client.logger.error)

    client.login(client.config.discord.token)
}