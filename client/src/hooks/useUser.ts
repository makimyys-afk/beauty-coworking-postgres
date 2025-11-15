import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  points: number;
}

export function useUser() {
  const { data, isLoading, error } = useQuery<{ user: User }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    user: data?.user,
    isLoading,
    error,
  };
}
