import { io } from 'socket.io-client';


export const initSocket = async () => {
    const options = {
        'force new connection': true,
        reconnectionAttempt: 'Infinity', // It is used to re-establish connection Infinitely
        timeout: 10000,
        transports: ['websocket'],
        withCredentials: true,
        // extraHeaders: {
        //     "my-custom-header": "abcd"
        // }
    };
    // here we provide the url and some options to the soket client
    return io(process.env.REACT_APP_BACKEND_URL, options);
};