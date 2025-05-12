class ApiError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
  
    constructor(statusCode: number, message: string, isOperational: boolean = true, stack = '') {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      Object.setPrototypeOf(this, new.target.prototype); // Maintain prototype chain
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }
  export default ApiError;