const contains = (payload, context) => {
    if (typeof payload === 'object') payload = JSON.stringify(payload)
    if (typeof context === 'object') {
        context = JSON.stringify(context)
        context = context.trim().slice(1, -1)
    }

    return payload.indexOf(context) >= 0
}

module.exports = {
    contains
}