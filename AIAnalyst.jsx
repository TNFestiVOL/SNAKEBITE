import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Sparkles } from "lucide-react";
import MessageBubble from "../components/analyst/MessageBubble";

export default function AIAnalyst() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    loadConversations();
    
    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (currentConversation) {
      // Load the conversation's existing messages
      const loadConversationMessages = async () => {
        try {
          const convo = await base44.agents.getConversation(currentConversation.id);
          setMessages(convo.messages || []);
        } catch (error) {
          console.error("Error loading conversation messages:", error);
        }
      };
      
      loadConversationMessages();

      // Subscribe to updates
      const unsubscribe = base44.agents.subscribeToConversation(
        currentConversation.id,
        (data) => {
          setMessages(data.messages || []);
        }
      );
      
      unsubscribeRef.current = unsubscribe;
      
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else {
      // If no conversation, clear messages
      setMessages([]);
    }
  }, [currentConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convos = await base44.agents.listConversations({
        agent_name: "market_analyst",
      });
      setConversations(convos || []);
      
      // Don't auto-load the first conversation - let user start fresh
      // User can manually select from history if needed
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const createNewConversation = async () => {
    try {
      setIsLoading(true);
      
      // Clear current state first
      setCurrentConversation(null);
      setMessages([]);
      
      const conversation = await base44.agents.createConversation({
        agent_name: "market_analyst",
        metadata: {
          name: "Market Analysis Session",
          description: "AI-powered market research and strategy consultation",
        },
      });
      
      setCurrentConversation(conversation);
      setConversations([conversation, ...conversations]);
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!currentConversation) {
      // Create conversation first, then send message
      await createNewConversation();
      // Message will need to be resent after conversation is created
      return;
    }

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    try {
      await base44.agents.addMessage(currentConversation, {
        role: "user",
        content: userMessage,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore input on error
      setInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "Analyze AAPL stock for a potential swing trade",
    "What's the current market sentiment for tech stocks?",
    "Explain the RSI indicator and when to use it",
    "Compare my strategy performance across backtests"
  ];

  return (
    <div className="min-h-screen bg-[#0F1419] p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Bot className="w-10 h-10 text-emerald-400" />
              AI Market Analyst
            </h1>
            <p className="text-slate-400">Get real-time market insights and trading advice</p>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={createNewConversation}
            disabled={isLoading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <Card className="bg-[#1A1F2E] border-slate-800">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white text-lg">
              Market Analysis Chat
              {currentConversation && (
                <span className="text-sm text-slate-400 ml-2 font-normal">
                  - {new Date(currentConversation.created_date).toLocaleDateString()}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Bot className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-6">
                    {currentConversation 
                      ? "Start your conversation with the AI analyst"
                      : "Click 'New Chat' to start a fresh conversation"
                    }
                  </p>
                  {!currentConversation && (
                    <Button
                      onClick={createNewConversation}
                      className="bg-emerald-600 hover:bg-emerald-700 mb-6"
                      disabled={isLoading}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start New Chat
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    {quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(prompt)}
                        className="text-left p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700 text-sm text-slate-300 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, idx) => (
                    <MessageBubble key={idx} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-slate-800 p-4">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    currentConversation
                      ? "Ask about market conditions, strategies, or specific stocks..."
                      : "Click 'New Chat' to start a conversation..."
                  }
                  className="bg-slate-800 border-slate-700 text-white resize-none"
                  rows={2}
                  disabled={isLoading || !currentConversation}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || !currentConversation}
                  className="bg-emerald-600 hover:bg-emerald-700 px-6"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                The AI analyst has access to live market data and your strategy performance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}