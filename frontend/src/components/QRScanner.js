import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from './ui/button';

const QRScanner = ({ onScan, onError }) => {
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    qrScanner.render(
      (decodedText) => {
        onScan(decodedText);
        qrScanner.clear();
      },
      (error) => {
        console.error(error);
      }
    );

    setScanner(qrScanner);

    return () => {
      if (qrScanner) {
        qrScanner.clear().catch((err) => console.error(err));
      }
    };
  }, [onScan]);

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="w-full"></div>
      <div className="text-center text-sm text-muted-foreground">
        Position the QR code within the frame
      </div>
    </div>
  );
};

export default QRScanner;