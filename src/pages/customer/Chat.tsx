
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bot, AlertTriangle, RefreshCw, Bell } from "lucide-react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { ResolutionCard } from "@/components/chat/ResolutionCard";
import { useChat, useSendMessage, useProcessAIResponse } from "@/hooks/useChat";
import { useUserEscalatedQueries } from "@/hooks/useEscalation";
import { useCustomerResolutionNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

const Chat = () => {
  const { messages, currentSessionId, isTyping, initializeSession } = useChat();
  const sendMessage = useSendMessage();
  const processAIResponse = useProcessAIResponse();
  const [isProcessing, setIsProcessing] = useState(false);

  // Escalation notifications and resolutions
  const { data: userEscalations = [] } = useUserEscalatedQueries();
  const { unreadResolutions, markResolutionAsRead, clearAllResolutions } = useCustomerResolutionNotifications();

  // Initialize with welcome message
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [showResolutions, setShowResolutions] = useState(false);

  // Show resolutions that are resolved
  const resolvedEscalations = userEscalations.filter(e => e.status === 'resolved');
  const hasUnreadResolutions = unreadResolutions.length > 0 || resolvedEscalations.some(e => 
    e.resolved_at && new Date(e.resolved_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
  );

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
    <div className="max-w-4xl mx-auto space-y-4 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Chat Support</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Get instant help from our AI assistant powered by FAQ database
          </p>
        </div>
        
        <div className="flex gap-2">
          {hasUnreadResolutions && (
            <Button 
              variant="outline" 
              onClick={() => setShowResolutions(!showResolutions)}
              className="self-start relative"
            >
              <Bell className="h-4 w-4 mr-2" />
              Responses
              {(unreadResolutions.length > 0) && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {unreadResolutions.length}
                </Badge>
              )}
            </Button>
          )}
          <Button variant="outline" onClick={handleNewSession} className="self-start">
            <RefreshCw className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
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

      {/* Admin Resolutions */}
      {showResolutions && resolvedEscalations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Support Responses
              </CardTitle>
              {unreadResolutions.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearAllResolutions}>
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {resolvedEscalations.map((escalation) => (
                <ResolutionCard
                  key={escalation.id}
                  escalation={escalation}
                  onMarkAsRead={() => markResolutionAsRead(escalation.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <Card className="flex flex-col" style={{ height: 'calc(100vh - 20rem)' }}>
        <CardHeader className="flex-shrink-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
            Ather Support Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {/* Messages Area */}
          <ScrollArea className="flex-1 px-3 sm:px-6">
            <div className="space-y-1 pb-4">
              {/* Welcome Message */}
              {welcomeShown && messages.length === 0 && (
                <div className="flex justify-start mb-4">
                  <Card className="bg-muted max-w-[95%] sm:max-w-[85%] md:max-w-[70%]">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <Bot className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs sm:text-sm leading-relaxed">
                            Hello! I'm your Ather support assistant. I can help you with:
                          </p>
                          <ul className="text-xs sm:text-sm mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                            <li>Charging and battery issues</li>
                            <li>Service and maintenance questions</li>
                            <li>Range and performance queries</li>
                            <li>Order status and delivery updates</li>
                            <li>Warranty and cost information</li>
                          </ul>
                          <p className="text-xs sm:text-sm mt-2">
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

          <Separator className="flex-shrink-0" />

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
