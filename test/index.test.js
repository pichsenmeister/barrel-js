const barrel = require('../src/index')
const payload = require('./payload')

test('it throws an error with context of wrong type', () => {
    expect(() => {
        barrel.compile(payload, 'this is not an object')
    }).toThrow('context has to be a JSON object')

    expect(() => {
        barrel.compile(payload, [])
    }).toThrow('context has to be a JSON object')
})

test('it replaces all context values in a string', () => {
    const context = {
        banana: 'Banana',
        apple: 'Apple'
    }

    const str = barrel.compile(payload.string, context)

    // block #0 - section
    expect(str).toBe('This is a Banana, an Apple and another Banana.')
})

test('it replaces all context values in a JSON array', () => {
    const context = {
        banana: 'Banana',
        apple: 'Apple',
        lemon: 'Lemon'
    }

    const array = barrel.compile(payload.array, context)

    // element #0 
    expect(array[0].text).toBe('Lemon')

    // element #1 
    expect(array[1]).toBe('This is a Banana, an Apple and another Banana.')

    // element #2 
    expect(array[2][0].text).toBe('Lemon')
})

test('it replaces all context values in a JSON object', () => {
    const context = {
        channel_id: 'CXXXXXX',
        channel_name: 'general',
        user: 'UXXXXXX',
        select: 'Choose',
        item_0: 'Item 0',
        item_1: 'Item 1',
        item_2: 'Item 2'
    }
    
    const json = barrel.compile(payload.object, context)

    // block #0 - section
    expect(json.text).toBe('Hello UXXXXXX!')

    // block #1 - section
    expect(json.blocks[0].text.text).toBe('Hey UXXXXXX! This is a mrkdwn section block, *this is bold*, and ~this is crossed out~, <https://google.com|this is a link, and this is a CXXXXXX. Thanks for your attention, UXXXXXX!>')
    
    // block #1 - accessory
    expect(json.blocks[1].accessory.options[0].text.text).toBe('UXXXXXX')
    expect(json.blocks[1].accessory.options[1].text.text).toBe('CXXXXXX')
    expect(json.blocks[1].accessory.options[2].text.text).toBe('Option')

    // block #2 - actions
    expect(json.blocks[2].elements[0].placeholder.text).toBe('Choose a conversation')
    expect(json.blocks[2].elements[1].placeholder.text).toBe('Choose a channel')
    expect(json.blocks[2].elements[2].placeholder.text).toBe('Choose a user')
    expect(json.blocks[2].elements[3].placeholder.text).toBe('Select an item')

    // block #2 - static select
    expect(json.blocks[2].elements[3].options[0].text.text).toBe('Item 0')
    expect(json.blocks[2].elements[3].options[1].text.text).toBe('Item 1')
    expect(json.blocks[2].elements[3].options[2].text.text).toBe('Item 2')
    expect(json.blocks[2].elements[3].options[3].text.text).toBe('Static text')

})
  
