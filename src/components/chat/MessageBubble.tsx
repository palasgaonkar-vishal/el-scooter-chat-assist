
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, User, ThumbsUp, ThumbsDown, FileText, AlertTriangle } from "lucide-react";
import { ChatMessage } from "@/hooks/useChat";
import { useRateResponse } from "@/hooks/useChat";
import { EscalationButton } from "./EscalationButton";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const rateResponse = useRateResponse();

  const handleRate = async (isHelpful: boolean) => {
    const conversationId = message.id.replace('-bot', '').replace('-user', '');
    await rateResponse.mutateAsync({ conversationId, isHelpful });
  };

  const conversationId = message.id.replace('-bot', '').replace('-user', '');

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <Card className={`max-w-[85%] sm:max-w-[70%] ${
        message.sender === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {message.sender === 'bot' && (
              <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            {message.sender === 'user' && (
              <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              
              {/* File attachments */}
              {message.files && message.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-xs bg-background/10 rounded px-2 py-1 hover:bg-background/20 transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      <span>{file.name}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Bot message metadata */}
              {message.sender === 'bot' && (
                <div className="mt-3 space-y-2">
                  {/* Confidence and FAQ match indicators */}
                  <div className="flex items-center space-x-2 text-xs">
                    {message.faqMatched && (
                      <Badge variant="secondary" className="text-xs">
                        FAQ Match
                      </Badge>
                    )}
                    {message.confidenceScore !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(message.confidenceScore * 100)}% confidence
                      </Badge>
                    )}
                    {message.isEscalated && (
                      <Badge className="text-xs bg-orange-100 text-orange-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Escalated
                      </Badge>
                    )}
                  </div>

                  {/* Rating buttons */}
                  {message.canRate && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Was this helpful?</span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRate(true)}
                          disabled={rateResponse.isPending}
                          className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRate(false)}
                          disabled={rateResponse.isPending}
                          className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Manual escalation button */}
                  {message.sender === 'bot' && !message.isEscalated && message.isHelpful !== true && (
                    <div className="mt-2">
                      <EscalationButton
                        conversationId={conversationId}
                        query={message.content}
                        disabled={rateResponse.isPending}
                      />
                    </div>
                  )}

                  {/* Helpfulness feedback */}
                  {message.isHelpful !== undefined && (
                    <div className={`text-xs flex items-center space-x-1 ${
                      message.isHelpful ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {message.isHelpful ? (
                        <>
                          <ThumbsUp className="h-3 w-3" />
                          <span>Marked as helpful</span>
                        </>
                      ) : (
                        <>
                          <ThumbsDown className="h-3 w-3" />
                          <span>Marked as not helpful</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
