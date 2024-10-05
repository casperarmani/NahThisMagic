import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, Bot, User, AlertCircle } from 'lucide-react';

// Initialize the Gemini AI model
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-pro' });
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_KEY) {
      setError('API key is not set. Please check your environment variables.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      if (!API_KEY || !genAI || !model) {
        throw new Error('API key is not set or Gemini AI is not initialized properly.');
      }
      const result = await model.generateContent(input);
      const response = await result.response;
      const botMessage: Message = { text: response.text(), sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Gemini AI Chatbot</h1>
      </header>
      <main className="flex-grow container mx-auto p-4 flex flex-col">
        <div className="flex-grow bg-white rounded-lg shadow-md p-4 mb-4 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                  {message.sender === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div className={`p-3 rounded-lg ${message.sender === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {message.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-200 p-3 rounded-lg">
                <div className="animate-pulse flex space-x-2">
                  <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                  <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                  <div className="rounded-full bg-gray-400 h-2 w-2"></div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center p-4 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700">
              <AlertCircle className="w-6 h-6 mr-2" />
              <p>{error}</p>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || !API_KEY}
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </main>
    </div>
  );
}