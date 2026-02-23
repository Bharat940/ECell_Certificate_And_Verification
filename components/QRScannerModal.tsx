import { useState } from 'react';
import { Scanner, useDevices } from '@yudiel/react-qr-scanner';
import { X, QrCode, Camera } from 'lucide-react';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
    const devices = useDevices();
    const [selectedDevice, setSelectedDevice] = useState<string | undefined>(undefined);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 z-10">
                    <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">Scan QR Code</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                        title="Close Scanner"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-black relative flex items-center justify-center overflow-hidden min-h-[300px] aspect-square">
                    <Scanner
                        onScan={(detectedCodes) => {
                            if (detectedCodes && detectedCodes.length > 0) {
                                onScan(detectedCodes[0].rawValue);
                            }
                        }}
                        onError={(error) => {
                            console.error('QR Scanner error:', error);
                        }}
                        sound={false}
                        components={{
                            onOff: false,
                            torch: true,
                            zoom: true,
                            finder: true,
                        }}
                        constraints={{
                            deviceId: selectedDevice,
                        }}
                    />
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col gap-4">
                    {devices.length > 1 && (
                        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                            <Camera className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
                            <select
                                value={selectedDevice || ''}
                                onChange={(e) => setSelectedDevice(e.target.value || undefined)}
                                className="w-full bg-transparent text-sm text-white focus:outline-none cursor-pointer p-1"
                            >
                                <option value="" className="bg-slate-900">Default Camera</option>
                                {devices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId} className="bg-slate-900">
                                        {device.label || `Camera ${device.deviceId.substring(0, 5)}...`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <p className="text-sm text-slate-400 text-center">
                        Position the QR code within the frame to automatically verify the certificate.
                    </p>
                </div>
            </div>
        </div>
    );
}
