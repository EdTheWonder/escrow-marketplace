"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import Image from "next/image";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export default function ImageModal({ isOpen, onClose, imageUrl, alt }: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <div className="relative aspect-video">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-contain rounded-lg"
            priority
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

