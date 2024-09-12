export interface IAuth {
  message: string;
  address: string;
  publicKey: string;
  signature: string;
}

export interface IJwt {
  authToken: string;
}
