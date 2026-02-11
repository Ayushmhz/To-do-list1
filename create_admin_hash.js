const bcrypt = require('bcrypt');

const password = 'Admin@123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    console.log('\n✅ Bcrypt hash for "Admin@123":');
    console.log(hash);
    console.log('\nCopy this hash and paste it into database_setup_postgres.sql');
});
