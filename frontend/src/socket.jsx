import {createContext, useEffect, useMemo} from "react";
import {io} from "socket.io-client";
export const SocketContext = createContext(null);
export function SocketProvider({children}) {
  const socket = useMemo(()=> {
    return io(
      import.meta.env.VITE_SOCKET_URL||"http://localhost:5000"
    );
  }, []);
  useEffect(() => {
return () => { socket.disconnect();
    }
  },[socket]);
  return (<SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}