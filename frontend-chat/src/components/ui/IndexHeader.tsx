'use client';

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from './dialog';
import Link from 'next/link';
import Image from 'next/image';

export function IndexHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="w-full max-w-4xl mx-auto flex flex-col items-center space-y-2 py-4">
        <div className="flex justify-center space-x-4 [&>*]:px-1 sm:space-x-8 sm:[&>*]:px-0">
          <Dialog>
            <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
              About SShift
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl h-[90vh] sm:h-auto overflow-y-auto p-6">
              {/* Rest of the About content */}
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
              How to Use
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl h-[90vh] sm:h-auto overflow-y-auto p-6">
              {/* Rest of the How to Use content */}
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
              Custom Tools
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl h-[90vh] sm:h-auto overflow-y-auto p-6">
              {/* Rest of the Custom Tools content */}
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
              Contact Us
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl h-[90vh] sm:h-auto overflow-y-auto p-6">
              {/* Rest of the Contact Us content */}
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <a
            href="https://ledgerapp.fun/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base"
          >
            SShift 📒
          </a>
        </div>
      </nav>
    </header>
  );
} 