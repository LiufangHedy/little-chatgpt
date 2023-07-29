import { ChatMessage } from "@/types";
export function chat(messageList: Array<ChatMessage>, apiKey: string) {
    return fetch('https://api.openai.com/v1/chat/completions', {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            stream: true,
            messages: messageList
        })
    })
    
}