const i18n = require("i18n")
const { MessageButton } = require("discord-buttons")

module.exports = class clickButton {
    constructor(client) {
        this.client = client
    }

    async run(button) {
        const client = this.client

        if (button.id.startsWith("info_goto")) {
            if (!button.clicker || !button.clicker?.user?.accountID) return button.defer()

            const goTo = button.id.split("_")

            const userData = await client.data.users.get(button.clicker.user.accountID)
            i18n.setLocale(userData.lang)

            const financeData = client.config.financeData
            const cryptoList = financeData.filter(config => config.type === "crypto")
            const actionList = financeData.filter(config => config.type === "action")

            if ((goTo[2] === "action" || goTo[2] === "crypto") && !goTo[3]) {
                await client.functions.typeEmbed(button.message, [], client, { name: goTo[2], type: "type", findBy: "name", data: null }, { action: actionList, crypto: cryptoList}, i18n, "edit")
                
                button.defer()
            } else if ((goTo[2] === "action" || goTo[2] === "crypto") && goTo[3]) {
                const typeToFind = goTo[2] === "action" ? actionList : cryptoList
                const typeData = typeToFind.find(info => info.id.toLowerCase() === goTo[3].toLowerCase())

                if (!typeData) return button.defer()

                await client.functions.actionCryptoEmbed(button.message, [goTo[3], goTo[4]], client, goTo[2], typeData, i18n, "edit")
                button.defer()
            } else {
                button.message.edit("Erreur l'id est invalide")
                button.defer()
            }
        } else if (button.id.startsWith("buy")) {
            const type = button.id.split("_")

            if (type[1] === "cancel") {
                const confirm = new MessageButton()
                    .setStyle("green")
                    .setLabel("Cofirmer")
                    .setID("buy_cancel")
                    .setDisabled()
    
                const cancel = new MessageButton()
                    .setStyle("red")
                    .setLabel("Annuler")
                    .setID("buy_cancel")
                    .setDisabled()

                button.reply.send("Vous avez refuser l'achat", { buttons: [ confirm, cancel ], type: 7 })
            } else {
                //\(([^()]+)\)
                //buy_confirm_(btc_0.00002719)_(20)
                //            ________________ ___
                
                //set in data
                //todo
                console.log(button.id)
            }
        }
    }
}