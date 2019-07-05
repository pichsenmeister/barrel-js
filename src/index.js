const set = (payload, context) => {
    if(typeof context !== 'object' || Array.isArray(context)) throw new Error('context has to be a JSON object')

    switch (typeof payload) {
        case 'object':
            if(Array.isArray(payload)) {
                return payload.map(item => set(item, context))
            }
            let jsonKeys = Object.keys(payload)
            jsonKeys.forEach(key => { 
                payload[key] = set(payload[key], context)
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
        let regex = new RegExp(`{{${key}}}`, 'g')
        str = str.replace(regex, context[key])
    })
    return str
} 

module.exports = {
    set: set
}