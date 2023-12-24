import React, { useState } from 'react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

const Home = () => {

    const [roomId, setRoomId] = useState("");
    const [userName, setUserName] = useState("");
    const navigate = useNavigate();

    const createNewRoom = () => {
        const id = uuid();
        setRoomId(id);
        toast.success("Created a new room");
    }

    const joinRoom = () => {
        if (!roomId || !userName) {
            toast.error("Room Id and User Name are both required");
            return;
        }
        // redirect
        navigate(`/editor/${roomId}`, {
            state: { // this state is used to transfer the data from this component to where we want to go
                userName
            }
        })
    }

    // TO handle the "Enter key pressing "
    const handleEnterPressed = (e) => {
        if (e.code === "Enter") {
            joinRoom();
        }
    }

    return (
        <div className='homePageWrapper'>
            <div className='formWrapper'>
                <img className='homePageLogo' src="/code-sync.png" alt="code-sync-logo" />
                <h4 className='mainLabel'>Paste invitation Room ID</h4>
                <div className='inputGroup'>
                    <input
                        type="text"
                        name="roomId"
                        id="roomId"
                        className='inputBox'
                        placeholder='ROOM ID:'
                        onChange={(e) => setRoomId(e.target.value)}
                        value={roomId}
                        onKeyUp={handleEnterPressed}
                    />
                    <input
                        type="text"
                        name="userName"
                        id="userName"
                        className='inputBox'
                        placeholder='USER NAME:'
                        onChange={(e) => setUserName(e.target.value)}
                        value={userName}
                        onKeyUp={handleEnterPressed}
                    />

                    <button className='btn joinBtn' onClick={joinRoom} >Join</button>
                    <span className='createInfo'>
                        If you don't have an invite then &nbsp;
                        <span className='createNewBtn' onClick={() => createNewRoom()}>new room</span>
                    </span>
                </div>
            </div>

            <footer>
                <h4>
                    Built with 💛 &nbsp; by <a href="https://github.com/BidyasagarAnupam" target='_blank'>Bidyasagar</a>
                </h4>
            </footer>
        </div>
    )
}

export default Home