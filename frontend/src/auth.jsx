import { createContext, useEffect, useState } from "react";
import {authApi} from "./api";
export const AuthContext = createContext();
export function AuthProvider({children}) {
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(() =>{
    authApi.getMe().then((response)=> {setUser(response.data.data);
      }).catch(() => {
        localStorage.removeItem("queuewise_token");
      }).finally(() => {
        setLoading(false);});
  },[]);
 const login=({user,token})=>{
    localStorage.setItem("queuewise_token", token);
    setUser(user);
  };

  const logout=()=>{ localStorage.removeItem("queuewise_token");
    setUser(null);
  };
return (
    <AuthContext.Provider value={{user,loading,login,logout }}>{children}</AuthContext.Provider>);
}
