// src/components/Modal.tsx
import type { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

const Modal = ({ children, onClose }: ModalProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#000000cc] backdrop-blur-sm flex items-center justify-center px-4">
      <div className="relative bg-gray-900 text-white rounded-2xl w-full max-w-md p-8 shadow-xl border border-gray-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none focus:outline-none"
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
