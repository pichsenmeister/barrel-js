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
    filter
}