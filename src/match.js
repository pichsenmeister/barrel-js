const utils = require('./utils')

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
                        return utils.compareObj(payload[item], obj[item])
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

module.exports = {
    match
}