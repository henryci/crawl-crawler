"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export function ZigDeathModal() {
  const [imageModalOpen, setImageModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setImageModalOpen(true)}
        className="text-primary hover:underline cursor-pointer"
      >
        zig:27
      </button>
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-2xl p-2" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Zig:27 Death</DialogTitle>
          <Image
            src="/images/henrycideadchar.jpeg"
            alt="My character who died on zig:27"
            width={800}
            height={600}
            className="w-full h-auto rounded"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
