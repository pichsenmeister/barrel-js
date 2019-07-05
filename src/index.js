exports.set = (payload, options) => {
    if(typeof options !== 'object' || Array.isArray(options)) throw new Error('options has to be a JSON object')

    switch (typeof payload) {
        case 'object':
            if(Array.isArray(payload)) {
                return payload.map(item => this.set(item, options))
            }
            let jsonKeys = Object.keys(payload)
            jsonKeys.forEach(key => { 
                payload[key] = this.set(payload[key], options)
            })
            return payload
        case 'string':
            return parseStr(payload, options)    
    }
    return payload
}

const parseStr = (str, options) => {
    let keys = Object.keys(options)
    keys.forEach(key => {
        let regex = new RegExp(`{{${key}}}`, 'g')
        str = str.replace(regex, options[key])
    })
    return str
} 