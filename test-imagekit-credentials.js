import ImageKit from 'imagekit';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing ImageKit Credentials...');
console.log('====================================');

// Check if environment variables are loaded
console.log('Environment Variables:');
console.log(
  'IMAGEKIT_PUBLIC_KEY:',
  process.env.IMAGEKIT_PUBLIC_KEY ? 'SET' : 'NOT SET'
);
console.log(
  'IMAGEKIT_PRIVATE_KEY:',
  process.env.IMAGEKIT_PRIVATE_KEY ? 'SET' : 'NOT SET'
);
console.log(
  'IMAGEKIT_URL_ENDPOINT:',
  process.env.IMAGEKIT_URL_ENDPOINT || 'NOT SET'
);

if (
  !process.env.IMAGEKIT_PUBLIC_KEY ||
  !process.env.IMAGEKIT_PRIVATE_KEY ||
  !process.env.IMAGEKIT_URL_ENDPOINT
) {
  console.error('❌ Missing ImageKit credentials in environment variables');
  process.exit(1);
}

// Test ImageKit initialization
try {
  const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });

  console.log('✅ ImageKit instance created successfully');

  // Test a simple operation (list files)
  console.log('Testing ImageKit connection...');

  const files = await imagekit.listFiles({
    limit: 1,
  });

  console.log('✅ ImageKit connection successful!');
  console.log('Account files found:', files.length);
} catch (error) {
  console.error('❌ ImageKit connection failed:');
  console.error('Error message:', error.message);
  console.error('Error details:', error);

  if (error.message.includes('cannot be authenticated')) {
    console.log('\n🔍 Troubleshooting tips:');
    console.log('1. Verify your credentials in ImageKit dashboard');
    console.log('2. Make sure Public Key starts with "public_"');
    console.log('3. Make sure Private Key starts with "private_"');
    console.log(
      '4. Check that URL endpoint matches: https://ik.imagekit.io/YOUR_ID'
    );
    console.log('5. Ensure your ImageKit account is active');
  }
}
