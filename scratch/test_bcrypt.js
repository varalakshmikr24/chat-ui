const bcrypt = require('bcryptjs');

async function test() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Hash:', hash);
  const isMatch = await bcrypt.compare(password, hash);
  console.log('Match:', isMatch);
  const isNotMatch = await bcrypt.compare('wrong', hash);
  console.log('Not Match:', isNotMatch);
}

test();
