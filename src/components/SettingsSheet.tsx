import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Priority } from '@shared/types';
export interface AppSettings {
  defaultPriority: Priority;
}
interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
}
export function SettingsSheet({ open, onOpenChange, settings, onSettingsChange }: SettingsSheetProps) {
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(settings);
  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings, open]);
  const handleSave = () => {
    onSettingsChange(currentSettings);
    onOpenChange(false);
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure default behaviors for your tasks.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="default-priority" className="text-right col-span-1">
              Default Priority
            </Label>
            <div className="col-span-3">
              <Select
                value={currentSettings.defaultPriority}
                onValueChange={(value) => setCurrentSettings(prev => ({ ...prev, defaultPriority: value as Priority }))}
              >
                <SelectTrigger id="default-priority">
                  <SelectValue placeholder="Set default priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}