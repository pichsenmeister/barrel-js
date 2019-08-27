/**  wrapper function for set
 *
 * this function is reserved for future high level parsing
 * which should be done prior to the recursive `set` function.
 * 
 */
const compile = (payload, context) => {
    // create a deep copy of the payload
    let copy = payload
    if (typeof payload === 'string') copy = payload.repeat(1)
    else if (typeof payload === 'object') copy = JSON.parse(JSON.stringify(payload))
    return set(copy, context)
}

const contains = (payload, context) => {
    if (typeof payload !== 'object' || typeof context !== 'object') throw new Error('unsupported payload')
}

const filter = (payload, key, index) => {
    if (typeof payload !== 'object') throw new Error('unsupported payload')
    if (typeof key !== 'string') throw new Error('parameters mismatch')
    if (typeof index !== 'undefined' && typeof index !== 'number') throw new Error('parameters mismatch')
    index = index || false

    let results = []

    switch (typeof payload) {
        case 'object':
            results = parseFilter(payload, key, index, results)
            break
        case 'string': //TODO no matchAll support in node
            // let regex = new RegExp(`${key}`, 'g')
            // results = [...payload.matchAll(regex)]
            break
    }

    if (index !== false && results.length - 1 > index) return results[index]
    if (index !== false) throw new Error('index out of range')

    return results
}

const set = (payload, context) => {
    if (typeof context !== 'object' || Array.isArray(context)) throw new Error('context has to be a JSON object')

    switch (typeof payload) {
        case 'object':
            if (Array.isArray(payload)) {
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
        let regex = new RegExp(`\\$\{${key}\}`, 'g')
        str = str.replace(regex, context[key])

        let escape = new RegExp(`\\\\\\$\{${key}\\\\\}`, 'g')
        str = str.replace(escape, `\${${key}}`)
    })

    return str
}

const parseFilter = (payload, key, index, results) => {
    switch (typeof payload) {
        case 'object':
            if (Array.isArray(payload)) {
                payload.map(item => parseFilter(item, key, index, results))
            } else {
                let jsonKeys = Object.keys(payload)
                jsonKeys.forEach(item => {
                    if (item === key) results.push(payload[item])
                    if (typeof payload[item] === 'object') parseFilter(payload[item], key, index, results)
                })
            }
            break
    }
    return results
}

module.exports = {
    compile: compile,
    contains: contains,
    filter: filter
}