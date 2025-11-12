import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Wand2 } from 'lucide-react';

interface GeminiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: { type: 'summary' | 'reply'; content: string } | null;
  isLoading: boolean;
}

export default function GeminiModal({
  open,
  onOpenChange,
  content,
  isLoading,
}: GeminiModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            Gemini AI
          </DialogTitle>
          <DialogDescription>
            {content?.type === 'summary' ? 'Resumo do post' : 'Sugestões de respostas'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[200px] flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Analisando... Por favor, aguarde.</p>
            </div>
          ) : content ? (
            <div className="w-full">
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{content.content}</p>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
