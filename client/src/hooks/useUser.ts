import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  points: number;
}

async function fetchUser(): Promise<{ user: User } | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error("Failed to fetch user");
  }
  
  return response.json();
}

export function useUser() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: data?.user,
    isLoading,
    error,
  };
}
