import { useState, useEffect } from "react";

export interface MockUser {
  id: number;
  openId: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

const MOCK_USER: MockUser = {
  id: 1,
  openId: "mock-orlova-maria",
  name: "Орлова Мария",
  email: "orlova.maria@example.com",
  role: "user",
};

export function useMockAuth() {
  const [user] = useState<MockUser>(MOCK_USER);
  const [loading] = useState(false);

  return {
    user,
    loading,
    error: null,
    isAuthenticated: true,
    logout: () => {
      // Mock logout - do nothing
      console.log("Mock logout");
    },
  };
}
