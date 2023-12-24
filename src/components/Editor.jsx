import React, { useEffect, useRef } from 'react'
import Codemirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/dracula.css'
import 'codemirror/addon/edit/closetag'
import 'codemirror/addon/edit/closebrackets'
import ACTIONS from '../Actions';
// import 'codemirror/addon/hint/show-hint' 
// import 'codemirror/addon/hint/javascript-hint'

const Editor = ({ socketRef, roomId, onCodeChange }) => {

  console.log("ROOMID EDITOR ", roomId);

  const editorRef = useRef(null);


  useEffect(() => {
    async function init() {

      // store the instance of codemirror in useRef hook
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById('realtimeEditor'),
        {
          mode: { name: 'javascript', json: true },
          theme: 'dracula',
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
          // extraKeys: { "Ctrl-Space": "autocomplete" },
        }
      );
      // 'change' is an event inside codemirror, when any change in the editor
      // this will triggered
      editorRef.current.on('change', (instance, changes) => {

        /*
        origin is a value inside changes which give the value, how the data is insetred
        like: +input, cut, delete, paste, copy and many more
        but when we set the value dynamically then the value of origin will be setValue
        */
        const { origin } = changes;
        // fetch the text
        const code = instance.getValue();

        // pass the code to the Parent Component using prop function
        onCodeChange(code);

        console.log("Code is " + code);
        // see the above comment
        if (origin !== 'setValue') {
          // here we emit an event to the server using soketRef
          // and we send some data to the server
          // Yahan se jo hum bhej rehe hain wo jo code change kiya hoga aapne editor se wahan se send hoga and usko hum Server pe listen kar rehe hain and wahan se bhi send kar rehe hain jo ki dushre user ke pass aayega uske code niche hi hai next useEffect main

          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });
    }
    init();
  }, []);

  // listen the CODE_CHANGE event
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }

    // unsubscribe the CODE_CHANGE event
    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
    };
  },[socketRef.current]);

  return <textarea id="realtimeEditor"></textarea>;
}

export default Editor