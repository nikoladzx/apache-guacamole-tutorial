import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({ 
   baseUrl: "http://192.168.1.3:5000", 
  withCredentials:true,
 });

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ["User"],
  endpoints: () => ({}),
});
