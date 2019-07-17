module.exports = {
    "string": "This is a ${banana}, an ${apple} and another banana.",
    "array": [
        {
            "text": "${lemon}"
        },
        "This is a ${banana}, an ${apple} and another banana.",
        [
            {
                "text": "${lemon}"
            }
        ]
    ],
    "object": {  
        "text": "Hello ${user}!",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Hey ${user}! This is a mrkdwn section block, *this is bold*, and ~this is crossed out~, <https://google.com|this is a link, and this is a ${channel_id}. Thanks for your attention, ${user}!>"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "This <${channel_id}|${channel_name}> has an overflow menu."
                },
                "accessory": {
                    "type": "overflow",
                    "options": [
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "${user}",
                                "emoji": true
                            },
                            "value": "value-0"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "${channel_id}",
                                "emoji": true
                            },
                            "value": "value-1"
                        },
                        {
                            "text": {
                                "type": "plain_text",
                                "text": "Option",
                                "emoji": true
                            },
                            "value": "value-2"
                        }
                    ]
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "conversations_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "${select} a conversation",
                            "emoji": true
                        }
                    },
                    {
                        "type": "channels_select",
                            "placeholder": {
                            "type": "plain_text",
                            "text": "${select} a channel",
                            "emoji": true
                        }
                    },
                    {
                        "type": "users_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "${select} a user",
                            "emoji": true
                        }
                    },
                    {
                        "type": "static_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select an item",
                            "emoji": true
                        },
                        "options": [
                            {
                                "text": {
                                    "type": "plain_text",
                                    "text": "${item_0}",
                                    "emoji": true
                                },
                                "value": "value-0"
                            },
                            {
                                "text": {
                                    "type": "plain_text",
                                    "text": "${item_1}",
                                    "emoji": true
                                },
                                "value": "value-1"
                            },
                            {
                                "text": {
                                    "type": "plain_text",
                                    "text": "${item_2}",
                                    "emoji": true
                                },
                                "value": "value-2"
                            },
                            {
                                "text": {
                                    "type": "plain_text",
                                    "text": "Static text",
                                    "emoji": true
                                },
                                "value": "value-3"
                            }
                        ]
                    }
                ]
            }

        ]
    }
}