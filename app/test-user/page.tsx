'use client';

import { useEffect, useState } from 'react';

export default function TestUserPage() {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user_info');
    if (stored) {
      setUserInfo(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Info Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(userInfo, null, 2)}
      </pre>
    </div>
  );
}
