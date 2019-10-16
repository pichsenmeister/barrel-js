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
    if (typeof payload === 'object') payload = JSON.stringify(payload)
    if (typeof context === 'object') {
        context = JSON.stringify(context)
        context = context.trim().slice(1, -1)
    }

    return payload.indexOf(context) >= 0
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
    }

    if (index !== false && results.length - 1 > index) return results[index]
    if (index !== false) throw new Error('index out of range')

    return results
}

const match = (payload, obj, index) => {
    if (typeof payload !== 'object') throw new Error('unsupported payload')
    if (typeof obj !== 'object') throw new Error('parameters mismatch')
    if (typeof index !== 'undefined' && typeof index !== 'number') throw new Error('parameters mismatch')
    index = index || false

    let results = []

    switch (typeof payload) {
        case 'object':
            results = parseMatch(payload, obj, index, results)
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

const parseMatch = (payload, obj, index, results) => {
    const objKeys = Object.keys(obj)
    switch (typeof payload) {
        case 'object':
            if (Array.isArray(payload)) {
                payload.map(item => parseMatch(item, obj, index, results))
            } else {
                let jsonKeys = Object.keys(payload)
                let isSubset = objKeys.filter((val) => { return jsonKeys.indexOf(val) >= 0 }).length === objKeys.length
                // check length if all objKeys are part of this structure and their values are equal
                if (isSubset) {
                    let length = objKeys.filter(item => {
                        if (typeof obj[item] !== 'object') {
                            return payload[item] === obj[item]
                        }
                        return Object.compare(payload[item], obj[item])
                    }).length

                    if (isSubset && length === objKeys.length) {
                        results.push(payload)
                    }
                }

                // check sub structure as well
                jsonKeys.forEach(item => {
                    if (typeof payload[item] === 'object') parseMatch(payload[item], obj, index, results)
                })
            }
            break
    }
    return results
}

Object.compare = function (obj1, obj2) {
    //Loop through properties in object 1
    for (let p in obj1) {
        //Check property exists on both objects
        if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false

        switch (typeof (obj1[p])) {
            case 'object':
                if (!Object.compare(obj1[p], obj2[p])) return false
                break
            default:
                return obj1[p] === obj2[p]
        }
    }

    //Check object 2 for any extra properties
    for (let p in obj2) {
        if (typeof (obj1[p]) === 'undefined') return false
    }
    return true
};

module.exports = {
    compile,
    contains,
    filter,
    match
}