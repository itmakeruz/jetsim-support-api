// import axios from "axios";
// import { HttpsProxyAgent } from "https-proxy-agent";

// export default class Client {
//     private connection
//     constructor(apiKey, options?) {
//         const config = {
//             timeout: 2,
//             protocol: 'https',
//             host: 'ws.detectlanguage.com',
//             apiVersion: '0.2',
//             userAgent: `detectlanguage-node/2.1.0`,
//             ...options
//         };

//         const headers = {
//             'User-Agent': config.userAgent,
//             Authorization: `Bearer ${apiKey}`,
//         };

//         this.connection = axios.create({
//             headers,
//             baseURL: `${config.protocol}://${config.host}/${config.apiVersion}/`,
//             timeout: config.timeout * 1000
//         });
//     }

//     async get(path) {
//         try {
//             const response = await this.connection.get(path);

//             return response.data;
//         } catch (e) {
//             console.log(e)
//             return null
//         }
//     }

//     async post(path, data) {
//         try {
//             const response = await this.connection.post(path, data);

//             return response.data;
//         } catch (e) {
//             console.log(e)
//             return null
//         }
//     }
// }
