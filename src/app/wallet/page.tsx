"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/app/AppContext';
import { Wallet, Copy, AlertTriangle, Send, TrendingUp } from 'lucide-react';
import QRCode from 'qrcode';

export default function WalletPage() {
    const { currentUser, transferFunds, buyCrypto, sellCrypto, requestWithdrawal } = useAppContext();
    const [activeTab, setActiveTab] = useState<'deposit' | 'crypto' | 'withdraw'>('deposit');
    const [address, setAddress] = useState('');
    const [balance, setBalance] = useState('0.0');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [recipientUsername, setRecipientUsername] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferMessage, setTransferMessage] = useState('');
    
    // Crypto state
    const [cryptoPrices, setCryptoPrices] = useState<{ [key: string]: number }>({});
    const [portfolio, setPortfolio] = useState<{ [key: string]: number }>({});
    const [selectedCrypto, setSelectedCrypto] = useState('BTC');
    const [cryptoAmount, setCryptoAmount] = useState('');
    const [cryptoMessage, setCryptoMessage] = useState('');
    const [isTrading, setIsTrading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);

    // Withdrawal state
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [ethAddress, setEthAddress] = useState('');
    const [withdrawMessage, setWithdrawMessage] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

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

        const fetchCryptoData = async () => {
            try {
                const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin&vs_currencies=usd');
                const priceData = await priceRes.json();
                const prices = {
                    BTC: priceData.bitcoin?.usd || 0,
                    ETH: priceData.ethereum?.usd || 0,
                    SOL: priceData.solana?.usd || 0,
                    DOGE: priceData.dogecoin?.usd || 0
                };
                setCryptoPrices(prices);

                const portfolioRes = await fetch('/api/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getCryptoPortfolio', payload: { userId: currentUser.id } })
                });
                const portfolioData = await portfolioRes.json();
                setPortfolio(portfolioData.holdings || {});

                const historyRes = await fetch('/api/action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'getCryptoHistory', payload: { userId: currentUser.id } })
                });
                const historyData = await historyRes.json();
                setTransactions(historyData.transactions || []);
            } catch (e) {
                console.error("Failed to fetch crypto data", e);
            }
        };

        fetchWalletInfo();
        fetchCryptoData();
        const interval = setInterval(() => {
            fetchWalletInfo();
            fetchCryptoData();
        }, 5000);
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

    const handleBuyCrypto = async () => {
        if (!cryptoAmount || !selectedCrypto) {
            setCryptoMessage('Please enter amount');
            setTimeout(() => setCryptoMessage(''), 3000);
            return;
        }
        setIsTrading(true);
        const result = await buyCrypto(selectedCrypto, Number(cryptoAmount), cryptoPrices[selectedCrypto]);
        if (result.success) {
            setCryptoMessage('Purchase successful!');
            setCryptoAmount('');
            const portfolioRes = await fetch('/api/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getCryptoPortfolio', payload: { userId: currentUser?.id } })
            });
            const portfolioData = await portfolioRes.json();
            setPortfolio(portfolioData.holdings || {});
        } else {
            setCryptoMessage(result.error || 'Purchase failed');
        }
        setIsTrading(false);
        setTimeout(() => setCryptoMessage(''), 3000);
    };

    const handleSellCrypto = async () => {
        if (!cryptoAmount || !selectedCrypto) {
            setCryptoMessage('Please enter amount');
            setTimeout(() => setCryptoMessage(''), 3000);
            return;
        }
        setIsTrading(true);
        const result = await sellCrypto(selectedCrypto, Number(cryptoAmount), cryptoPrices[selectedCrypto]);
        if (result.success) {
            setCryptoMessage('Sale successful!');
            setCryptoAmount('');
            const portfolioRes = await fetch('/api/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getCryptoPortfolio', payload: { userId: currentUser?.id } })
            });
            const portfolioData = await portfolioRes.json();
            setPortfolio(portfolioData.holdings || {});
        } else {
            setCryptoMessage(result.error || 'Sale failed');
        }
        setIsTrading(false);
        setTimeout(() => setCryptoMessage(''), 3000);
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
            setWithdrawMessage('Invalid amount');
            return;
        }
        if (!ethAddress) {
            setWithdrawMessage('Please enter Ethereum address');
            return;
        }
        setIsWithdrawing(true);
        const result = await requestWithdrawal(parseFloat(withdrawAmount));
        setWithdrawMessage(result.message || result.error || 'Withdrawal requested');
        if (result.success) {
            setWithdrawAmount('');
            setEthAddress('');
        }
        setIsWithdrawing(false);
        setTimeout(() => setWithdrawMessage(''), 3000);
    };

    const portfolioValue = Object.entries(portfolio).reduce((total, [symbol, amount]) => {
        return total + (amount * (cryptoPrices[symbol] || 0));
    }, 0);

    return (
        <div className="max-w-2xl mx-auto mt-8 mb-12">
            {/* Tab Navigation */}
            <div className="flex gap-4 mb-8 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('deposit')}
                    className={`px-4 py-3 font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                        activeTab === 'deposit'
                            ? 'text-amber-500 border-b-2 border-amber-500'
                            : 'text-slate-400 hover:text-slate-300'
                    }`}
                >
                    <Wallet className="w-4 h-4" />Deposits
                </button>
                <button
                    onClick={() => setActiveTab('crypto')}
                    className={`px-4 py-3 font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                        activeTab === 'crypto'
                            ? 'text-cyan-500 border-b-2 border-cyan-500'
                            : 'text-slate-400 hover:text-slate-300'
                    }`}
                >
                    <TrendingUp className="w-4 h-4" />Trading
                </button>
                <button
                    onClick={() => setActiveTab('withdraw')}
                    className={`px-4 py-3 font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                        activeTab === 'withdraw'
                            ? 'text-emerald-500 border-b-2 border-emerald-500'
                            : 'text-slate-400 hover:text-slate-300'
                    }`}
                >
                    <Send className="w-4 h-4" />Withdraw
                </button>
            </div>

            {/* Deposit Tab */}
            {activeTab === 'deposit' && (
                <div>
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
                            <p>This system uses the Sepolia Ethereum Testnet. Do NOT send real ETH or any other real cryptocurrency to this address.</p>
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
                            <p className="text-sm text-slate-400 mt-2">Any balance sent to this address will be automatically credited to your casino account shortly.</p>
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
                                        transferMessage.includes('successful') ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'
                                    }`}>
                                        {transferMessage}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Crypto Trading Tab */}
            {activeTab === 'crypto' && (
                <div>
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
                        <TrendingUp className="w-8 h-8 text-cyan-500" />
                        <div>
                            <h1 className="text-3xl font-bold">Crypto Trading</h1>
                            <p className="text-slate-400">Trade virtual cryptocurrencies.</p>
                        </div>
                    </div>

                    {/* Current Prices */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {Object.entries(cryptoPrices).map(([symbol, price]) => (
                            <div key={symbol} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{symbol}</p>
                                <p className="text-xl font-bold text-cyan-400">${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                            </div>
                        ))}
                    </div>

                    {/* Portfolio Summary */}
                    <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-2xl p-6 mb-8">
                        <p className="text-sm text-slate-400 mb-2">Portfolio Value</p>
                        <p className="text-3xl font-bold text-cyan-400">${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                        <div className="mt-4 space-y-2">
                            {Object.entries(portfolio).length > 0 ? (
                                Object.entries(portfolio).map(([symbol, amount]) => (
                                    <div key={symbol} className="flex justify-between text-sm">
                                        <span className="text-slate-400">{symbol}: {amount.toFixed(8)}</span>
                                        <span className="text-cyan-400">${(amount * (cryptoPrices[symbol] || 0)).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm">No holdings yet</p>
                            )}
                        </div>
                    </div>

                    {/* Trading Interface */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl mb-8">
                        <h2 className="text-xl font-bold mb-6">Trade Crypto</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2 block">Select Cryptocurrency</label>
                                <select
                                    value={selectedCrypto}
                                    onChange={(e) => setSelectedCrypto(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                                >
                                    {Object.keys(cryptoPrices).map(symbol => (
                                        <option key={symbol} value={symbol}>{symbol}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2 block">Amount ({selectedCrypto})</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={cryptoAmount}
                                    onChange={(e) => setCryptoAmount(e.target.value)}
                                    step="0.00000001"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div className="text-sm text-slate-400 bg-slate-950 rounded-lg p-3">
                                <p>Price: ${cryptoPrices[selectedCrypto]?.toLocaleString('en-US', { maximumFractionDigits: 2 }) || '0'}</p>
                                <p>Total: ${(Number(cryptoAmount) * (cryptoPrices[selectedCrypto] || 0)).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button
                                    onClick={handleBuyCrypto}
                                    disabled={isTrading}
                                    className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold uppercase tracking-wider transition-colors"
                                >
                                    {isTrading ? 'Trading...' : 'Buy'}
                                </button>
                                <button
                                    onClick={handleSellCrypto}
                                    disabled={isTrading || !portfolio[selectedCrypto]}
                                    className="py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold uppercase tracking-wider transition-colors"
                                >
                                    {isTrading ? 'Trading...' : 'Sell'}
                                </button>
                            </div>
                            {cryptoMessage && (
                                <div className={`text-center py-2 px-3 rounded-lg text-sm ${
                                    cryptoMessage.includes('successful') ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'
                                }`}>
                                    {cryptoMessage}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction History */}
                    {transactions.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {transactions.map((tx, idx) => {
                                    // Handle both camelCase and lowercase column names from database
                                    const amount = tx.amount ?? tx.amount ?? 0;
                                    const totalValue = tx.totalvalue ?? tx.totalValue ?? (amount * (tx.priceatransaction ?? tx.priceAtTransaction ?? 0));
                                    const timestamp = tx.timestamp ?? new Date().toISOString();
                                    const cryptoSymbol = tx.cryptosymbol ?? tx.cryptoSymbol ?? 'N/A';
                                    const type = tx.type ?? 'N/A';
                                    
                                    return (
                                        <div key={idx} className="bg-slate-950 border border-slate-700 rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-white">{type} {cryptoSymbol}</p>
                                                <p className="text-xs text-slate-500">{new Date(timestamp).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-cyan-400">{Number(amount).toFixed(8)}</p>
                                                <p className={`text-sm ${type === 'BUY' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    ${Number(totalValue).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Withdrawal Tab */}
            {activeTab === 'withdraw' && (
                <div>
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
                        <Send className="w-8 h-8 text-emerald-500" />
                        <div>
                            <h1 className="text-3xl font-bold">Request Withdrawal</h1>
                            <p className="text-slate-400">Withdraw funds to your Ethereum wallet</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Withdrawal Amount ($)</label>
                            <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Ethereum Wallet Address</label>
                            <input
                                type="text"
                                value={ethAddress}
                                onChange={(e) => setEthAddress(e.target.value)}
                                placeholder="0x..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-2">Your address will NOT be stored. Save a screenshot for verification.</p>
                        </div>

                        {withdrawMessage && (
                            <div className={`p-4 rounded-lg border ${
                                withdrawMessage.includes('Withdrawal requested')
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                                {withdrawMessage}
                            </div>
                        )}

                        <button
                            onClick={handleWithdraw}
                            disabled={isWithdrawing || !withdrawAmount || !ethAddress}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold uppercase tracking-wider transition-colors"
                        >
                            {isWithdrawing ? 'Processing...' : 'Request Withdrawal'}
                        </button>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <p className="text-sm text-amber-300">
                                <strong>Note:</strong> Withdrawal requests will be reviewed by an administrator. Your address is shown for confirmation only and is not saved.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
