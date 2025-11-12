const Request = require("../src/request")

test("it should return a request", () => {
    const service = {
        name: 'test'
    }
    const action = () => ({
        method: 'post',
        url: 'test'
    })

    const request = new Request(service, action)

    expect(JSON.stringify(request)).toBe(JSON.stringify({
        method: 'post',
        url: 'test',
        headers: {}
    }))
})

test("it should return a request with data", () => {
    const service = {
        name: 'test'
    }
    const action = () => ({
        method: 'post',
        url: 'test',
        data: {}
    })

    const request = new Request(service, action)

    expect(JSON.stringify(request)).toBe(JSON.stringify({
        method: 'post',
        url: 'test',
        data: {},
        headers: {}
    }))
})

test("it should return a urlencoded request with data", () => {
    const service = {
        name: 'test'
    }
    const action = () => ({
        method: 'post',
        url: 'test',
        data: { test: 'test' },
        urlencoded: true
    })

    const request = new Request(service, action)

    expect(JSON.stringify(request)).toBe(JSON.stringify({
        method: 'post',
        url: 'test',
        data: 'test=test',
        headers: {}
    }))
})

test("it should return a request with populated data function", () => {
    const service = {
        name: 'test'
    }
    const action = ({ arg1, arg2, arg3 }) => ({
        method: 'post',
        url: 'test',
        data: { arg1: arg1, arg2: arg2, arg3: arg3 }
    })

    const request = new Request(service, action, { arg1: 1, arg2: 2, arg3: 3 })

    expect(request.data.arg1).toBe(1)
    expect(request.data.arg2).toBe(2)
    expect(request.data.arg3).toBe(3)
})

test("it should return a request with bearer authorization", () => {
    const service = {
        name: 'test'
    }
    const action = () => ({
        method: 'post',
        url: 'test',
        bearer: 'token'
    })

    const request = new Request(service, action)

    expect(JSON.stringify(request)).toBe(JSON.stringify({
        method: 'post',
        url: 'test',
        headers: {
            'Authorization': 'Bearer token'
        }
    }))
})

test("it should return a request with basic authorization", () => {
    const service = {
        name: 'test'
    }
    const action = () => ({
        method: 'post',
        url: 'test',
        basic: {
            username: 'user',
            password: 'pass'
        }
    })

    const request = new Request(service, action)

    expect(JSON.stringify(request)).toBe(JSON.stringify({
        method: 'post',
        url: 'test',
        headers: {
            'Authorization': 'Basic ' + Buffer.from('user:pass').toString('base64')
        }
    }))
})

test("it should return a request with bearer authorization on service level", () => {
    const service = {
        name: 'test',
        bearer: 'token'
    }
    const action = () => ({
        method: 'post',
        url: 'test'
    })

    const request = new Request(service, action)

    expect(JSON.stringify(request)).toBe(JSON.stringify({
        method: 'post',
        url: 'test',
        headers: {
            'Authorization': 'Bearer token'
        }
    }))
})

test("it should return a request with basic authorization on service level", () => {
    const service = {
        name: 'test',
        basic: {
            username: 'user',
            password: 'pass'
        }
    }
    const action = () => ({
        method: 'post',
        url: 'test',
    })

    const request = new Request(service, action)

    expect(JSON.stringify(request)).toBe(JSON.stringify({
        method: 'post',
        url: 'test',
        headers: {
            'Authorization': 'Basic ' + Buffer.from('user:pass').toString('base64')
        }
    }))
})

test("it should return a request with overwritten bearer authorization from request level", () => {
    const service = {
        name: 'test',
        bearer: 'token'
    }
    const action = () => ({
        method: 'post',
        url: 'test',
        bearer: 'request_token'
    })

    const request = new Request(service, action)

    expect(JSON.stringify(request)).toBe(JSON.stringify({
        method: 'post',
        url: 'test',
        headers: {
            'Authorization': 'Bearer request_token'
        }
    }))
})

test("it should return a request with overwritten basic authorization from request level", () => {
    const service = {
        name: 'test',
        basic: {
            username: 'user',
            password: 'pass'
        }
    }
    const action = () => ({
        method: 'post',
        url: 'test',
        basic: {
            username: 'new_user',
            password: 'new_pass'
        }
    })

    const request = new Request(service, action)

    expect(JSON.stringify(request)).toBe(JSON.stringify({
        method: 'post',
        url: 'test',
        headers: {
            'Authorization': 'Basic ' + Buffer.from('new_user:new_pass').toString('base64')
        }
    }))
})
