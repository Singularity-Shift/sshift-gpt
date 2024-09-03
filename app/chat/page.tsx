'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scrollarea"
import { Paperclip, Image, Send, Plus } from "lucide-react"

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo")
  const [inputMessage, setInputMessage] = useState("")
  const [messages, setMessages] = useState([
    { id: 1, sender: "user", content: "Hello, how can you help me today?" },
    { id: 2, sender: "assistant", content: "Hello! I'm here to assist you with any questions or tasks you may have. How can I help you today?" },
  ])
  const [chats, setChats] = useState([
    { id: 1, summary: "General Inquiries" },
    { id: 2, summary: "Technical Support" },
    { id: 3, summary: "Product Information" },
  ])

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, { id: messages.length + 1, sender: "user", content: inputMessage }])
      setInputMessage("")
      // Here you would typically send the message to the backend and wait for a response
    }
  }

  const handleNewChat = () => {
    setMessages([])
    // Additional logic for starting a new chat
  }

  return (
    <div className="flex h-screen bg-background">
      {/* ChatSidebar */}
      <div className="w-64 border-r border-border bg-background hidden md:block">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {chats.map((chat) => (
              <Button key={chat.id} variant="ghost" className="w-full justify-start">
                {chat.summary}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-4">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleNewChat} variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
            <span className="text-gray-800 font-semibold">Connected</span>
          </div>
        </div>

        {/* ChatWindow */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* ChatInput */}
        <div className="border-t border-border p-4">
          <div className="flex items-end space-x-2">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1"
            />
            <Button variant="outline" size="icon" className="shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0">
              <Image className="h-4 w-4" />
            </Button>
            <Button onClick={handleSendMessage} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}