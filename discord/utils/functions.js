const { format, utcToZonedTime } = require("date-fns-tz")

const locales = {
    fr_FR: {
        locale: require("date-fns/locale/fr"),
        timeZone: "Europe/Paris",
        at: "à"
    },
    en_US: {
        locale: require("date-fns/locale/en-US"),
        timeZone: "America/New_York",
        at: "at"
    }
}

function formateDate(date = Date.now(), locale = "fr_FR") {

    const timeZone = locales[locale].timeZone
    const localeLang = locales[locale].locale

    date = utcToZonedTime(date, timeZone)

    const formatedDate = format(date, `EEEE dd LLLL yyyy '${locales[locale].at}' pp`, {
        timeZone: timeZone,
        locale: localeLang
    })

    return formatedDate
}

function compactDate(date = Date.now(), locale = "fr_FR") {

    const timeZone = locales[locale].timeZone
    const localeLang = locales[locale].locale

    date = utcToZonedTime(date, timeZone)

    const compactDate = format(date, `dd'/'MM'/'yy '${locales[locale].at}' pp`, {
        timeZone: timeZone,
        locale: localeLang
    })

    return compactDate
}

function fullCompactDate(date = Date.now(), locale = "fr_FR") {

    const timeZone = locales[locale].timeZone
    const localeLang = locales[locale].locale

    date = utcToZonedTime(date, timeZone)

    const fullCompactDate = format(date, "yyyy'-'MM'-'dd", {
        timeZone: timeZone,
        locale: localeLang
    })

    return fullCompactDate
}

function americanCompactDate(date = Date.now(), locale = "fr_FR") {

    const timeZone = locales[locale].timeZone
    const localeLang = locales[locale].locale

    date = utcToZonedTime(date, timeZone)

    const americanCompactDate = format(date, "yyyy'-'MM'-'dd", {
        timeZone: timeZone,
        locale: localeLang
    })

    return americanCompactDate
}

module.exports = {
    formateDate,
    compactDate,
    fullCompactDate,
    americanCompactDate
}