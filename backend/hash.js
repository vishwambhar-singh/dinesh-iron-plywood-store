import bcrypt from 'bcrypt';

const generateHash = async (plainTextPassword) => {
    const saltRounds = 10;
    const hash = await bcrypt.hash(plainTextPassword, saltRounds);
    console.log(hash);
};

generateHash('Xtylish@2026');