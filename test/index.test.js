const barrel = require("../src/index")
const payload = require("./payload")

test("it throws an error with context of wrong type", () => {
    expect(() => {
        barrel.compile(payload, "this is not an object")
    }).toThrow("context has to be a JSON object")

    expect(() => {
        barrel.compile(payload, [])
    }).toThrow("context has to be a JSON object")
})

test("it replaces all context values in a string", () => {
    const context = {
        "banana": "Banana",
        "apple": "Apple"
    }

    const str = barrel.compile(payload.string, context)

    // block #0 - section
    expect(str).toBe("This is a Banana, an Apple and another banana.")
})

test("it replaces all context values in a JSON array", () => {
    const context = {
        "banana": "Banana",
        "apple": "Apple",
        "lemon": "Lemon"
    }

    const array = barrel.compile(payload.array, context)

    // element #0 
    expect(array[0].text).toBe("Lemon")

    // element #1 
    expect(array[1]).toBe("This is a Banana, an Apple and another banana.")

    // element #2 
    expect(array[2][0].text).toBe("Lemon")
})

test("it replaces all context values in a JSON object", () => {
    const context = {
        "channel_id": "CXXXXXX",
        "channel_name": "general",
        "user": "UXXXXXX",
        "select": "Choose",
        "item_0": "Item 0",
        "item_1": "Item 1",
        "item_2": "Item 2"
    }

    const json = barrel.compile(payload.object, context)

    // block #0 - section
    expect(json.text).toBe("Hello UXXXXXX!")

    // block #1 - section
    expect(json.blocks[0].text.text).toBe("Hey UXXXXXX! This is a mrkdwn section block, *this is bold*, and ~this is crossed out~, <https://google.com|this is a link, and this is a CXXXXXX. Thanks for your attention, UXXXXXX!>")

    // block #1 - accessory
    expect(json.blocks[1].accessory.options[0].text.text).toBe("UXXXXXX")
    expect(json.blocks[1].accessory.options[1].text.text).toBe("CXXXXXX")
    expect(json.blocks[1].accessory.options[2].text.text).toBe("Option")

    // block #2 - actions
    expect(json.blocks[2].elements[0].placeholder.text).toBe("Choose a conversation")
    expect(json.blocks[2].elements[1].placeholder.text).toBe("Choose a channel")
    expect(json.blocks[2].elements[2].placeholder.text).toBe("Choose a user")
    expect(json.blocks[2].elements[3].placeholder.text).toBe("Select an item")

    // block #2 - static select
    expect(json.blocks[2].elements[3].options[0].text.text).toBe("Item 0")
    expect(json.blocks[2].elements[3].options[1].text.text).toBe("Item 1")
    expect(json.blocks[2].elements[3].options[2].text.text).toBe("Item 2")
    expect(json.blocks[2].elements[3].options[3].text.text).toBe("Static text")
})

test("it works with single and double quotation strings", () => {
    let context = {
        "name": "Bruce Wayne"
    }

    const singleQuoteString = barrel.compile("Hello ${name}!", context)
    expect(singleQuoteString).toBe("Hello Bruce Wayne!")

    const doubleQuoteString = barrel.compile("Hello ${name}!", context)
    expect(doubleQuoteString).toBe("Hello Bruce Wayne!")
})

test("it should properly escape \\${value}", () => {
    let context = {
        "name": "Bruce Wayne"
    }

    const singleQuoteString = barrel.compile("Hello \\${name\\}!", context)
    expect(singleQuoteString).toBe("Hello ${name}!")

    const doubleQuoteString = barrel.compile("Hello \\${name\\}!", context)
    expect(doubleQuoteString).toBe("Hello ${name}!")
})

test("it should not compile template keys with no value", () => {
    let context = {
        "name": "Bruce Wayne"
    }

    const singleQuoteString = barrel.compile("Hello ${value_does_not_exist}!", context)
    expect(singleQuoteString).toBe("Hello ${value_does_not_exist}!")
})

test("it should not override templates with are passed by reference", () => {
    let strTemplate = 'This is test #${number}.'
    let jsonTemplate = {
        "text": "This is test #${number}."
    }

    const str0 = barrel.compile(strTemplate, { number: 0 })
    expect(str0).toBe("This is test #0.")

    const str1 = barrel.compile(strTemplate, { number: 1 })
    expect(str1).toBe("This is test #1.")

    const json0 = barrel.compile(jsonTemplate, { number: 0 })
    expect(json0.text).toBe("This is test #0.")

    const json1 = barrel.compile(jsonTemplate, { number: 1 })
    expect(json1.text).toBe("This is test #1.")
})

test("it should throw a range error if trying to filter out-of-bounds element", () => {
    expect(() => {
        barrel.filter(payload.get_object, "type", 4)
    }).toThrow("index out of range")

    expect(() => {
        barrel.filter(payload.get_array, "type", 7)
    }).toThrow("index out of range")
})

test("it should throw a unsupported payload error if filter payload is not JSON", () => {
    expect(() => {
        barrel.filter("string", "filter")
    }).toThrow("unsupported payload")
})

test("it should throw a type mismatch error if wrong filter parameters are supplied", () => {
    expect(() => {
        barrel.filter({}, {}, 7)
    }).toThrow("parameters mismatch")

    expect(() => {
        barrel.filter({}, "type", "string")
    }).toThrow("parameters mismatch")

    expect(() => {
        barrel.filter({}, "type", {})
    }).toThrow("parameters mismatch")
})

test("it should filter all values in a JSON object", () => {
    const result = barrel.filter(payload.get_object, "text")

    // return array should have 4 elements
    expect(result.length).toBe(4)

    // all of them should have the value "string"
    expect(JSON.stringify(result[0])).toBe(JSON.stringify({
        "type": "plain_text",
        "text": "This is a section block."
    }))
    expect(result[1]).toBe("This is a section block.")
    expect(JSON.stringify(result[2])).toBe(JSON.stringify({
        "type": "plain_text",
        "text": "Button",
        "emoji": true
    }))
    expect(result[3]).toBe("Button")
})

test("it should filter all values in a JSON array", () => {
    const result = barrel.filter(payload.get_array, "text")

    // return array should have 4 elements
    expect(result.length).toBe(4)

    // all of them should have the value "string"
    expect(JSON.stringify(result[0])).toBe(JSON.stringify({
        "type": "mrkdwn",
        "text": "This is a section block."
    }))
    expect(result[1]).toBe("This is a section block.")
    expect(JSON.stringify(result[2])).toBe(JSON.stringify({
        "type": "plain_text",
        "text": "This is a section block."
    }))
    expect(result[3]).toBe("This is a section block.")
})

test("it should throw a unsupported payload error if contains payload is not JSON", () => {
    expect(() => {
        barrel.contains("string", "filter")
    }).toThrow("unsupported payload")
})

test("it should throw a type mismatch error if wrong contains parameters are supplied", () => {
    expect(() => {
        barrel.contains({}, "string")
    }).toThrow("unsupported payload")
})



