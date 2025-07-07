// src/components/Modal.tsx
// src/components/Modal.tsx
import type { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

const Modal = ({ children, onClose }: ModalProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#000000cc] backdrop-blur-sm flex items-center justify-center px-4">
      <div className="relative bg-[#4B1F1F] text-[#E7D8C1] rounded-2xl w-full max-w-md p-8 shadow-xl border border-[#D1A75D]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#D1A75D] hover:text-white text-2xl leading-none focus:outline-none"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Modal Content */}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
