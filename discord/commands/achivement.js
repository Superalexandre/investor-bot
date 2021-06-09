const Command = require("../structures/Command")

module.exports = class Button extends Command {
    constructor(client) {
        super(client, {
            name: "achivement",
            directory: __dirname,
            aliases: ["achiv"]
        })
    }

    async run({ client, message, args, i18n, data, userData, util }) {
        return true
    }
}