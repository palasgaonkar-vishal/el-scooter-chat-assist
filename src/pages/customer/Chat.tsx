
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bot, AlertTriangle, RefreshCw } from "lucide-react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat, useSendMessage, useProcessAIResponse } from "@/hooks/useChat";
import { toast } from "sonner";

const Chat = () => {
  const { messages, currentSessionId, isTyping, initializeSession } = useChat();
  const sendMessage = useSendMessage();
  const processAIResponse = useProcessAIResponse();
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize with welcome message
  const [welcomeShown, setWelcomeShown] = useState(false);

  useEffect(() => {
    if (currentSessionId && !welcomeShown && messages.length === 0) {
      setWelcomeShown(true);
    }
  }, [currentSessionId, messages.length, welcomeShown]);

  const handleSendMessage = async (messageText: string, files: File[]) => {
    if (!currentSessionId) {
      toast.error('Chat session not initialized');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Send user message
      const result = await sendMessage.mutateAsync({
        message: messageText,
        sessionId: currentSessionId,
        files,
      });

      // Process AI response
      if (result.conversation) {
        setTimeout(async () => {
          try {
            await processAIResponse.mutateAsync({
              conversationId: result.conversation.id,
              query: messageText,
            });
          } catch (error) {
            console.error('AI processing error:', error);
            toast.error('Failed to generate AI response');
          } finally {
            setIsProcessing(false);
          }
        }, 1000); // Simulate thinking time
      }
    } catch (error) {
      console.error('Send message error:', error);
      setIsProcessing(false);
    }
  };

  const handleNewSession = () => {
    initializeSession();
    setWelcomeShown(false);
  };

  const getSessionStats = () => {
    const userMessages = messages.filter(m => m.sender === 'user').length;
    const botMessages = messages.filter(m => m.sender === 'bot').length;
    const helpfulResponses = botMessages - messages.filter(m => m.sender === 'bot' && m.isHelpful === false).length;
    
    return { userMessages, botMessages, helpfulResponses };
  };

  const stats = getSessionStats();

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat Support</h1>
          <p className="text-muted-foreground">
            Get instant help from our AI assistant powered by FAQ database
          </p>
        </div>
        
        <Button variant="outline" onClick={handleNewSession}>
          <RefreshCw className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Session Stats */}
      {currentSessionId && messages.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex space-x-4">
                <span>Messages: {stats.userMessages}</span>
                <span>Responses: {stats.botMessages}</span>
                {stats.botMessages > 0 && (
                  <span>Helpful: {stats.helpfulResponses}/{stats.botMessages}</span>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                Session Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Ather Support Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-1 pb-4">
              {/* Welcome Message */}
              {welcomeShown && messages.length === 0 && (
                <div className="flex justify-start mb-4">
                  <Card className="bg-muted max-w-[85%] sm:max-w-[70%]">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm leading-relaxed">
                            Hello! I'm your Ather support assistant. I can help you with:
                          </p>
                          <ul className="text-sm mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                            <li>Charging and battery issues</li>
                            <li>Service and maintenance questions</li>
                            <li>Range and performance queries</li>
                            <li>Order status and delivery updates</li>
                            <li>Warranty and cost information</li>
                          </ul>
                          <p className="text-sm mt-2">
                            You can also upload images or documents to help me better understand your issue.
                          </p>
                          <p className="text-xs opacity-70 mt-2">
                            {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Typing Indicator */}
              {(isProcessing || processAIResponse.isPending || sendMessage.isPending) && (
                <div className="flex justify-start">
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Input Area */}
          <div className="flex-shrink-0">
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={!currentSessionId}
              isLoading={isProcessing || sendMessage.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Help Information */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-start space-x-2 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="text-muted-foreground">
              <p className="font-medium">How it works:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• AI searches our FAQ database for the best answers</li>
                <li>• Rate responses to help improve our assistance</li>
                <li>• Complex queries are automatically escalated to human support</li>
                <li>• Chat history is available for 1 hour per session</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Chat;
