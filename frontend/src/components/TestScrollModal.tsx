import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Test modal to verify scrolling works
export const TestScrollModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Test Scrolling Modal</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Long content to test scrolling */}
            {Array.from({ length: 50 }, (_, i) => (
              <div key={i} className="p-4 border rounded">
                <h3 className="font-semibold">Item {i + 1}</h3>
                <p>This is test content for item {i + 1}. This modal should scroll properly when there's too much content to fit on screen.</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};