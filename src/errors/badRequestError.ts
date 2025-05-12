import ApiError from "./apiError";


class BadRequestError extends ApiError {
    constructor(message = 'Bad Request'){
        super(400, message);
        Object.setPrototypeOf(this, BadRequestError.prototype); // Preserve the prototype chain
    }
}


export default BadRequestError;