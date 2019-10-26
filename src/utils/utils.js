
const compareObj = (obj1, obj2) => {
    //Loop through properties in object 1
    for (let p in obj1) {
        //Check property exists on both objects
        if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false

        switch (typeof (obj1[p])) {
            case 'object':
                if (!compareObj(obj1[p], obj2[p])) return false
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
    compareObj
}

