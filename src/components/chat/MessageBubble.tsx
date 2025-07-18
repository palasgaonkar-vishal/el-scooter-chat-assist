
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, User, ThumbsUp, ThumbsDown, FileText, Image, ExternalLink } from 'lucide-react';
import { useRateResponse } from '@/hooks/useChat';
import type { ChatMessage } from '@/hooks/useChat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const [hasRated, setHasRated] = useState(message.isHelpful !== undefined);
  const rateResponse = useRateResponse();

  const handleRating = async (isHelpful: boolean) => {
    if (hasRated) return;
    
    try {
      await rateResponse.mutateAsync({
        conversationId: message.id.split('-')[0], // Extract conversation ID
        isHelpful,
      });
      setHasRated(true);
    } catch (error) {
      console.error('Failed to rate response:', error);
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileName = (url: string) => {
    return url.split('/').pop()?.split('-').slice(1).join('-') || 'file';
  };

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${message.sender === 'user' ? 'order-1' : 'order-2'}`}>
        <Card className={`${
          message.sender === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {message.sender === 'bot' ? (
                  <Bot className="h-5 w-5 mt-0.5" />
                ) : (
                  <User className="h-5 w-5 mt-0.5" />
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                {/* Message Content */}
                <div>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {/* File Attachments */}
                {message.files && message.files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium opacity-80">Attachments:</p>
                    <div className="grid gap-2">
                      {message.files.map((file) => (
                        <Card key={file.id} className="bg-background/10 border-background/20">
                          <CardContent className="p-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                {getFileIcon(file.url)}
                                <span className="text-xs truncate">
                                  {formatFileName(file.url)}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => window.open(file.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bot Message Metadata */}
                {message.sender === 'bot' && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {message.faqMatched && (
                      <Badge variant="secondary" className="text-xs">
                        FAQ Match
                      </Badge>
                    )}
                    {message.confidenceScore !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        Confidence: {Math.round(message.confidenceScore * 100)}%
                      </Badge>
                    )}
                  </div>
                )}

                {/* Rating Buttons */}
                {message.sender === 'bot' && message.canRate && (
                  <div className="flex items-center space-x-2 pt-2">
                    <p className="text-xs opacity-70">Was this helpful?</p>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 ${
                          message.isHelpful === true ? 'bg-green-100 text-green-600' : ''
                        }`}
                        onClick={() => handleRating(true)}
                        disabled={hasRated || rateResponse.isPending}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 ${
                          message.isHelpful === false ? 'bg-red-100 text-red-600' : ''
                        }`}
                        onClick={() => handleRating(false)}
                        disabled={hasRated || rateResponse.isPending}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
