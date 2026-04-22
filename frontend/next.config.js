/** @type {import('next').NextConfig} */
module.exports = {
  env: { NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API || 'http://localhost:5000/api' }
};
