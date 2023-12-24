import React, { useState, useRef, useEffect } from 'react'
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../soket';
import ACTIONS from '../Actions';
import toast from 'react-hot-toast';
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams
} from 'react-router-dom';

const EditorPage = () => {

  // to fetch the state data from Home page 
  const location = useLocation();
  // to navigate
  const reactNavigator = useNavigate();

  // fetch the roomId from the url of the page using Route in  App.js file
  const { roomId } = useParams();

  const [clients, setClients] = useState([]);

  // useRef is used when we don't want to re-render our component when value changes
  const socketRef = useRef(null);

  // to get the code from child component Editor
  const codeRef = useRef(null);

  useEffect(() => {
    const init = async () => {

      // here we call the initSocket to start the socket
      socketRef.current = await initSocket();

      // TO hanndle errors during connection of socket
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      // here we create this function to handle the errors, basically we generate some error toast ans redirect to Home page
      function handleErrors(e) {
        console.log('socket error', e);
        toast.error('Socket connection failed, try again later.');
        reactNavigator('/');
      }

      // when soket is connected this function will triggered
      // then we have to listen in Server side and we can access the roomId and userName
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        userName: location.state?.userName
      });

      // Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, userName, socketId }) => {
          if (userName !== location.state?.userName) {
            toast.success(`${userName} joined the room.`);
            console.log(`${userName} joined`);
          }
          setClients(clients);

          // Emit here -> To Synch the code when a new client is connected
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // listening for disconnected event
      socketRef.current.on(
        ACTIONS.DISCONNECTED,
        ({ socketId, userName }) => {
          toast.success(`${userName} left the room.`);
          // update the clients list, with remove the current socketId
          setClients((prev) => {
            return prev.filter(
              (client) => client.socketId !== socketId
            );
          });
        });
    }

    init();
    /* After all the work dont by soket, we have to always remenber that to clear, 
      otherwise there is chance of memory leaks. 
      We have to done this process in cleaning function.
      In useEffect when we retun something then this function is Cleaning function
      When all the components are unbounded then this function will be called
    */
    return () => {
      // clear the listners,
      // Here we suscribe the two events DISCONNECTED and JOINED, so now we have to
      // unsubscribe
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);

      // disconnect the socket
      socketRef.current.disconnect();
    }
  }, []);


  // function to handle copy the room id
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (error) {
      toast.error('Could not copy Room ID');
      console.error(error);
    }
  }

  // function to handle leave the room
  const leaveRoom = () => {
    reactNavigator('/');
  }


  // if we cant get the state then also we have to redirect to home page
  if (!location.state) {
    return <Navigate to="/" />
  }


  return (
    <div className='mainWrap'>
      <div className='aside'>
        <div className='asideInner'>
          {/* logo */}
          <div className='logo'>
            <img src="/code-sync.png" alt="logo" className='logoImage' />
          </div>
          <h3>Connect</h3>
          <div className='clientsList'>
            {
              clients.map((client) => (
                <Client key={client.socketId} userName={client.userName} />
              ))
            }
          </div>

        </div>
        <button className='btn copyBtn' onClick={copyRoomId}>
          Copy Room ID
        </button>

        <button className='btn leaveBtn' onClick={leaveRoom}>
          Leave
        </button>
      </div>

      <div className='editorWrap'>
      {/* Here we pass the soketRef object to the Editor component */}
        <Editor
          socketRef={socketRef}
          roomId={roomId} 
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
          />
      </div>
    </div>
  )
}

export default EditorPage