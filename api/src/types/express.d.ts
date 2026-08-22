declare namespace Express {
  export interface Request {
    requestId?: string;
    auth?: {
      customerId: string;
      email: string;
    };
  }
}
