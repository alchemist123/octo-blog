export class RequestException extends Error {
    public STATUS_CODE = 400;
    public message: string;
    public data: any;
    constructor(message: string, data?: any) {
      super(message);
      Object.setPrototypeOf(this, RequestException.prototype);
      this.message = message;
      this.data = data;
    }
  }
  