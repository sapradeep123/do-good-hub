declare global {
    namespace Express {
      interface UserPayload {
        id: number | string;
        userId?: number | string;
        role: 'admin' | 'ngo' | 'vendor' | 'user';
        ngoId?: number | string | null;
        vendorId?: number | string | null;
      }
      interface Request {
        user?: UserPayload;
      }
    }
  }
  export {};
  