
import { firebaseAuth } from '../config/firebase.js';

export const registerUser = async ({ email, password, displayName }) =>
{
  return await firebaseAuth.createUser(
  {
    email,
    password,
    ...(displayName ? { displayName } : {}),
  });
};
