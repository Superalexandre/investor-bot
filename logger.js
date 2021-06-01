const colors = require("colors"),
    { formateDate } = require("./discord/utils/functions"),
    logUpdate = require("log-update")
    Sentry = require("@sentry/node")


module.exports = class Logger {
    constructor(client) {
        this.client = client
    }

    static log(log) {
        console.log(colors.blue(`_______________________________________________________________________________________________________________________`))
        console.log(` `)
        console.log(colors.cyan(`             Log: ${log}`))
        console.log(colors.cyan(`             Date : ${formateDate()}`))
        colors.reset()
    }

    static warn(log) {
        console.log(colors.green(`_______________________________________________________________________________________________________________________`))
        colors.reset()
        console.log(` `)
        console.log(colors.yellow(`             Warn: ${log}`))
        console.log(colors.yellow(`             Date : ${formateDate()}`))
        colors.reset()
    }

    static error(log) {
        Sentry.captureException(log)

        console.log(colors.magenta(`_______________________________________________________________________________________________________________________`))
        console.log(` `)
        console.log(colors.red(`             Error: ${log}`))
        console.log(colors.red(`             Date : ${formateDate()}`))
        colors.reset()
    }

    static commandLog(message, prefix, cmd, messageTime, commandTime) {
        console.log(colors.blue(`_______________________________________________________________________________________________________________________`))
        console.log(` `)
        console.log(colors.cyan(`             L'utilisateur : "${message.author.username}" (${message.author.id}) ${cmd === "mention" ? 'vient de me mentionner' : 'a effectué la commande "' + prefix + cmd + '"'}`))
        console.log(colors.cyan(`             Date : ${formateDate()}`))
        console.log(colors.cyan(`             Temps de traitement du message: ${messageTime >= 1 ? colors.red(`${messageTime}secs`) : colors.cyan(`${messageTime}secs`)}`))
        console.log(colors.cyan(`             Temps de traitement de la commande: ${commandTime >= 1 ? colors.red(`${commandTime}secs`) : colors.cyan(`${commandTime}secs`)}`))
        console.log(colors.cyan(`             Serveur : "${message.guild.name}" (${message.guild.id})`))
        console.log(colors.cyan(`             Channel : "${message.channel.name}" (${message.channel.id})`))
        colors.reset()
    }

    static update({ message, end, startDate, traitementMaxTime }) {
        let text = `${colors.blue(`_______________________________________________________________________________________________________________________`)}` +
        `\n\n${colors.cyan(`             Log: ${message}`)}`
        
        if (startDate && end) {
            const traitementTime = (Date.now() - startDate) / 1000

            text += `\n${colors.cyan(`             Début : ${formateDate(startDate)}`)}`
            text += `\n${colors.cyan(`             Fin : ${formateDate()}`)}`
            text += `\n${colors.cyan(`             Traité en : ${traitementTime >= (traitementMaxTime || 20) ? colors.red(`${traitementTime}secs`) : colors.cyan(`${traitementTime}secs`)}`)}`
        } else {
            text += `\n${colors.cyan(`             Date : ${formateDate()}`)}`
        }
        
        text += colors.reset()

        logUpdate(text)
        
        if (end) logUpdate.done()
    }

    static getColor(time, timeMax, message) {
        if (time <= timeMax) {
            console.log(colors.cyan(`             ${message}`))
        } else if (time * 2 < timeMax) {
            console.log(colors.yellow(`             ${message}`))
        } else if (time * 4 < timeMax) {
            console.log(colors.magenta(`             ${message}`))
        } else if (time * 6 < timeMax) {
            console.log(colors.red(`             ${message}`))
        }
    }
}