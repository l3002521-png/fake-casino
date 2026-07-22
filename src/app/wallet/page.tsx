"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/app/AppContext';
import { Wallet, Copy, AlertTriangle, Send } from 'lucide-react';
import QRCode from 'qrcode';

export default function WalletPage() {
    const { currentUser, transferFunds } = useAppContext();
    const [address, setAddress] = useState('');
    const [balance, setBalance] = useState('0.0');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [recipientUsername, setRecipientUsername] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferMessage, setTransferMessage] = useState('');

    useEffect(() => {
        if (!currentUser) return;

        const fetchWalletInfo = async () => {
            try {
                const res = await fetch('/api/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getDepositInfo', payload: { userId: currentUser.id } })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setAddress(data.address);
                        setBalance(data.balance);
                        if (data.address) {
                            QRCode.toDataURL(data.address, { width: 300, margin: 2 }, (err, url) => {
                                if (!err) setQrCodeUrl(url);
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to fetch wallet info", e);
            }
        };

        fetchWalletInfo();
        const interval = setInterval(fetchWalletInfo, 5000); // Poll for new deposits

        return () => clearInterval(interval);
    }, [currentUser]);

    const handleCopy = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTransfer = async () => {
        if (!recipientUsername || !transferAmount) {
            setTransferMessage('Please enter recipient and amount');
            setTimeout(() => setTransferMessage(''), 3000);
            return;
        }

        setIsTransferring(true);
        const result = await transferFunds(recipientUsername, Number(transferAmount));
        if (result.success) {
            setTransferMessage(result.message || 'Transfer successful!');
            setRecipientUsername('');
            setTransferAmount('');
        } else {
            setTransferMessage(result.error || 'Transfer failed');
        }
        setIsTransferring(false);
        setTimeout(() => setTransferMessage(''), 3000);
    };
    
    return (
        <div className="max-w-xl mx-auto mt-8">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
                <Wallet className="w-8 h-8 text-amber-500" />
                <div>
                    <h1 className="text-3xl font-bold">Crypto Deposit</h1>
                    <p className="text-slate-400">Top up your account balance.</p>
                </div>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mb-8">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                    <p className="font-semibold mb-1">Test Network Only</p>
                    <p>
                        This system uses the **Sepolia Ethereum Testnet**. Do NOT send real ETH or any other real cryptocurrency to this address.
                    </p>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col items-center gap-6">
                {qrCodeUrl && <img src={qrCodeUrl} alt="Deposit QR Code" className="bg-white p-2 rounded-lg" />}

                <div className="w-full text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Your Deposit Address</p>
                    <div className="relative">
                        <input 
                            type="text"
                            readOnly
                            value={address}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-4 pr-12 py-3 text-center text-sm font-mono focus:outline-none"
                        />
                        <button
                            onClick={handleCopy}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-slate-800 text-slate-400"
                        >
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                    {copied && <div className="text-xs text-emerald-400 mt-2 animate-pulse">Address copied!</div>}
                </div>
                
                <div className="text-center">
                     <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Detected Balance</p>
                     <p className="text-2xl font-mono font-bold text-amber-400">{parseFloat(balance).toFixed(6)} ETH</p>
                     <p className="text-sm text-slate-400 mt-2">
                        Any balance sent to this address will be automatically credited to your casino account shortly.
                     </p>
                </div>

            </div>

            {/* Fund Transfer Section */}
            <div className="mt-12">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                    <Send className="w-8 h-8 text-cyan-500" />
                    <div>
                        <h2 className="text-2xl font-bold">Transfer Funds</h2>
                        <p className="text-slate-400">Send money to other players.</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2 block">Recipient Username</label>
                            <input
                                type="text"
                                placeholder="Enter username"
                                value={recipientUsername}
                                onChange={(e) => setRecipientUsername(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2 block">Amount ($)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        <button
                            onClick={handleTransfer}
                            disabled={isTransferring}
                            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold uppercase tracking-wider transition-colors mt-6"
                        >
                            {isTransferring ? 'Transferring...' : 'Send Funds'}
                        </button>

                        {transferMessage && (
                            <div className={`text-center py-2 px-3 rounded-lg text-sm ${
                                transferMessage.includes('successful') || transferMessage.includes('Transfer successful')
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'bg-red-500/20 text-red-200'
                            }`}>
                                {transferMessage}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
