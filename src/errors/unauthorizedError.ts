import ApiError from "./apiError";

class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized'){
        super(401, message);
        Object.setPrototypeOf(this, UnauthorizedError.prototype); // Preserve the prototype chain
    }
}


export default UnauthorizedError;