const i18n = require("i18n")
const { MessageButton } = require("discord-buttons")

module.exports = class clickButton {
    constructor(client) {
        this.client = client
    }

    async run(button) {
        const client = this.client

        if (!button.clicker || !button.clicker?.user?.accountID) return button.defer()

        if (button.id.startsWith("info_goto")) {
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
                const userID = button.clicker.user.accountID

                const regex = /\(([^()]+)\)/g
                const splitId = button.id.match(regex)

                const dollar = splitId[1].replace(/\(|\)/g, "")
                const info = splitId[0].replace(/\(|\)/g, "").split("_")

                const type = info[0]
                const name = info[1]
                const number = info[2]
               
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

                const removeMoney = await client.functions.removeMoney(userID, dollar)

                if (!removeMoney.success) return button.reply.send(removeMoney.error, { buttons: [ confirm, cancel ], type: 7 })

                console.log(type, name, number)

                const addStocks = await client.functions.addStocks(userID, type, name, number)

                if (!addStocks.success) return button.reply.send(addStocks.error, { buttons: [ confirm, cancel ], type: 7 })

                button.reply.send("Achat effectué avec succès", { buttons: [ confirm, cancel ], type: 7 })
            }
        }
    }
}