import React from 'react';

const Logo: React.FC = () => {
  return (
    <div style={{ padding: '10px', textAlign: 'center' }}>
      <svg
        width="180"
        height="40"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="180" height="40" rx="4" fill="#1a365d" />
        
        {/* Water waves */}
        <path
          d="M5 28C15 20 25 36 35 28C45 20 55 36 65 28C75 20 85 36 95 28"
          stroke="#4299e1"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M5 32C15 24 25 40 35 32C45 24 55 40 65 32C75 24 85 40 95 32"
          stroke="#63b3ed"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Ship/boat */}
        <path
          d="M30 15L50 15L55 26L25 26Z"
          fill="#4299e1"
          stroke="#2b6cb0"
          strokeWidth="1"
        />
        
        {/* Ship cabin */}
        <rect x="35" y="10" width="10" height="5" fill="#2b6cb0" />
        
        {/* Flag */}
        <line x1="40" y1="10" x2="40" y2="5" stroke="#2b6cb0" strokeWidth="1" />
        <path d="M40 5L45 6L40 7Z" fill="#e53e3e" />
        
        <text x="75" y="24" fontFamily="Arial" fontSize="14" fontWeight="bold" fill="white">Bunker Boats</text>
      </svg>
    </div>
  );
};

export default Logo; 