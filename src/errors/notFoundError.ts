import ApiError from "./apiError";


class NotFoundError extends ApiError {
    constructor(message = 'Not Found'){
        super(404, message);
        Object.setPrototypeOf(this, NotFoundError.prototype); // Preserve the prototype chain
    }
}


export default NotFoundError;