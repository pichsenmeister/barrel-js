
const compile = (payload, context) => {
    // create a deep copy of the payload
    let copy = payload
    if (typeof payload === 'string') copy = payload.repeat(1)
    else if (typeof payload === 'object') copy = JSON.parse(JSON.stringify(payload))
    return parseObj(copy, context)
}

const parseObj = (payload, context) => {
    if (typeof context !== 'object' || Array.isArray(context)) throw new Error('context has to be a JSON object')

    switch (typeof payload) {
        case 'object':
            if (Array.isArray(payload)) {
                return payload.map(item => parseObj(item, context))
            }
            let jsonKeys = Object.keys(payload)
            jsonKeys.forEach(key => {
                payload[key] = parseObj(payload[key], context)
            })
            return payload
        case 'string':
            return parseStr(payload, context)
    }
    return payload
}

const parseStr = (str, context) => {
    let keys = Object.keys(context)
    keys.forEach(key => {
        let regex = new RegExp(`\\$\{${key}\}`, 'g')
        str = str.replace(regex, context[key])

        let escape = new RegExp(`\\\\\\$\{${key}\\\\\}`, 'g')
        str = str.replace(escape, `\${${key}}`)
    })

    return str
}

module.exports = {
    compile
}