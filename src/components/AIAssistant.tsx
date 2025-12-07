import React, { useState } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  "What is work life expectancy?",
  "How do I calculate present value?",
  "What discount rate should I use?",
  "Explain fringe benefits",
  "What are household services?",
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (question?: string) => {
    const messageText = question || input.trim();
    if (!messageText) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'assistant',
          userQuestion: messageText,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.content || 'Sorry, I could not generate a response.' 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 p-3 sm:p-4 rounded-full bg-primary text-primary-foreground shadow-xl hover:shadow-2xl transition-all hover:scale-105 print:hidden ${isOpen ? 'hidden' : ''}`}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] sm:max-h-[500px] bg-card border border-border rounded-xl shadow-2xl flex flex-col animate-in print:hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">AI Assistant</h3>
                <p className="text-[10px] text-muted-foreground">Economic analysis help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3 sm:p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <HelpCircle className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Ask me about economic terms, calculations, or how to fill out case fields.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick questions:</p>
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      disabled={isLoading}
                      className="w-full text-left text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about economic terms..."
                className="min-h-[40px] max-h-[100px] text-sm resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="flex-shrink-0"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
