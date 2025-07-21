// exports.getUserDetails = async (req, usernames) => {
//   try {
//     let token = req.headers['x-access-token'] || req.headers['authorization'];
//     if (token.startsWith('Bearer ')) {
//       token = token.slice(7);
//     }
//     const authServiceUrl = `${process.env.AUTH_SERVICE_URL.replace('auth', 'users')}/details?usernames=${usernames}`;
//     const cookie = `auth=${token}`;

//     const response = await axios.get(authServiceUrl, {
//       headers: {
//         'content-type': 'application/json',
//         Cookie: cookie,
//       },
//     });

//     return response.data;
//   } catch (err) {
//     throw err;
//   }
// };
