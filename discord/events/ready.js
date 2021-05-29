module.exports = class Ready {
    constructor(client) {
        this.client = client
    }

    async run() {
        const client = this.client

        client.logger.log("Client connecté")

        //client.user.setAvatar('./avatar.png')

        setInterval(async function() {
            const statutes = [{
                name: "Bitcoin | inv.help",
                type: "WATCHING"
            }, {
                name: "Stonks",
                type: "LISTENING"
            }]

            const status = statutes[Math.floor(Math.random() * statutes.length)]

            await client.user.setActivity(status.name, { type: status.type })
        }, 10000)
    }
}