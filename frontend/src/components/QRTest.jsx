import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRTest() {
  const [testText, setTestText] = useState("upi://pay?pa=test@upi&pn=Test&am=100&cu=INR");

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>QR Code Test</h3>
      <input 
        type="text" 
        value={testText} 
        onChange={(e) => setTestText(e.target.value)}
        style={{ width: '100%', maxWidth: '400px', marginBottom: '20px', padding: '8px' }}
      />
      <div style={{ marginBottom: '20px' }}>
        <QRCodeCanvas 
          value={testText} 
          size={200}
          level="H"
          includeMargin={true}
          style={{ 
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '8px',
            border: '2px solid #333'
          }}
        />
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        <strong>QR Content:</strong> {testText}
      </div>
    </div>
  );
}


