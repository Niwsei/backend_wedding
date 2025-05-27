import bcrypt from 'bcrypt';

const saltRounds = 10;

interface HashedPasswordResult {
  hash: string;
  salt: string;
}



 
const hashPassword = async (password: string): Promise<string> => { // <--- เปลี่ยน Return Type
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash; // <--- คืนค่า hash string
  } catch (error: any) {
    console.error('Error hashing password:', error);
    throw error;
  }
};

 const comparePassword = async (password: string, hashPassword: string): Promise<boolean> => {
  /* return await bcrypt.compare(password, hash); */
  try {
    return await bcrypt.compare(password, hashPassword)
  } catch (error: any) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};


export { hashPassword, comparePassword };



 /*  const hashPassword = async (password: string, customSalt: string | null = null): Promise<HashedPasswordResult> => {
  try {
    const salt = customSalt || await bcrypt.genSalt(saltRounds)
    const hash = await bcrypt.hash(password, salt);
    return { hash, salt };
  } catch (error: any) {
    console.error('Error hashing password:', error);
    throw error;
  }
}; */