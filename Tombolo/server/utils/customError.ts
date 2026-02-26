class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default CustomError;

// // Test case 1: Create a CustomError instance and check properties
// const error1 = new CustomError('Not Found', 404);
// console.log(error1.message); // Output: Not Found
// console.log(error1.statusCode); // Output: 404
// console.log(error1 instanceof Error); // Output: true
// console.log(error1 instanceof CustomError); // Output: true

// // Test case 2: Create another CustomError instance with different values
// const error2 = new CustomError('Internal Server Error', 500);
// console.log(error2.message); // Output: Internal Server Error
// console.log(error2.statusCode); // Output: 500
// console.log(error2 instanceof Error); // Output: true
// console.log(error2 instanceof CustomError); // Output: true
