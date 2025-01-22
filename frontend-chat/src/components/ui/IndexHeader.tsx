'use client';

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from './dialog';

export function IndexHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="w-full max-w-4xl mx-auto flex justify-center space-x-4 py-6 [&>*]:px-1 sm:space-x-8 sm:[&>*]:px-0">
        <Dialog>
          <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
            About SShift
          </DialogTrigger>
          <DialogContent className="bg-white max-w-2xl h-[90vh] sm:h-auto overflow-y-auto p-6">
            <div className="text-gray-600 space-y-4 text-sm sm:text-base pr-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">About SShift</h2>
              <p>
                Founded in 2023 by Crypto Autistic an active and engaged participant in the Aptos ecosystem since main net, SShift emerged as a testament to the transformative power of creativity and technology. With a humble beginning, the founder embarked on a journey to explore the intersection of artificial intelligence and community building. Starting with a passion for AI Discord bots and the guidance of 3.5-turbo, he crafted innovative tools and nurtured an engaged NFT community through the Move Bot Collection, a limited 111-supply masterpiece. These early successes laid the foundation for what SShift would become.
              </p>
              <p>
                Today, SShift has grown into a dynamic team of two, united by a shared mission: to create AI experiences that are useful, fun, and educational. Our portfolio has expanded to include the Qribbles and SShift Records collections (supplies 3333 & 598 respectively), showcasing our commitment to pushing boundaries and delivering value to our community.
              </p>
              <p>
                At SShift, we believe in the endless possibilities of AI and its potential to inspire, educate, and entertain. Join us as we continue to innovate, create, and shape the future of AI-driven experiences.
              </p>
              <p>
                SShift GPT, our flagship offering, provides flexible on-chain subscriptions ranging from 1 to 30 days, making foundational AI models accessible to everyone, including the unbanked. We've developed a suite of custom tools for the AI, ensuring an enhanced and seamless experience. This launch marks just the beginning, with many more innovations to follow in the weeks, months, and years ahead.
              </p>
              <p className="font-medium italic">
                We aim to become an immutable part of Aptos history, leaving a lasting legacy on the ledger.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
            How to Use
          </DialogTrigger>
          <DialogContent className="bg-white h-[90vh] sm:h-auto overflow-y-auto p-6">
            <div className="text-gray-600 space-y-4 text-sm sm:text-base pr-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">How to Use</h2>
              <p>Content coming soon...</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
            Custom Tools
          </DialogTrigger>
          <DialogContent className="bg-white h-[90vh] sm:h-auto overflow-y-auto p-6">
            <div className="text-gray-600 space-y-4 text-sm sm:text-base pr-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Custom Tools</h2>
              <p>Content coming soon...</p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger className="text-gray-800 hover:text-gray-600 transition-colors font-medium text-[13px] min-[500px]:text-base">
            Contact Us
          </DialogTrigger>
          <DialogContent className="bg-white h-[90vh] sm:h-auto overflow-y-auto p-6">
            <div className="text-gray-600 space-y-4 text-sm sm:text-base pr-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Us</h2>
              <p>Content coming soon...</p>
            </div>
          </DialogContent>
        </Dialog>
      </nav>
    </header>
  );
} 